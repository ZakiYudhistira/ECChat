import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatSocket } from '../helpers/chatsocket';
import { getAuthData } from '../helpers/storage';
import { getMessages } from '../controller/Messages';
import { processMessages } from '../helpers/chathelper';
import type { Message } from '../Model/Message';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

interface UseChatWebSocketCallbacks {
  onNewMessage?: (message: Message) => void;
}

export function useChatWebSocket(
  roomId: string | null,
  callbacks?: UseChatWebSocketCallbacks
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatSocketRef = useRef<ChatSocket | null>(null);
  const messageIdCounterRef = useRef(0); // Auto-increment counter

  // Helper function to assign unique ID
  const assignMessageId = useCallback((message: Message): Message => {
    if (message._id || message.id) {
      return message; // Already has ID from database
    }
    messageIdCounterRef.current += 1;
    return {
      ...message,
      id: `msg_${Date.now()}_${messageIdCounterRef.current}`,
    };
  }, []);

  // Helper function to insert message in sorted position (binary search)
  const insertMessageSorted = useCallback((messages: Message[], newMessage: Message): Message[] => {
    const timestamp = new Date(newMessage.timestamp).getTime();
    
    // Binary search to find insertion position
    let left = 0;
    let right = messages.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midTimestamp = new Date(messages[mid].timestamp).getTime();
      
      if (midTimestamp < timestamp) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    // Insert at the found position
    const newMessages = [...messages];
    newMessages.splice(left, 0, newMessage);
    return newMessages;
  }, []);

  // Helper function to sort messages by timestamp (only for initial load)
  const sortMessagesByTimestamp = useCallback((messages: Message[]): Message[] => {
    return [...messages].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB; // Ascending order (oldest first)
    });
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const authData = getAuthData();
    if (!authData?.token) return;

    const chatSocket = new ChatSocket(WS_URL, authData.token, {
      onMessageReceived: (message) => {
        // Only add message if it belongs to the current room
        if (message.room_id === roomId) {
          const messageWithId = assignMessageId(message);
          setMessages(prev => insertMessageSorted(prev, messageWithId));
        }
        
        // Always notify parent about new message (for conversation list updates)
        const messageWithId = assignMessageId(message);
        callbacks?.onNewMessage?.(messageWithId);
      },
      onMessageSent: (message) => {
        // Only add message if it belongs to the current room
        if (message.room_id === roomId) {
          const messageWithId = assignMessageId(message);
          setMessages(prev => insertMessageSorted(prev, messageWithId));
        }
        
        // Always notify parent about sent message
        const messageWithId = assignMessageId(message);
        callbacks?.onNewMessage?.(messageWithId);
      },
      onError: (error) => {
        console.error('[useChatWebSocket] Error:', error);
      }
    });

    chatSocketRef.current = chatSocket;
    setIsConnected(true);

    return () => {
      chatSocket.close();
      chatSocketRef.current = null;
      setIsConnected(false);
    };
  }, [assignMessageId, insertMessageSorted, callbacks, roomId]);

  // Load messages when room changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!roomId) {
        setMessages([]);
        messageIdCounterRef.current = 0; // Reset counter when changing rooms
        return;
      }

      setIsLoading(true);
      try {
        const fetchedMessages = await getMessages(roomId);
        const processed = await processMessages(fetchedMessages);
        
        // Assign IDs to loaded messages
        const messagesWithIds = processed.map(msg => {
          if (msg._id || msg.id) {
            return { ...msg, id: msg._id || msg.id };
          }
          return assignMessageId(msg);
        });
        
        // Sort messages by timestamp (only once on initial load)
        setMessages(sortMessagesByTimestamp(messagesWithIds));
      } catch (error) {
        console.error('[useChatWebSocket] Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [roomId, assignMessageId, sortMessagesByTimestamp]);

  const sendMessage = useCallback(async (plaintext: string, receiver: string, roomId: string) => {
    if (!chatSocketRef.current) {
      throw new Error('WebSocket not connected');
    }
    await chatSocketRef.current.sendMessage(plaintext, receiver, roomId);
  }, []);

  const sendTypingIndicator = useCallback((receiver: string, roomId: string) => {
    chatSocketRef.current?.sendTypingIndicator(receiver, roomId);
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    sendMessage,
    sendTypingIndicator
  };
}