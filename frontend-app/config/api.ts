export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const API_ROUTES = {
  REGISTER: `${API_BASE_URL}/users/register`,
  LOGIN: `${API_BASE_URL}/users/login`,
  CHALLENGE: `${API_BASE_URL}/users/challenge`,
  GET_CONTACTS: `${API_BASE_URL}/contact/:username`,
  ADD_CONTACT: `${API_BASE_URL}/contact/add`,
  REMOVE_CONTACT: `${API_BASE_URL}/contact/remove`,
  GET_CHATROOMS: `${API_BASE_URL}/chatroom/:username`,
  CREATE_CHATROOM: `${API_BASE_URL}/chatroom/create`
};