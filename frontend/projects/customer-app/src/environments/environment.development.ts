export const environment = {
  production: false,
  // Plain HTTP in local dev — the SSR server runs in Node, which doesn't trust ASP.NET Core's
  // self-signed HTTPS dev certificate by default. Production sits behind a real certificate.
  apiUrl: 'http://localhost:5297/api',
};
