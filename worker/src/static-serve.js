const SPA_INDEX = '/index.html';

function normalizeAssetPath(pathname) {
  const raw = String(pathname || '/').split('?')[0];
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  if (!decoded || decoded === '/') {
    return SPA_INDEX;
  }
  return decoded.startsWith('/') ? decoded : `/${decoded}`;
}

function looksLikeStaticFile(pathname) {
  return /\.[A-Za-z0-9]+$/.test(pathname);
}

function decodeAssetBody(asset) {
  if (asset.encoding === 'base64') {
    const binary = atob(asset.body);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  return asset.body;
}

export function serveEmbeddedStatic(pathname, assets = {}) {
  const normalized = normalizeAssetPath(pathname);
  const asset = assets[normalized] || (normalized === SPA_INDEX ? assets['/'] : null);
  if (asset) {
    return assetResponse(asset, normalized);
  }
  if (!looksLikeStaticFile(normalized) && (assets[SPA_INDEX] || assets['/'])) {
    return assetResponse(assets[SPA_INDEX] || assets['/'], SPA_INDEX);
  }
  return null;
}

function assetResponse(asset, pathname) {
  const headers = {
    'content-type': asset.contentType || 'application/octet-stream',
    'x-content-type-options': 'nosniff'
  };
  if (pathname === SPA_INDEX || pathname === '/') {
    headers['cache-control'] = 'no-cache';
  } else {
    headers['cache-control'] = 'public, max-age=31536000, immutable';
  }
  return new Response(decodeAssetBody(asset), { headers });
}
