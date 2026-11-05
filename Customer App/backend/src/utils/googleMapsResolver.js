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

    // If it's not a shortener domain (maps.app.goo.gl or goo.gl), we don't necessarily have to follow redirects further
    const isShortener = parsed.hostname === 'maps.app.goo.gl' || parsed.hostname === 'goo.gl';

    // Perform HEAD or GET with manual redirect handling to capture Location header safely
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(currentUrl, {
        method: isShortener ? 'HEAD' : 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      clearTimeout(timer);

      // Check for redirect status codes (301, 302, 303, 307, 308)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          // If no location header, currentUrl is final
          break;
        }

        // Location can be relative or absolute
        const nextUrl = new URL(location, currentUrl).href;
        const nextParsed = new URL(nextUrl);

        if (!isAllowedGoogleHost(nextParsed.hostname)) {
          throw new Error(`Redirect to unauthorized domain "${nextParsed.hostname}" blocked for security.`);
        }

        currentUrl = nextUrl;
        redirectCount++;
        continue;
      }

      // If we got a 200 on a shortener with GET, it might contain a JS redirect or canonical link
      if (response.ok && isShortener) {
        // Try one GET request to find meta refresh or canonical url if HEAD didn't redirect
        const text = await response.text();
        const metaMatch = text.match(/<meta[^>]*?content=["'][^"']*?url=([^"'>]+)["']/i);
        if (metaMatch && metaMatch[1]) {
          const metaUrl = new URL(metaMatch[1], currentUrl).href;
          currentUrl = metaUrl;
          redirectCount++;
          continue;
        }
      }

      // Reached final destination
      break;
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        throw new Error(`Google Maps request timed out after ${timeoutMs}ms.`);
      }
      // If HEAD failed, fallback to returning currentUrl for pattern parsing
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
  // This represents the exact place pin coordinates in modern Google Maps URLs
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
    const qMatch = decoded.match(/[?&](?:q|query|daddr|destination|center|ll)=(?:loc:)?(-?\d+(?:\.\d+)?)[,+ ](-?\d+(?:\.\d+)?)/i);
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
      // Only use if it does NOT look like pure numeric coordinates
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
 * Optional Google Geocoding API enrichment if GOOGLE_MAPS_API_KEY environment variable is set
 */
async function optionalReverseGeocode(latitude, longitude) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !latitude || !longitude) {
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return {
        formattedAddress: data.results[0].formatted_address,
        placeId: data.results[0].place_id || null,
      };
    }
  } catch (err) {
    // Optional integration fails silently without interrupting manual workflow
    console.warn('[GoogleMaps] Optional Geocoding API call skipped:', err.message);
  }

  return null;
}

/**
 * Main function: resolves a Google Maps link and extracts coordinates, place information, and metadata.
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
      message: 'Coordinates could not be automatically extracted from this link. You can enter the latitude and longitude manually below.',
      placeName: placeName || null,
      googlePlaceId: placeId || null,
    };
  }

  // 3. Optional reverse geocode enrichment if API key available
  let formattedAddress = null;
  let finalPlaceId = placeId;

  const geo = await optionalReverseGeocode(latitude, longitude);
  if (geo) {
    if (geo.formattedAddress) formattedAddress = geo.formattedAddress;
    if (geo.placeId && !finalPlaceId) finalPlaceId = geo.placeId;
  }

  return {
    success: true,
    latitude,
    longitude,
    placeName: placeName || null,
    formattedAddress: formattedAddress || null,
    googlePlaceId: finalPlaceId || null,
    googleMapsUrl: trimmed,
    resolvedUrl,
    locationVerificationStatus: 'GOOGLE_MAPS_RESOLVED',
    verifiedAt: new Date().toISOString(),
  };
}

module.exports = {
  ALLOWED_GOOGLE_DOMAINS,
  isAllowedGoogleHost,
  resolveShortUrl,
  extractCoordinatesAndPlace,
  resolveGoogleMapsUrl,
};

