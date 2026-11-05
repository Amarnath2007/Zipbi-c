const { URL } = require('url');

/**
 * Whitelist of allowed Google Maps domains for SSRF protection
 */
const ALLOWED_GOOGLE_DOMAINS = [
  'maps.app.goo.gl',
  'goo.gl',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.google.co.in',
  'google.co.in',
  'www.google.co.in',
];

/**
 * In-memory cache for reverse geocoding to prevent repeated API calls
 */
const geocodeCache = new Map();
const MAX_CACHE_SIZE = 150;

function getCachedGeocode(key) {
  return geocodeCache.get(key) || null;
}

function setCachedGeocode(key, value) {
  if (geocodeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = geocodeCache.keys().next().value;
    geocodeCache.delete(firstKey);
  }
  geocodeCache.set(key, value);
}

/**
 * Checks if a URL hostname belongs to an authorized Google Maps domain
 */
function isAllowedGoogleHost(hostname) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();

  // Reject internal / private networks and loopback
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return false;
  }

  // Check against exact whitelist or subdomain of google.com / google.co.in
  for (const allowed of ALLOWED_GOOGLE_DOMAINS) {
    if (host === allowed || host.endsWith('.' + allowed)) {
      return true;
    }
  }

  return false;
}

/**
 * Safely resolves short links (like maps.app.goo.gl/...) following up to maxRedirects
 * with SSRF protection and timeout.
 */
async function resolveShortUrl(rawUrl, maxRedirects = 5, timeoutMs = 5000) {
  let currentUrl = rawUrl.trim();
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    let parsed;
    try {
      parsed = new URL(currentUrl);
    } catch (e) {
      throw new Error(`Invalid URL format: "${currentUrl}"`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Unsupported protocol "${parsed.protocol}". Only HTTP/HTTPS URLs are allowed.`);
    }

    if (!isAllowedGoogleHost(parsed.hostname)) {
      throw new Error(`Domain "${parsed.hostname}" is not an authorized Google Maps domain.`);
    }

    const isShortener = parsed.hostname === 'maps.app.goo.gl' || parsed.hostname === 'goo.gl';

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(currentUrl, {
        method: isShortener ? 'HEAD' : 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      clearTimeout(timer);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;

        const nextUrl = new URL(location, currentUrl).href;
        const nextParsed = new URL(nextUrl);

        if (!isAllowedGoogleHost(nextParsed.hostname)) {
          throw new Error(`Redirect to unauthorized domain "${nextParsed.hostname}" blocked for security.`);
        }

        currentUrl = nextUrl;
        redirectCount++;
        continue;
      }

      if (response.ok && isShortener) {
        const text = await response.text();
        const metaMatch = text.match(/<meta[^>]*?content=["'][^"']*?url=([^"'>]+)["']/i);
        if (metaMatch && metaMatch[1]) {
          const metaUrl = new URL(metaMatch[1], currentUrl).href;
          currentUrl = metaUrl;
          redirectCount++;
          continue;
        }
      }

      break;
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        throw new Error(`Google Maps request timed out after ${timeoutMs}ms.`);
      }
      break;
    }
  }

  return currentUrl;
}

/**
 * Extracts coordinates, place name, and place ID from a Google Maps URL string
 */
function extractCoordinatesAndPlace(urlStr) {
  let decoded = urlStr;
  try {
    decoded = decodeURIComponent(urlStr);
  } catch (e) {
    // continue with raw if decode fails
  }

  let latitude = null;
  let longitude = null;
  let placeName = null;
  let placeId = null;

  // 1. Try Protobuf 3D / 4D pinpoint coordinates (!3d<lat>!4d<lon>)
  const match3d = decoded.match(/!3d(-?\d+(?:\.\d+)?)/);
  const match4d = decoded.match(/!4d(-?\d+(?:\.\d+)?)/);
  if (match3d && match4d) {
    const lat = parseFloat(match3d[1]);
    const lon = parseFloat(match4d[1]);
    if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      latitude = lat;
      longitude = lon;
    }
  }

  // 2. Try Viewport / Center @lat,lon,zoom (e.g. /@11.0358,77.0355,17z)
  if (latitude === null || longitude === null) {
    const atMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lon = parseFloat(atMatch[2]);
      if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        latitude = lat;
        longitude = lon;
      }
    }
  }

  // 3. Try query parameter coordinates (?q=lat,lon or &q=lat,lon or query=lat,lon)
  if (latitude === null || longitude === null) {
    const qMatch = decoded.match(
      /[?&](?:q|query|daddr|destination|center|ll)=(?:loc:)?(-?\d+(?:\.\d+)?)[,+ ](-?\d+(?:\.\d+)?)/i
    );
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lon = parseFloat(qMatch[2]);
      if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        latitude = lat;
        longitude = lon;
      }
    }
  }

  // 4. Try place name extraction from /place/<Place+Name>/...
  const placeMatch = decoded.match(/\/place\/([^/@?#]+)/);
  if (placeMatch && placeMatch[1]) {
    placeName = placeMatch[1].replace(/\+/g, ' ').trim();
  }

  // If place name wasn't found in /place/, check ?q= if it's text (not coordinates)
  if (!placeName) {
    const queryNameMatch = decoded.match(/[?&]q=([^&]+)/);
    if (queryNameMatch && queryNameMatch[1]) {
      const candidate = queryNameMatch[1].replace(/\+/g, ' ').trim();
      if (!/^-?\d+(?:\.\d+)?[,+ ]-?\d+(?:\.\d+)?$/.test(candidate)) {
        placeName = candidate;
      }
    }
  }

  // 5. Try Google Place ID / Feature ID extraction
  const placeIdMatch = decoded.match(/[?&]place_id=([a-zA-Z0-9_-]+)/);
  if (placeIdMatch && placeIdMatch[1]) {
    placeId = placeIdMatch[1];
  } else {
    const ftidMatch = decoded.match(/[?&]ftid=([0-9a-zA-Z_:-]+)/);
    if (ftidMatch && ftidMatch[1]) {
      placeId = ftidMatch[1];
    } else {
      const protoPlaceIdMatch = decoded.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
      if (protoPlaceIdMatch && protoPlaceIdMatch[1]) {
        placeId = protoPlaceIdMatch[1];
      }
    }
  }

  return {
    latitude,
    longitude,
    placeName,
    placeId,
  };
}

/**
 * Intelligently parse Google Maps address components to extract the most specific locality,
 * city, district, state, and postal code.
 *
 * Supports both Google Geocoding API schema (long_name) and Google Places API (New) schema (longText).
 */
function parseAddressComponents(components) {
  if (!Array.isArray(components)) return {};

  let sublocality3 = null;
  let sublocality2 = null;
  let sublocality1 = null;
  let sublocality = null;
  let neighborhood = null;
  let locality = null;
  let adminArea3 = null; // Taluk / Mandal / Sub-district
  let adminArea2 = null; // District
  let adminArea1 = null; // State
  let postalCode = null;
  let country = null;

  for (const comp of components) {
    const types = comp.types || [];
    const name = comp.long_name || comp.longText || comp.short_name || comp.shortText || '';

    if (!name) continue;

    if (types.includes('sublocality_level_3')) sublocality3 = name;
    else if (types.includes('sublocality_level_2')) sublocality2 = name;
    else if (types.includes('sublocality_level_1')) sublocality1 = name;
    else if (types.includes('sublocality')) sublocality = name;
    else if (types.includes('neighborhood')) neighborhood = name;
    else if (types.includes('locality')) locality = name;
    else if (types.includes('administrative_area_level_3')) adminArea3 = name;
    else if (types.includes('administrative_area_level_2')) adminArea2 = name;
    else if (types.includes('administrative_area_level_1')) adminArea1 = name;
    else if (types.includes('postal_code')) postalCode = name;
    else if (types.includes('country')) country = name;
  }

  // Order of specificity for the Locality/Area field:
  // We prefer the neighbourhood or sublocality over the generic city name.
  const detectedArea =
    sublocality2 ||
    sublocality1 ||
    sublocality ||
    neighborhood ||
    sublocality3 ||
    (adminArea3 && adminArea3.toLowerCase() !== (locality || '').toLowerCase() ? adminArea3 : null) ||
    locality ||
    '';

  const detectedCity = locality || (adminArea2 ? adminArea2.replace(/ District$/i, '') : '') || '';
  const detectedDistrict = adminArea2 ? adminArea2.replace(/ District$/i, '') : adminArea3 || '';
  const detectedState = adminArea1 || '';
  const detectedPostalCode = postalCode || '';
  const detectedCountry = country || 'India';

  return {
    area: detectedArea,
    city: detectedCity,
    district: detectedDistrict,
    state: detectedState,
    postalCode: detectedPostalCode,
    country: detectedCountry,
    components: {
      sublocality: sublocality1 || sublocality,
      sublocality2,
      neighborhood,
      locality,
      adminArea3,
      adminArea2,
      adminArea1,
      postalCode,
    },
  };
}

/**
 * Validates whether an identifier is a standard Google Place ID
 * (Base64-like alphanumeric string, usually starting with 'ChIJ', length 20-50, no colons).
 */
function isValidGooglePlaceId(placeId) {
  if (!placeId || typeof placeId !== 'string') return false;
  const clean = placeId.trim();
  if (clean.includes(':') || clean.startsWith('0x')) return false; // Hex feature ID, not Places API Place ID
  return /^[a-zA-Z0-9_-]{15,60}$/.test(clean);
}

/**
 * Preference 1: Google Places API (New & Legacy) Place Details
 */
async function fetchGooglePlaceDetails(placeId, apiKey) {
  if (!apiKey || !isValidGooglePlaceId(placeId)) return null;

  const cacheKey = `place_${placeId}`;
  const cached = getCachedGeocode(cacheKey);
  if (cached) return cached;

  // Try Google Places API (New) first
  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,addressComponents,location',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (res.ok) {
      const data = await res.json();
      const parsedComponents = parseAddressComponents(data.addressComponents || []);
      const result = {
        source: 'GOOGLE_PLACES_API_NEW',
        placeId: data.id || placeId,
        placeName: data.displayName ? data.displayName.text : null,
        formattedAddress: data.formattedAddress || null,
        latitude: data.location ? data.location.latitude : null,
        longitude: data.location ? data.location.longitude : null,
        ...parsedComponents,
      };
      setCachedGeocode(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('[GoogleMaps] Places API (New) lookup failed:', err.message);
  }

  // Fallback to legacy Place Details API
  try {
    const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=name,formatted_address,address_components,geometry&key=${apiKey}`;
    const res = await fetch(legacyUrl, { signal: AbortSignal.timeout(4500) });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK' && data.result) {
        const parsedComponents = parseAddressComponents(data.result.address_components || []);
        const result = {
          source: 'GOOGLE_PLACE_DETAILS_LEGACY',
          placeId,
          placeName: data.result.name || null,
          formattedAddress: data.result.formatted_address || null,
          latitude: data.result.geometry && data.result.geometry.location ? data.result.geometry.location.lat : null,
          longitude: data.result.geometry && data.result.geometry.location ? data.result.geometry.location.lng : null,
          ...parsedComponents,
        };
        setCachedGeocode(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('[GoogleMaps] Legacy Place Details lookup failed:', err.message);
  }

  return null;
}

/**
 * Preference 2: Reverse Geocoding with Google Geocoding API
 */
async function reverseGeocodeWithGoogle(latitude, longitude, apiKey) {
  if (!apiKey || latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const cacheKey = `geo_${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = getCachedGeocode(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
      // Find the most specific result that has street address, premise, or sublocality
      let bestResult = data.results[0];
      for (const candidate of data.results) {
        const types = candidate.types || [];
        if (
          types.includes('establishment') ||
          types.includes('point_of_interest') ||
          types.includes('premise') ||
          types.includes('subpremise') ||
          types.includes('street_address') ||
          types.includes('route')
        ) {
          bestResult = candidate;
          break;
        }
      }

      const parsedComponents = parseAddressComponents(bestResult.address_components || []);
      const result = {
        source: 'GOOGLE_GEOCODING_API',
        placeId: bestResult.place_id || null,
        formattedAddress: bestResult.formatted_address || null,
        latitude,
        longitude,
        ...parsedComponents,
      };

      setCachedGeocode(cacheKey, result);
      return result;
    } else {
      console.warn(`[GoogleMaps] Geocoding API returned status: ${data.status} ${data.error_message || ''}`);
    }
  } catch (err) {
    console.warn('[GoogleMaps] Geocoding API request failed:', err.message);
  }

  return null;
}

/**
 * Public reverse geocoding function for latitude & longitude coordinates.
 * Called by "Refresh from Coordinates" and automatic link resolution.
 */
async function reverseGeocodeCoordinates(latitude, longitude) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || null;

  if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    return {
      success: false,
      message: 'Valid numeric latitude and longitude coordinates are required.',
    };
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return {
      success: false,
      message: 'Coordinates are out of bounds. Latitude must be ±90 and Longitude must be ±180.',
    };
  }

  if (!apiKey) {
    return {
      success: false,
      latitude: lat,
      longitude: lon,
      isApiConfigured: false,
      message:
        'GOOGLE_MAPS_API_KEY is not configured in server environment variables. Coordinates kept; please enter locality and address manually.',
    };
  }

  const geo = await reverseGeocodeWithGoogle(lat, lon, apiKey);

  if (!geo) {
    return {
      success: false,
      latitude: lat,
      longitude: lon,
      isApiConfigured: true,
      message:
        'Google Geocoding API could not resolve an address for these coordinates. Please enter locality and address manually.',
    };
  }

  return {
    success: true,
    latitude: lat,
    longitude: lon,
    area: geo.area || '',
    city: geo.city || '',
    district: geo.district || '',
    state: geo.state || '',
    postalCode: geo.postalCode || '',
    country: geo.country || 'India',
    formattedAddress: geo.formattedAddress || '',
    googlePlaceId: geo.placeId || null,
    detectionSource: geo.source,
    isApiConfigured: true,
    message: geo.area
      ? `Locality detected: ${geo.area}${geo.city ? ', ' + geo.city : ''}`
      : 'Address resolved successfully.',
  };
}

/**
 * Main function: resolves a Google Maps link and extracts coordinates, place information,
 * and performs the full Place Details / Reverse Geocoding fallback sequence.
 */
async function resolveGoogleMapsUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string' || !inputUrl.trim()) {
    return {
      success: false,
      message: 'Please provide a valid Google Maps location link.',
    };
  }

  const trimmed = inputUrl.trim();

  // Basic format validation
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch (e) {
    return {
      success: false,
      message: 'Invalid URL format. Please paste a full link starting with https://',
    };
  }

  if (!isAllowedGoogleHost(parsedUrl.hostname)) {
    return {
      success: false,
      message: `The domain "${parsedUrl.hostname}" is not recognized as Google Maps. Please use a link from Google Maps (e.g. https://maps.app.goo.gl/... or https://www.google.com/maps/...)`,
    };
  }

  // 1. Resolve short URL if applicable
  let resolvedUrl = trimmed;
  try {
    resolvedUrl = await resolveShortUrl(trimmed);
  } catch (err) {
    return {
      success: false,
      message: `Failed to resolve Google Maps link: ${err.message}`,
    };
  }

  // 2. Extract coordinates and place data
  const { latitude, longitude, placeName, placeId } = extractCoordinatesAndPlace(resolvedUrl);

  if (latitude === null || longitude === null) {
    return {
      success: false,
      resolvedUrl,
      googleMapsUrl: trimmed,
      message:
        'Coordinates could not be automatically extracted from this link. You can enter the latitude and longitude manually below.',
      placeName: placeName || null,
      googlePlaceId: placeId || null,
    };
  }

  // 3. Reverse geocoding & Place Details fallback sequence
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || null;

  let area = '';
  let city = '';
  let district = '';
  let state = '';
  let postalCode = '';
  let formattedAddress = '';
  let finalPlaceId = placeId;
  let finalPlaceName = placeName;
  let detectionSource = 'URL_EXTRACTION_ONLY';
  let apiMessage = null;

  if (apiKey) {
    let placeResult = null;

    // Preference 1: If Place ID is available and valid
    if (placeId && isValidGooglePlaceId(placeId)) {
      placeResult = await fetchGooglePlaceDetails(placeId, apiKey);
      if (placeResult) {
        detectionSource = placeResult.source;
        if (placeResult.placeName && !finalPlaceName) finalPlaceName = placeResult.placeName;
        if (placeResult.formattedAddress) formattedAddress = placeResult.formattedAddress;
        if (placeResult.area) area = placeResult.area;
        if (placeResult.city) city = placeResult.city;
        if (placeResult.district) district = placeResult.district;
        if (placeResult.state) state = placeResult.state;
        if (placeResult.postalCode) postalCode = placeResult.postalCode;
        if (placeResult.placeId) finalPlaceId = placeResult.placeId;
      }
    }

    // Preference 2: Reverse Geocode via coordinates if Place Details didn't provide locality
    if (!area || !formattedAddress) {
      const geoResult = await reverseGeocodeWithGoogle(latitude, longitude, apiKey);
      if (geoResult) {
        if (!detectionSource || detectionSource === 'URL_EXTRACTION_ONLY') {
          detectionSource = geoResult.source;
        }
        if (!area && geoResult.area) area = geoResult.area;
        if (!city && geoResult.city) city = geoResult.city;
        if (!district && geoResult.district) district = geoResult.district;
        if (!state && geoResult.state) state = geoResult.state;
        if (!postalCode && geoResult.postalCode) postalCode = geoResult.postalCode;
        if (!formattedAddress && geoResult.formattedAddress) formattedAddress = geoResult.formattedAddress;
        if (!finalPlaceId && geoResult.placeId) finalPlaceId = geoResult.placeId;
      }
    }
  } else {
    apiMessage =
      'GOOGLE_MAPS_API_KEY is not configured on the server. Coordinates extracted successfully; please enter locality and address manually.';
  }

  return {
    success: true,
    latitude,
    longitude,
    placeName: finalPlaceName || null,
    area: area || '',
    city: city || '',
    district: district || '',
    state: state || '',
    postalCode: postalCode || '',
    formattedAddress: formattedAddress || null,
    googlePlaceId: finalPlaceId || null,
    googleMapsUrl: trimmed,
    resolvedUrl,
    detectionSource,
    isApiConfigured: Boolean(apiKey),
    apiMessage,
    locationVerificationStatus: 'GOOGLE_MAPS_RESOLVED',
    verifiedAt: new Date().toISOString(),
  };
}

module.exports = {
  ALLOWED_GOOGLE_DOMAINS,
  isAllowedGoogleHost,
  resolveShortUrl,
  extractCoordinatesAndPlace,
  parseAddressComponents,
  isValidGooglePlaceId,
  fetchGooglePlaceDetails,
  reverseGeocodeWithGoogle,
  reverseGeocodeCoordinates,
  resolveGoogleMapsUrl,
};
