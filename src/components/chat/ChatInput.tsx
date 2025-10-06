import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onShowExamples: () => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onShowExamples,
  onOpenSettings,
  hasApiKey,
  disabled,
  placeholder = "Describe your system architecture...",
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel p-4 space-y-3">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[100px] bg-background/50 border-white/10 resize-none"
      />

      <div className="flex items-center gap-2">
        <Button
          onClick={() => {
            if (hasApiKey) {
              onShowExamples();
            } else {
              onOpenSettings();
            }
          }}
          variant="outline"
          size="sm"
          className="flex-shrink-0"
          title={hasApiKey ? "Examples" : "Set API Key"}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {hasApiKey ? "Examples" : "Set API Key"}
        </Button>

        <Button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="ml-auto hover-glow"
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-2 py-0.5 bg-muted rounded text-xs">⌘ + Enter</kbd> to send
      </p>
    </div>
  );
}
