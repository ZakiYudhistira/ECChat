import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Plus, Search, Home, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { clearAuthData, getAuthData } from "~/helpers/storage";
import { toast } from "sonner";

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online?: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Design chat",
    lastMessage: "That sounds like a creative idea!",
    timestamp: "2m",
    unread: 3,
    online: true,
  },
  {
    id: "2",
    name: "Damon Campus",
    lastMessage: "Let's schedule a meeting",
    timestamp: "15m",
    unread: 0,
    online: true,
  },
  {
    id: "3",
    name: "Jayden Church",
    lastMessage: "I finished the presentation",
    timestamp: "1h",
    unread: 0,
    online: false,
  },
  {
    id: "4",
    name: "Jacob McNeal",
    lastMessage: "Thanks for the update",
    timestamp: "3h",
    unread: 1,
    online: false,
  },
  {
    id: "5",
    name: "Jasmin Lowery",
    lastMessage: "See you tomorrow!",
    timestamp: "5h",
    unread: 0,
    online: true,
  },
];

interface ChatSidebarProps {
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
}

export function ChatSidebar({ selectedChat, onSelectChat }: ChatSidebarProps) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    clearAuthData(); // Clear JWT and keys
    toast.success("Logged out successfully");
    navigate('/login', { replace: true });
  };
  
  const authData = getAuthData();

  return (
    <div className="w-fit border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold mb-4">Messages</h2>
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9"
          />
          <button
            className="ml-2 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition"
            aria-label="Add new conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {mockConversations.map((conversation) => (
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
      </ScrollArea>
      
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {authData?.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Welcome Back,</p>
            <p className="text-xs text-muted-foreground truncate">{authData?.username}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link to="/" className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <Button variant="destructive" size="sm" className="flex-1" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
