// __API_URL__ is substituted with a real absolute URL at Docker build time (see
// projects/customer-app/Dockerfile). It must be absolute, not relative — Node's fetch during
// SSR has no browser "current origin" to resolve a relative path against.
export const environment = {
  production: true,
  apiUrl: '__API_URL__',
};
