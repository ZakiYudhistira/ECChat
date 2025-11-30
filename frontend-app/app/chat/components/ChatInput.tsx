import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Paperclip, Smile, Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isConnected: boolean;
  roomId: string | null;
  receiverUsername: string | null;
}

export function ChatInput({ onSendMessage, isConnected, roomId, receiverUsername }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && roomId && receiverUsername && isConnected) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const isDisabled = !isConnected || !roomId || !receiverUsername;

  return (
    <div className="border-t border-border p-4 w-full h-fit">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon">
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isDisabled ? "Select a chat to send messages..." : "Type your message..."}
            className="pr-10"
            disabled={isDisabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>
        
        {message.trim() && !isDisabled ? (
          <Button type="submit" size="icon">
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="icon" disabled={isDisabled}>
            <Send className="h-5 w-5" />
          </Button>
        )}
      </form>
    </div>
  );
}
