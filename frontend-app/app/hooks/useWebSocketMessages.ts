import { useState, useEffect, useRef, useCallback } from "react";
import SocketConnection from "../helpers/websocket";
import { MessageController, type Message } from "../controller/Message";
import { getAuthData } from "../helpers/storage";
import { parseWebSocketMessage, isValidMessage, processIncomingMessage, formatOutgoingMessage } from "../helpers/messageHandler";
import { toast } from "sonner";

interface UseWebSocketMessagesOptions {
  roomId: string | null;
  otherUsername: string;
  otherPublicKey?: string;
}

interface UseWebSocketMessagesReturn {
  messages: Message[];
  sendMessage: (plaintext: string) => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
}

export function useWebSocketMessages({
  roomId,
  otherUsername,
  otherPublicKey
}: UseWebSocketMessagesOptions): UseWebSocketMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<SocketConnection | null>(null);
  const authData = getAuthData();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!authData?.token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const socket = new SocketConnection(wsUrl, authData.token);
    socketRef.current = socket;

    // Listen for connection status
    const checkConnection = setInterval(() => {
      setIsConnected(socket ? true : false);
    }, 1000);

    console.log('[useWebSocketMessages] WebSocket initialized');

    return () => {
      clearInterval(checkConnection);
      socket.close();
      socketRef.current = null;
    };
  }, [authData?.token]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socketRef.current || !roomId || !authData) return;

    const handleMessage = async (data: any) => {
      try {
        const wsMessage = parseWebSocketMessage(data);
        
        if (!wsMessage) {
          console.warn('[useWebSocketMessages] Invalid WebSocket message:', data);
          return;
        }

        // Handle new message
        if (wsMessage.type === 'new_message') {
          const incomingMessage = wsMessage.data;

          // Validate message structure
          if (!isValidMessage(incomingMessage)) {
            console.warn('[useWebSocketMessages] Invalid message structure:', incomingMessage);
            return;
          }

          // Only process messages for current room
          if (incomingMessage.room_id !== roomId) {
            console.log('[useWebSocketMessages] Message for different room, ignoring');
            return;
          }

          // Determine other user's public key
          const isSender = incomingMessage.sender === authData.username;
          const otherUser = isSender ? incomingMessage.receiver : incomingMessage.sender;
          
          // For now, we'll need to fetch the other user's public key
          // TODO: Implement contact public key lookup
          if (!otherPublicKey) {
            console.warn('[useWebSocketMessages] Missing other user public key');
            // Add message without decryption for now
            setMessages(prev => [...prev, incomingMessage]);
            return;
          }

          // Decrypt and verify message
          const senderPublicKey = isSender ? authData.publicKey : otherPublicKey;
          
          try {
            await processIncomingMessage(
              incomingMessage,
              authData.privateKey,
              otherPublicKey,
              senderPublicKey
            );

            // Add to messages list
            setMessages(prev => {
              // Avoid duplicates
              const exists = prev.some(m => 
                m.sender === incomingMessage.sender && 
                m.timestamp === incomingMessage.timestamp
              );
              
              if (exists) return prev;
              
              return [...prev, incomingMessage];
            });

            console.log('[useWebSocketMessages] New message received and verified');
          } catch (error) {
            console.error('[useWebSocketMessages] Failed to process message:', error);
            toast.error('Failed to decrypt message');
          }
        }
      } catch (error) {
        console.error('[useWebSocketMessages] Error handling message:', error);
      }
    };

    socketRef.current.onMessage(handleMessage);
  }, [roomId, authData, otherPublicKey]);

  // Fetch initial messages when room changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomId) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      try {
        const roomMessages = await MessageController.getMessages(roomId);
        setMessages(roomMessages.reverse());
        console.log(`[useWebSocketMessages] Loaded ${roomMessages.length} messages for room ${roomId}`);
      } catch (error) {
        console.error('[useWebSocketMessages] Failed to fetch messages:', error);
        toast.error('Failed to load messages');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [roomId]);

  // Send message function
  const sendMessage = useCallback(async (plaintext: string) => {
    if (!roomId || !authData || !otherPublicKey || !socketRef.current) {
      console.error('[useWebSocketMessages] Cannot send message: missing requirements');
      return;
    }

    try {
      // Create encrypted message
      const message = await MessageController.createMessage(
        plaintext,
        authData.username,
        otherUsername,
        roomId,
        authData.privateKey,
        otherPublicKey
      );

      // Send via WebSocket
      const wsMessage = formatOutgoingMessage(message);
      socketRef.current.send(wsMessage);

      // Save to backend
      await MessageController.saveMessage(message);

      // Add to local state immediately (optimistic update)
      setMessages(prev => [...prev, message]);

      console.log('[useWebSocketMessages] Message sent successfully');
    } catch (error) {
      console.error('[useWebSocketMessages] Failed to send message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  }, [roomId, authData, otherUsername, otherPublicKey]);

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading
  };
}
