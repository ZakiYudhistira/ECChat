import { useState, useEffect } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import type { Route } from "./+types/chat";
import { getAuthData } from "../helpers/storage";
import { sharedSecret } from "~/helpers/sharedsecret";
import { useChatWebSocket } from "../hooks/useChatWebSocket";
import { toast } from "sonner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ECChat - Messages" },
    { name: "description", content: "Chat with your contacts on ECChat" },
  ];
}

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  
  const authData = getAuthData();

  // Use WebSocket hook at parent level (single instance)
  const { messages, isLoading, sendMessage, isConnected } = useChatWebSocket(selectedChat);

  useEffect(() => {
    if(!authData) return;
    sharedSecret.setMyPrivateKey(authData.privateKey);
  }, [authData?.privateKey])

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
        onSelectChat={setSelectedChat} 
      />
      
      {selectedChat ? (
        <div className="flex-1 flex flex-col min-h-0">
          <ChatHeader 
            name={selectedChatUser || selectedChat}
            status="Active" 
          />
          
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            selectedChat={selectedChat} 
            onSelectChat={setSelectedChat} 
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