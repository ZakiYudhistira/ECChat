import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Phone, Video, MoreVertical } from "lucide-react";
import { Button } from "../../components/ui/button";

interface ChatHeaderProps {
  name: string;
  status: string;
  avatar?: string;
}

export function ChatHeader({ name, status, avatar }: ChatHeaderProps) {
  return (
    <div className="h-16 border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
