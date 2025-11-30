import { apiClient } from "~/helpers/api-client";
import { API_ROUTES } from "../../config/api";

export interface Chatroom {
  id           : string,  // Changed from _id
  participants : Array<string>,
  participantsRead?: Map<string, Date>,
  createdAt?   : string,
  updatedAt?   : string
}

export async function getChatrooms(username: string): Promise<Chatroom[]> {
  try {
    const url = API_ROUTES.GET_CHATROOMS.replace(':username', username);
    const response = await apiClient.get<{ success: boolean; chatrooms: any[] }>(url);
    
    if (response.success) {
      return response.chatrooms.map(room => ({
        id: room._id,
        participants: room.participants,
        participantsRead: room.participantsRead,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      }));
    }
    
    throw new Error('Failed to fetch chatrooms');
  } catch (error) {
    console.error('Error fetching chatrooms:', error);
    throw error;
  }
}

export async function createChatroom(userA: string, userB: string): Promise<Chatroom> {
  try {
    const response = await apiClient.post<{ success: boolean; chatroom: any }>(
      API_ROUTES.CREATE_CHATROOM,
      { userA, userB }
    );

    if (response.success && response.chatroom) {
      return {
        id: response.chatroom._id,
        participants: response.chatroom.participants,
        participantsRead: response.chatroom.participantsRead,
        createdAt: response.chatroom.createdAt,
        updatedAt: response.chatroom.updatedAt
      };
    }

    throw new Error('Failed to create chatroom');
  } catch (error){
    console.error('Error creating chatroom:', error);
    throw error;
  }
}