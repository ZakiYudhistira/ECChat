import { useState, useEffect } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import type { Route } from "./+types/chat";
import { getAuthData } from "../helpers/storage";
import { ChatroomController } from "../controller/Chatroom";
import { getContactPublicKey } from "../controller/Contact";
import { useWebSocketMessages } from "../hooks/useWebSocketMessages";
import { toast } from "sonner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ECChat - Messages" },
    { name: "description", content: "Chat with your contacts on ECChat" },
  ];
}

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [otherUsername, setOtherUsername] = useState<string>("");
  const [otherPublicKey, setOtherPublicKey] = useState<string>("");
  
  const authData = getAuthData();

  // Use WebSocket messages hook
  const { messages, sendMessage, isConnected, isLoading } = useWebSocketMessages({
    roomId: selectedChat,
    otherUsername,
    otherPublicKey
  });

  // When chatroom is selected, fetch other user's info
  useEffect(() => {
    let isMounted = true;
    
    const fetchOtherUserInfo = async () => {
      if (!selectedChat || !authData) {
        setOtherUsername("");
        setOtherPublicKey("");
        return;
      }

      try {
        // Extract other username from room_id
        const participants = selectedChat.split('-');
        const other = participants.find(p => p !== authData.username) || "";
        
        if (!isMounted) return;
        setOtherUsername(other);

        // Fetch other user's public key
        const publicKey = await getContactPublicKey(other);
        
        if (!isMounted) return;
        setOtherPublicKey(publicKey);
        
        console.log(`Selected chat with: ${other}, public key loaded`);
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to fetch other user public key:', error);
        toast.error('Failed to load contact info');
      }
    };

    fetchOtherUserInfo();
    
    return () => {
      isMounted = false;
    };
  }, [selectedChat, authData]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="h-screen flex">
      <ChatSidebar 
        selectedChat={selectedChat} 
        onSelectChat={setSelectedChat} 
      />
      
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          <ChatHeader 
            name={otherUsername || "Chat"}
            status="Active" 
          />
          
          <ChatMessages 
            messages={messages}
            isLoading={isLoading}
            selectedRoomId={selectedChat}
            otherUsername={otherUsername}
            otherPublicKey={otherPublicKey}
          />
          
          <ChatInput onSendMessage={handleSendMessage} />
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