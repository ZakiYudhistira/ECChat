import { apiClient } from '../helpers/api-client';
import type { ApiResponse } from '../helpers/api-client';
import { API_ROUTES } from '../../config/api';

export interface Chatroom {
  _id: string;                          // Chatroom ID (userA_userB format)
  participants: string[];               // Array of participant usernames
  participantsRead: Map<string, Date>;  // Last read timestamp for each user
  createdAt: string;                    // ISO timestamp
  updatedAt: string;                    // ISO timestamp
}

/**
 * Response from GET /chatroom/:username
 */
export interface GetChatroomsResponse extends ApiResponse {
  chatrooms: Chatroom[];
  totalChatrooms: number;
}

/**
 * Response from POST /chatroom/create
 */
export interface CreateChatroomResponse extends ApiResponse {
  chatroom: Chatroom;
}

/**
 * Chatroom Controller for managing chatrooms
 */
export class ChatroomController {
  /**
   * Get all chatrooms for a specific user
   * 
   * @param username - The username to get chatrooms for
   * @returns Array of chatrooms where user is a participant
   */
  static async getChatrooms(username: string): Promise<Chatroom[]> {
    try {
      const url = API_ROUTES.GET_CHATROOMS.replace(':username', username);
      const response = await apiClient.get<GetChatroomsResponse>(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get chatrooms');
      }
      
      return response.chatrooms;
    } catch (error) {
      console.error('Error fetching chatrooms:', error);
      throw error;
    }
  }

  /**
   * Create or get existing chatroom between two users
   * 
   * @param userA - First user's username
   * @param userB - Second user's username
   * @returns The created or existing chatroom
   */
  static async createChatroom(userA: string, userB: string): Promise<Chatroom> {
    try {
      const response = await apiClient.post<CreateChatroomResponse>(
        API_ROUTES.CREATE_CHATROOM,
        { userA, userB }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create chatroom');
      }
      
      return response.chatroom;
    } catch (error) {
      console.error('Error creating chatroom:', error);
      throw error;
    }
  }

  /**
   * Get specific chatroom between two users
   * 
   * @param userA - First user's username
   * @param userB - Second user's username
   * @returns The chatroom if it exists
   */
  static async getChatroomBetween(userA: string, userB: string): Promise<Chatroom | null> {
    try {
      const url = API_ROUTES.GET_CHATROOM_BETWEEN
        .replace(':userA', userA)
        .replace(':userB', userB);
      
      const response = await apiClient.get<CreateChatroomResponse>(url);
      
      if (!response.success) {
        return null;
      }
      
      return response.chatroom;
    } catch (error) {
      console.error('Error getting chatroom between users:', error);
      return null;
    }
  }

  /**
   * Mark chatroom as read for the authenticated user
   * 
   * @param chatroomId - The chatroom ID
   * @returns Updated last read timestamp
   */
  static async markChatroomAsRead(chatroomId: string): Promise<Date> {
    try {
      const url = API_ROUTES.MARK_CHATROOM_READ.replace(':chatroomId', chatroomId);
      const response = await apiClient.put<{ success: boolean; lastRead: string }>(url);
      
      if (!response.success) {
        throw new Error('Failed to mark chatroom as read');
      }
      
      return new Date(response.lastRead);
    } catch (error) {
      console.error('Error marking chatroom as read:', error);
      throw error;
    }
  }

  /**
   * Get the other participant's username in a 1-to-1 chatroom
   * 
   * @param chatroom - The chatroom object
   * @param currentUsername - Current user's username
   * @returns The other participant's username
   */
  static getOtherParticipant(chatroom: Chatroom, currentUsername: string): string {
    return chatroom.participants.find(p => p !== currentUsername) || '';
  }
}

// Export convenience function for backward compatibility
export async function getChatrooms(username: string): Promise<Chatroom[]> {
  return ChatroomController.getChatrooms(username);
}