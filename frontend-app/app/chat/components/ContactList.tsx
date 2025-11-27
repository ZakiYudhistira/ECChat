import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Users, Trash2 } from "lucide-react";
import { getContacts, removeContact, type Contact } from "../../controller/Contact";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"

interface ContactListProps {
  onContactSelect?: (contact: Contact) => void;
  selectedContactUsername?: string | null;
  refreshTrigger?: number;
}

export function ContactList({ onContactSelect, selectedContactUsername, refreshTrigger }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [removingContact, setRemovingContact] = useState<string | null>(null);
  const [contactToRemove, setContactToRemove] = useState<string | null>(null);

  const loadContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const userContacts = await getContacts();
      setContacts(userContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleRemoveContactClick = (contactUsername: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToRemove(contactUsername);
  };

  const confirmRemoveContact = async () => {
    if (!contactToRemove) return;

    setRemovingContact(contactToRemove);
    try {
      await removeContact(contactToRemove);
      toast.success(`${contactToRemove} removed from contacts`);
      await loadContacts();
    } catch (error) {
      console.error('Failed to remove contact:', error);
      toast.error('Failed to remove contact');
    } finally {
      setRemovingContact(null);
      setContactToRemove(null);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [refreshTrigger]);

  if (isLoadingContacts) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading contacts...
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No contacts yet</p>
        <p className="text-xs">Add someone to start chatting</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {contacts.map((contact) => (
        <button 
          key={contact.username}
          onClick={() => onContactSelect?.(contact)}
          className={`w-full p-3 rounded-lg flex items-start gap-3 hover:bg-accent transition-colors ${
            selectedContactUsername === contact.username ? "bg-accent" : ""
          }`}
        >
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {contact.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-left overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{contact.username}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  contact.exists 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {contact.exists ? 'Active' : 'Inactive'}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={(e) => handleRemoveContactClick(contact.username, e)}
                      disabled={removingContact === contact.username}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                      title="Remove contact"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Contact</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {contactToRemove} from your contacts? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setContactToRemove(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={confirmRemoveContact}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Added {new Date(contact.addedAt).toLocaleDateString()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}