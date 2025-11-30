import { type Message } from '../Model/Message'
import { apiClient } from "~/helpers/api-client";
import { API_ROUTES } from "../../config/api";

export async function getMessages(chatroomId: string, limit = 50, skip = 0): Promise<Message[]> {
  try {
    const url = API_ROUTES.GET_MESSAGES.replace(':chatroomId', chatroomId);
    const response = await apiClient.get<{success: boolean; messages: any[]; count: number}>(
      `${url}?limit=${limit}&skip=${skip}`
    );
    
    if (response.success) {
      return response.messages;
    }
    
    throw new Error('Failed to fetch messages');
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}