// UploadsController returns image URLs relative to the API's origin ("/uploads/xxx.jpg"), not
// under "/api" — so it can't just be appended to apiUrl. This resolves one against whichever
// app is calling it, by stripping the trailing "/api" off that app's own apiUrl to recover the
// shared origin (see Caddyfile — both /api/* and /uploads/* proxy to the same API container).
export function resolveAssetUrl(apiUrl: string, url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const origin = apiUrl.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
