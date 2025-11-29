import { useState, useEffect } from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Search, Home, LogOut, Users } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { clearAuthData, getAuthData } from "~/helpers/storage";
import { toast } from "sonner";
import { AddContactDialog } from "./AddContactDialog";
import { ContactList } from "./ContactList";
import { ConversationList } from "./ConversationList";
import { type Contact } from "../../controller/Contact";
import { ChatroomController, type Chatroom } from "../../controller/Chatroom";

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
  const [showContacts, setShowContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactRefreshTrigger, setContactRefreshTrigger] = useState(0);
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingChatrooms, setIsLoadingChatrooms] = useState(false);
  
  const authData = getAuthData();

  // Get chatrooms pre rendering
  useEffect(() => {
    const fetchChatrooms = async () => {
      if (!authData?.username) return;
      
      setIsLoadingChatrooms(true);
      try {
        const userChatrooms = await ChatroomController.getChatrooms(authData.username);
        setChatrooms(userChatrooms);
        
        // Format chatrooms
        const conversationsFromChatrooms: Conversation[] = userChatrooms.map(chatroom => {
          const otherUser = ChatroomController.getOtherParticipant(chatroom, authData.username);
          
          return {
            id: chatroom._id,
            name: otherUser,
            lastMessage: "No messages yet", // Placeholder
            timestamp: new Date(chatroom.updatedAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            unread: 0, // Placeholder
            online: false, // Placeholder
          };
        });
        
        setConversations(conversationsFromChatrooms);
      } catch (error) {
        console.error('Failed to fetch chatrooms:', error);
        toast.error('Failed to load conversations');
      } finally {
        setIsLoadingChatrooms(false);
      }
    };

    fetchChatrooms();
  }, [authData?.username]);
  
  const handleLogout = () => {
    clearAuthData(); // Clear JWT and keys
    toast.success("Logged out successfully");
    navigate('/login', { replace: true });
  };
  
  const handleContactAdded = () => {
    setContactRefreshTrigger(prev => prev + 1); // Trigger contact list refresh
  };

  const handleContactSelect = async (contact: Contact) => {
    setSelectedContact(contact.username);
    
    try {
      if (!authData?.username) return;
      
      const chatroom = await ChatroomController.createChatroom(authData.username, contact.username);
      
      const existingIndex = chatrooms.findIndex(c => c._id === chatroom._id);
      
      if (existingIndex === -1) {
        setChatrooms(prev => [chatroom, ...prev]);
        
        const newConversation: Conversation = {
          id: chatroom._id,
          name: contact.username,
          lastMessage: "Start chatting...",
          timestamp: "now",
          unread: 0,
          online: false,
        };
        
        setConversations(prev => [newConversation, ...prev]);
      }
      
      // Select the chatroom
      onSelectChat(chatroom._id);
      setShowContacts(false);
      
      toast.success(`Chat with ${contact.username}`);
    } catch (error) {
      console.error('Failed to create/get chatroom:', error);
      toast.error('Failed to open conversation');
    }
  };

  const handleContactRemove = (username: string) => {
    if (selectedContact === username) {
      setSelectedContact(null);
    }
  };
  

  return (
    <div className="w-fit border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{showContacts ? 'Contacts' : 'Messages'}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowContacts(!showContacts)}
            className="text-primary hover:bg-primary/10"
          >
            <Users className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={showContacts ? "Search contacts..." : "Search conversations..."}
            className="pl-9"
          />
          <div className="ml-2">
            <AddContactDialog onContactAdded={handleContactAdded} />
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {showContacts ? (
            <ContactList 
              onContactSelect={handleContactSelect}
              selectedContactUsername={selectedContact}
              refreshTrigger={contactRefreshTrigger}
              onContactRemove={handleContactRemove}
            />
          ) : isLoadingChatrooms ? (
            <div className="text-center text-muted-foreground py-8">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-2">Add a contact to start chatting!</p>
            </div>
          ) : (
            <ConversationList 
              conversations={conversations}
              selectedChat={selectedChat}
              onSelectChat={onSelectChat}
            />
          )}
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
