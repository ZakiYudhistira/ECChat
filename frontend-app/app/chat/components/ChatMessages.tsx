import { useEffect, useState } from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { MessageController, type Message as EncryptedMessage } from "../../controller/Message";
import { getAuthData } from "../../helpers/storage";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
  type?: "text" | "image";
  imageUrl?: string;
}

interface ChatMessagesProps {
  messages?: EncryptedMessage[];
  isLoading?: boolean;
  selectedRoomId?: string;
  otherUsername?: string;
  otherPublicKey?: string;
}

export function ChatMessages({ messages = [], isLoading = false, selectedRoomId, otherUsername = "", otherPublicKey = "" }: ChatMessagesProps) {
  const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([]);
  const authData = getAuthData();

  useEffect(() => {
    const decryptMessages = async () => {
      
      if (!authData || messages.length === 0) {
        setDecryptedMessages([]);
        return;
      }

      const decrypted: Message[] = [];

      for (const msg of messages) {
        try {
          // Determine other user's public key
          const isSender = msg.sender === authData.username;
          const otherUser = isSender ? msg.receiver : msg.sender;
          
          // For now, use provided otherPublicKey or skip decryption
          if (!otherPublicKey) {
            console.warn('Missing public key for', otherUser);
            decrypted.push({
              id: `${msg.sender}_${msg.timestamp}`,
              senderId: msg.sender,
              senderName: msg.sender,
              content: "[Waiting for contact public key...]",
              timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              isCurrentUser: isSender,
              type: "text"
            });
            continue;
          }

          // Decrypt message using ECDH shared secret
          const plaintext = await MessageController.decryptMessage(
            msg,
            authData.privateKey,
            otherPublicKey
          );

          // Format timestamp
          const date = new Date(msg.timestamp);
          const timeString = date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          decrypted.push({
            id: `${msg.sender}_${msg.timestamp}`,
            senderId: msg.sender,
            senderName: msg.sender,
            content: plaintext,
            timestamp: timeString,
            isCurrentUser: msg.sender === authData.username,
            type: "text"
          });
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          // Show encrypted message as fallback
          decrypted.push({
            id: `${msg.sender}_${msg.timestamp}`,
            senderId: msg.sender,
            senderName: msg.sender,
            content: "[Failed to decrypt message]",
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isCurrentUser: msg.sender === authData.username,
            type: "text"
          });
        }
      }

      setDecryptedMessages(decrypted);
    };

    decryptMessages();
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading messages...
      </div>
    );
  }

  if (decryptedMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-2">Start the conversation!</p>
        </div>
      </div>
    );
  }
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {decryptedMessages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isCurrentUser ? "flex-row-reverse" : ""}`}
          >
            {!message.isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.senderAvatar} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {message.senderName.substring(0, 2).toUpperCase()}
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
                <p className="text-sm">{message.content}</p>
              </div>
              
              <span className="text-xs text-muted-foreground mt-1">{message.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
