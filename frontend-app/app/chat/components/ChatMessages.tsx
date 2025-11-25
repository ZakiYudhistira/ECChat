import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

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

const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "1",
    senderName: "Jasmin Lowery",
    content: "I looked into React for our design system.",
    timestamp: "09:32",
    isCurrentUser: false,
  },
  {
    id: "2",
    senderId: "1",
    senderName: "Jasmin Lowery",
    content: "This is such a great project for our portfolio!",
    timestamp: "09:32",
    isCurrentUser: false,
  },
  {
    id: "3",
    senderId: "2",
    senderName: "Alex Hunt",
    content: "That's important news!",
    timestamp: "09:34",
    isCurrentUser: false,
  },
  {
    id: "4",
    senderId: "3",
    senderName: "Alex Hunt",
    content: "Jessie Rufina has successfully completed his probationary period and is now part of our team!",
    timestamp: "09:34",
    isCurrentUser: false,
  },
  {
    id: "5",
    senderId: "current",
    senderName: "You",
    content: "Yohoo, my congratulations! I will be glad to work with you on a new project!",
    timestamp: "09:41",
    isCurrentUser: true,
  },
];

interface ChatMessagesProps {
  messages?: Message[];
}

export function ChatMessages({ messages = mockMessages }: ChatMessagesProps) {
  return (
    <ScrollArea className="flex-1 p-4">
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
