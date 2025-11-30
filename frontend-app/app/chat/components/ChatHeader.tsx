import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

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
    </div>
  );
}
