const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Extract Google Drive file ID from various link formats:
 * - https://drive.google.com/file/d/1abcXYZ_123/view?usp=sharing
 * - https://drive.google.com/open?id=1abcXYZ_123
 * - https://drive.google.com/uc?id=1abcXYZ_123
 */
function extractGoogleDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();

  // Pattern 1: /file/d/<id>
  const fileDMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) return fileDMatch[1];

  // Pattern 2: id=<id>
  const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // Pattern 3: /d/<id>
  const dMatch = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];

  // If plain ID was passed directly
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(clean)) {
    return clean;
  }

  return null;
}

/**
 * Download a buffer following HTTP/HTTPS redirects
 */
function fetchBufferWithRedirects(targetUrl, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects while downloading file.'));
    }

    const client = targetUrl.startsWith('https') ? https : http;
    const req = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      },
      (res) => {
        // Handle HTTP redirects (301, 302, 303, 307, 308)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, targetUrl).toString();
          return resolve(fetchBufferWithRedirects(redirectUrl, maxRedirects - 1));
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download: HTTP status ${res.statusCode}`));
        }

        const contentType = res.headers['content-type'] || '';
        const chunks = [];

        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ buffer, contentType });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Connection timed out while downloading Google Drive file.'));
    });
  });
}

/**
 * Inspect magic bytes of buffer to detect real image type
 */
function detectImageType(buffer, declaredContentType) {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: '.jpg', mime: 'image/jpeg' };
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: '.png', mime: 'image/png' };
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.slice(0, 4).toString() === 'RIFF' &&
    buffer.length >= 12 &&
    buffer.slice(8, 12).toString() === 'WEBP'
  ) {
    return { ext: '.webp', mime: 'image/webp' };
  }
  // GIF: GIF87a or GIF89a
  if (buffer.slice(0, 3).toString() === 'GIF') {
    return { ext: '.gif', mime: 'image/gif' };
  }

  // Fallback to declared content-type if valid
  if (declaredContentType.includes('jpeg') || declaredContentType.includes('jpg')) {
    return { ext: '.jpg', mime: 'image/jpeg' };
  }
  if (declaredContentType.includes('png')) {
    return { ext: '.png', mime: 'image/png' };
  }
  if (declaredContentType.includes('webp')) {
    return { ext: '.webp', mime: 'image/webp' };
  }

  return null;
}

/**
 * Downloads a Google Drive image and saves to permanent storage
 */
async function importImageFromGoogleDrive(driveUrl, customPrefix = 'cafe') {
  if (!driveUrl || typeof driveUrl !== 'string') {
    throw new Error('Google Drive sharing link or image URL is required.');
  }

  const cleanUrl = driveUrl.trim();
  const fileId = extractGoogleDriveFileId(cleanUrl);

  let downloadResult = null;
  let lastError = null;

  if (fileId) {
    // Strategy 1: Google CDN direct content URL (Fastest, avoids download warning pages)
    const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}=w2048`;

    // Strategy 2: Direct UC download URL
    const directUcUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    try {
      const res = await fetchBufferWithRedirects(cdnUrl);
      const imgType = detectImageType(res.buffer, res.contentType);
      if (imgType) {
        downloadResult = { ...res, imgType };
      }
    } catch (err) {
      lastError = err;
    }

    if (!downloadResult) {
      try {
        const res = await fetchBufferWithRedirects(directUcUrl);
        const imgType = detectImageType(res.buffer, res.contentType);
        if (imgType) {
          downloadResult = { ...res, imgType };
        } else {
          // If HTML returned, it is probably a private access or login page
          const sampleText = res.buffer.slice(0, 500).toString('utf-8');
          if (sampleText.includes('accounts.google.com') || sampleText.includes('Sign in') || sampleText.includes('<!DOCTYPE')) {
            throw new Error('Access denied. The Google Drive file is private. Please set sharing to "Anyone with the link can view".');
          }
        }
      } catch (err) {
        lastError = err;
      }
    }
  } else if (/^https?:\/\//i.test(cleanUrl)) {
    // Strategy 3: Direct web image download
    try {
      const res = await fetchBufferWithRedirects(cleanUrl);
      const imgType = detectImageType(res.buffer, res.contentType);
      if (imgType) {
        downloadResult = { ...res, imgType };
      } else {
        throw new Error('The URL did not return a supported image format (JPEG, PNG, WEBP, GIF).');
      }
    } catch (err) {
      lastError = err;
    }
  } else {
    throw new Error('Invalid Google Drive link format. Please provide a link starting with https://drive.google.com/... or a valid image URL.');
  }

  if (!downloadResult) {
    throw new Error(
      lastError?.message ||
        'Unable to retrieve image. Please ensure the file is shared as "Anyone with the link can view" and is a valid image.'
    );
  }

  const { buffer, imgType } = downloadResult;
  const safeId = fileId ? fileId.slice(0, 8) : 'web';
  const fileName = `${customPrefix}_${Date.now()}_${safeId}${imgType.ext}`;

  // 1. Save to backend/uploads/cafes/
  const uploadsDir = path.resolve(__dirname, '../../uploads/cafes');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const uploadFilePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(uploadFilePath, buffer);

  // 2. Also mirror to assets/images/cafes/ and build/web/assets/images/cafes/
  try {
    const assetsDir = path.resolve(__dirname, '../../../assets/images/cafes');
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, fileName), buffer);

    const buildDir = path.resolve(__dirname, '../../../build/web/assets/images/cafes');
    if (fs.existsSync(buildDir)) {
      fs.writeFileSync(path.join(buildDir, fileName), buffer);
    }
  } catch (e) {
    // Non-fatal if asset sync fails
  }

  return {
    success: true,
    fileId,
    fileName,
    permanentUrl: `/uploads/cafes/${fileName}`,
    assetPath: `assets/images/cafes/${fileName}`,
    fileSize: buffer.length,
    mimeType: imgType.mime,
  };
}

module.exports = {
  extractGoogleDriveFileId,
  importImageFromGoogleDrive,
};

