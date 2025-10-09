import { Message } from "@/types/diagflow";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasContent = Boolean(message.content && message.content.trim().length > 0);

  return (
    <div
      className={`flex gap-3 mb-4 animate-slide-in ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser
            ? "bg-gradient-to-br from-primary to-accent"
            : "glass-panel"
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-primary" />
        )}
      </div>

      <div
        className={`flex-1 max-w-[80%] ${
          isUser ? "text-right" : "text-left"
        }`}
      >
        {hasContent && (
          <div
            className={`inline-block px-4 py-3 rounded-2xl ${
              isUser
                ? "bg-gradient-to-br from-primary to-accent text-white"
                : "glass-panel"
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div
            className={`mt-2 flex flex-wrap gap-2 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="overflow-hidden rounded-lg border border-border/60 bg-background/40"
              >
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="h-24 w-24 object-cover"
                />
              </div>
            ))}
          </div>
        )}
        
        {message.timestamp && (
          <p className="text-xs text-muted-foreground mt-1 px-2">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
