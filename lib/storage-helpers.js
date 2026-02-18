export function getProxiedUrl(originalUrl) {
    if (!originalUrl) return '';
    return `/api/storage-proxy?url=${encodeURIComponent(originalUrl)}`;
  }