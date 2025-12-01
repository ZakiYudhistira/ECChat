import { useState } from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Search, Home, LogOut, BookUser } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { clearAuthData, getAuthData } from "~/helpers/storage";
import { toast } from "sonner";
import { AddContactDialog } from "./AddContactDialog";
import { ContactList } from "./ContactList";
import { ConversationList } from "./ConversationList";
import { type Contact } from "../../controller/Contact";
import { createChatroom, type Chatroom } from "../../controller/Chatroom"
import { sharedSecret } from "~/helpers/sharedsecret";
import type { ConversationItem } from "../../hooks/useChatRooms";


interface ChatSidebarProps {
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
  conversations: ConversationItem[];
  isLoadingRooms: boolean;
  onNewConversation: (chatroom: Chatroom) => void;
}

export function ChatSidebar({ 
  selectedChat, 
  onSelectChat, 
  conversations,
  isLoadingRooms,
  onNewConversation
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const [showContacts, setShowContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactRefreshTrigger, setContactRefreshTrigger] = useState(0);

  const authData = getAuthData();

  // Transform conversations for ConversationList component
  const conversationListItems = conversations.map(conv => ({
    id: conv.id,
    name: conv.otherUsername,
    lastMessage: conv.lastMessage,
    timestamp: new Date(conv.updatedAt || conv.createdAt || '').toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }),
    unread: conv.unreadCount,
    online: conv.online,
  }));
  
  const handleLogout = () => {
    sharedSecret.clearAll();
    clearAuthData(); // Clear JWT and keys
    toast.success("Logged out successfully");
    navigate('/login', { replace: true });
  };
  
  const handleContactAdded = () => {
    setContactRefreshTrigger(prev => prev + 1); // Trigger contact list refresh
  };

  const handleContactSelect = async (contact: Contact) => {
    try {
      if (!authData) return;
      
      setSelectedContact(contact.username);
      
      // Create or get existing chatroom
      const input = [authData.username, contact.username]
      input.sort();
      const chatroom = await createChatroom(input[0], input[1]);
      
      // Notify parent to add to conversation list
      onNewConversation(chatroom);
      
      // Select the chatroom
      onSelectChat(chatroom.id);
      
      // Switch to messages view
      setShowContacts(false);
      
      toast.success(`Chat with ${contact.username}`);
    } catch (error) {
      console.error('Failed to create chatroom:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleContactRemove = (username: string) => {
    if (selectedContact === username) {
      setSelectedContact(null);
    }
  };  

  return (
    <div className="border-r border-border flex flex-col h-full min-w-85">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{showContacts ? 'Contacts' : 'Messages'}</h2>
          <div className="flex items-center gap-2">
            <AddContactDialog onContactAdded={handleContactAdded} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContacts(!showContacts)}
              className={`relative ${
                showContacts 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-primary/10"
              }`}
            >
              <BookUser className="w-5 h-5" />
              {showContacts && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
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
          ) : (
            <ConversationList 
              conversations={conversationListItems}
              selectedChat={selectedChat}
              onSelectChat={onSelectChat}
              isLoading={isLoadingRooms}
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
