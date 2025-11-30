import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import type { Route } from "./+types/chat";
import SocketConnection from "../helpers/websocket";
import { getAuthData } from "../helpers/storage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ECChat - Messages" },
    { name: "description", content: "Chat with your contacts on ECChat" },
  ];
}

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const socketRef = useRef<SocketConnection | null>(null);
  const isConnecting = useRef(false);

  // WebSocket Initialization
  useEffect(() => {

    const authData = getAuthData();
    
    if (authData?.token) {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
      socketRef.current = new SocketConnection(wsUrl, authData.token);
      
      console.log('[Chat] WebSocket connection initialized');
    }

    // Disconnect WS
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        isConnecting.current = false;
        console.log('[Chat] WebSocket connection closed');
      }
    };
  }, []);

  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message);
    // TODO: Implement message sending logic
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
            name="Design chat" 
            status="23 members, 12 online" 
          />
          
          <ChatMessages
            selectedChat={selectedChat} 
            onSelectChat={setSelectedChat} 
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