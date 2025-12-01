import { useState, useEffect } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { getAuthData } from "../helpers/storage";
import { sharedSecret } from "~/helpers/sharedsecret";
import { useChatWebSocket } from "../hooks/useChatWebSocket";
import { useChatRooms } from "../hooks/useChatRooms";
import { toast } from "sonner";
import type { Message } from "../Model/Message";

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  
  const authData = getAuthData();

  // Manage chatrooms/conversations
  const { 
    conversations, 
    isLoading: isLoadingRooms,
    updateConversationWithMessage,
    markAsRead,
    addConversation
  } = useChatRooms();

  // Manage messages for selected chat
  const { 
    messages, 
    isLoading: isLoadingMessages, 
    sendMessage, 
    isConnected 
  } = useChatWebSocket(selectedChat, {
    onNewMessage: (message: Message) => {
      // Update conversation list with new message
      const isCurrentRoom = message.room_id === selectedChat;
      const shouldIncrementUnread = !isCurrentRoom && message.sender !== authData?.username;
      
      updateConversationWithMessage(
        message.room_id,
        message.plaintext || message.content || 'New message',
        new Date(message.timestamp),
        shouldIncrementUnread
      );
    }
  });

  useEffect(() => {
    if(!authData) return;
    sharedSecret.setMyPrivateKey(authData.privateKey);
  }, [authData?.privateKey])

  const handleSelectChat = (chatroomId: string) => {
    setSelectedChat(chatroomId);
    
    // Mark as read when opening conversation
    markAsRead(chatroomId);
    
    // Extract other user's name from room ID
    if (authData?.username) {
      const participants = chatroomId.split('-');
      const otherUser = participants.find(p => p !== authData.username);
      setSelectedChatUser(otherUser || null);
    }
  };

  // Update selected chat user when selectedChat changes
  useEffect(() => {
    if (selectedChat && authData?.username) {
      // Remove current user from room_id (e.g., "alice-bob" -> "bob" for alice)
      const participants = selectedChat.split('-');
      const otherUser = participants.find(p => p !== authData.username) || '';
      setSelectedChatUser(otherUser);
    } else {
      setSelectedChatUser(null);
    }
  }, [selectedChat, authData?.username]);

  const handleSendMessage = async (message: string) => {
    if (!selectedChat || !selectedChatUser) {
      toast.error('No chat selected');
      return;
    }

    try {
      await sendMessage(message, selectedChatUser, selectedChat);
      console.log('[Chat] Message sent successfully');
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="h-screen flex">
      <ChatSidebar 
        selectedChat={selectedChat} 
        onSelectChat={handleSelectChat}
        conversations={conversations}
        isLoadingRooms={isLoadingRooms}
        onNewConversation={addConversation}
      />
      
      {selectedChat ? (
        <div className="flex-1 flex flex-col min-h-0">
          <ChatHeader 
            name={selectedChatUser || selectedChat}
            status="Active" 
          />
          
          <ChatMessages
            messages={messages}
            isLoading={isLoadingMessages}
            selectedChat={selectedChat} 
            onSelectChat={handleSelectChat} 
          />
          
          <ChatInput 
            onSendMessage={handleSendMessage}
            isConnected={isConnected}
            roomId={selectedChat}
            receiverUsername={selectedChatUser}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <img src="/ecchatlogo.png" alt="ECChat Logo" className="h-36 w-auto mx-auto mb-4 glow-primary" />
            <p className="text-xl">Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}