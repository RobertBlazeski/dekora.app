// __API_URL__ is substituted with a real absolute URL at Docker build time (see
// projects/admin-app/Dockerfile).
export const environment = {
  production: true,
  apiUrl: '__API_URL__',
};
