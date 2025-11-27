import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
}

export function ConversationList({ conversations, selectedChat, onSelectChat }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-xs">Start a conversation with your contacts</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <button 
          key={conversation.id}
          onClick={() => onSelectChat(conversation.id)}
          className={`w-full p-3 rounded-lg flex items-start gap-3 hover:bg-accent transition-colors ${
            selectedChat === conversation.id ? "bg-accent" : ""
          }`}
        >
          <div className="relative">
            <Avatar>
              <AvatarImage src={conversation.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {conversation.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {conversation.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          
          <div className="flex-1 text-left overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{conversation.name}</span>
              <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate">
                {conversation.lastMessage}
              </p>
              {conversation.unread > 0 && (
                <Badge variant="default" className="ml-2 h-5 min-w-5 flex items-center justify-center">
                  {conversation.unread}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}