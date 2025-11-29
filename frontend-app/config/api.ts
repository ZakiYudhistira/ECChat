export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const API_ROUTES = {
  REGISTER: `${API_BASE_URL}/users/register`,
  LOGIN: `${API_BASE_URL}/users/login`,
  CHALLENGE: `${API_BASE_URL}/users/challenge`,
  GET_CONTACTS: `${API_BASE_URL}/contact/:username`,
  ADD_CONTACT: `${API_BASE_URL}/contact/add`,
  REMOVE_CONTACT: `${API_BASE_URL}/contact/remove`,
  GET_CONTACT_PUBLIC_KEY: `${API_BASE_URL}/users/:username/publickey`,
  GET_CHATROOMS: `${API_BASE_URL}/chatroom/:username`,
  CREATE_CHATROOM: `${API_BASE_URL}/chatroom/create`,
  GET_CHATROOM_BETWEEN: `${API_BASE_URL}/chatroom/between/:userA/:userB`,
  MARK_CHATROOM_READ: `${API_BASE_URL}/chatroom/:chatroomId/read`,
  GET_MESSAGES: `${API_BASE_URL}/messages/:roomId`,
  SAVE_MESSAGE: `${API_BASE_URL}/messages`,
};