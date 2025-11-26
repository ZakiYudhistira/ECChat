export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const API_ROUTES = {
  REGISTER: `${API_BASE_URL}/users/register`,
  LOGIN: `${API_BASE_URL}/users/login`,
  CHALLENGE: `${API_BASE_URL}/users/challenge`,
};