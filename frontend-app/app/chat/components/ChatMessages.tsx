import { useState, useEffect } from "react";
import { type Message } from "../../Model/Message";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { getMessages } from "../../controller/Messages";
import { getAuthData } from "../../helpers/storage";

interface ChatMessagesProps {
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
}

export function ChatMessages({selectedChat, onSelectChat}: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const authData = getAuthData();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      try {
        const fetchedMessages = await getMessages(selectedChat);
        
        // Transform messages for UI display
        const transformedMessages = fetchedMessages.map(msg => ({
          ...msg,
          id: msg._id || `msg_${Date.now()}_${Math.random()}`,
          isCurrentUser: msg.sender === authData?.username,
          senderName: msg.sender,
          content: msg.encrypted_message, // Show encrypted content for now
          type: "text"
        }));
        
        setMessages(transformedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat, authData?.username]);
  
  return (
    <div className="flex-1 p-4 h-full flex flex-col">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isCurrentUser ? "flex-row-reverse" : ""}`}
              >
                {!message.isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.senderAvatar} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {message.senderName?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col ${message.isCurrentUser ? "items-end" : "items-start"} max-w-[70%]`}>
                  {!message.isCurrentUser && (
                    <span className="text-xs text-muted-foreground mb-1">{message.senderName}</span>
                  )}
                  
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-card"
                    }`}
                  >
                    {message.type === "image" && message.imageUrl ? (
                      <img
                        src={message.imageUrl}
                        alt="Shared image"
                        className="max-w-full rounded-lg mb-2"
                      />
                    ) : null}
                    <p className="text-sm font-mono break-all">{message.content}</p>
                  </div>
                  
                  <span className="text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
