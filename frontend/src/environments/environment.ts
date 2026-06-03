export const environment = {
  production: false,
  // En desarrollo, el proxy de Angular redirige /api → http://localhost:8000/api
  // por eso la URL base es relativa (sin host).
  apiUrl: '/api',
};
