import { useEffect, useState, useCallback } from 'react';
import { getChatrooms, type Chatroom } from '../controller/Chatroom';
import { getAuthData } from '../helpers/storage';

export interface ConversationItem extends Chatroom {
  otherUsername: string;
  lastMessage: string;
  unreadCount: number;
  online: boolean;
}

export function useChatRooms() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const authData = getAuthData();

  // Load chatrooms on mount
  useEffect(() => {
    const loadChatrooms = async () => {
      if (!authData?.username) return;

      setIsLoading(true);
      try {
        const chatrooms = await getChatrooms(authData.username);
        
        // Transform chatrooms to conversations
        const transformedConversations = chatrooms.map(room => 
          transformChatroomToConversation(room, authData.username)
        );

        // Sort by most recent first
        const sorted = sortConversationsByTime(transformedConversations);
        setConversations(sorted);
      } catch (error) {
        console.error('[useChatRooms] Failed to load chatrooms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatrooms();
  }, [authData?.username]);

  // Update conversation with new message
  const updateConversationWithMessage = useCallback((
    roomId: string,
    lastMessage: string,
    timestamp: Date,
    incrementUnread: boolean = false
  ) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === roomId) {
          return {
            ...conv,
            lastMessage,
            updatedAt: timestamp.toISOString(),
            unreadCount: incrementUnread ? conv.unreadCount + 1 : conv.unreadCount,
          };
        }
        return conv;
      });

      // Re-sort after update
      return sortConversationsByTime(updated);
    });
  }, []);

  // Mark conversation as read
  const markAsRead = useCallback((roomId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === roomId
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  }, []);

  // Add new conversation (when someone starts a chat)
  const addConversation = useCallback((chatroom: Chatroom) => {
    if (!authData?.username) return;

    const newConversation = transformChatroomToConversation(chatroom, authData.username);
    
    setConversations(prev => {
      // Check if conversation already exists
      const exists = prev.some(conv => conv.id === chatroom.id);
      if (exists) return prev;

      // Add and sort
      return sortConversationsByTime([newConversation, ...prev]);
    });
  }, [authData?.username]);

  return {
    conversations,
    isLoading,
    updateConversationWithMessage,
    markAsRead,
    addConversation,
  };
}

// Helper: Transform Chatroom to ConversationItem
function transformChatroomToConversation(
  chatroom: Chatroom,
  currentUsername: string
): ConversationItem {
  const otherUsername = chatroom.participants.find(p => p !== currentUsername) || 'Unknown';
  
  return {
    ...chatroom,
    otherUsername,
    lastMessage: 'No messages yet',
    unreadCount: 0,
    online: false, // Will be updated via WebSocket presence
  };
}

// Helper: Sort conversations by most recent
function sortConversationsByTime(conversations: ConversationItem[]): ConversationItem[] {
  return [...conversations].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA; // Descending (most recent first)
  });
}
