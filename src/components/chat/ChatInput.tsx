import { useState, useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Sparkles, X } from "lucide-react";
import { Attachment } from "@/types/diagflow";
import { useToast } from "@/hooks/use-toast";
import { GEMINI_SUPPORTS_IMAGE_INPUT } from "@/lib/gemini";

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSend = () => {
    if (disabled) {
      return;
    }

    const message = input.trim();
    if (!message && attachments.length === 0) {
      return;
    }

    onSend(message, attachments);
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!GEMINI_SUPPORTS_IMAGE_INPUT) {
      return;
    }

    const items = e.clipboardData?.items;
    if (!items) {
      return;
    }

    const files: File[] = [];
    Array.from(items).forEach((item) => {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    });

    if (files.length > 0) {
      e.preventDefault();
      processFiles(files, "clipboard");
    }
  };

  const processFiles = (files: File[] | FileList, source: "upload" | "clipboard") => {
    if (!GEMINI_SUPPORTS_IMAGE_INPUT) {
      toast({
        title: "Image attachments unavailable",
        description: "The configured Gemini model does not support image inputs.",
        variant: "destructive",
      });
      return;
    }

    const ALLOWED_TYPES = ["image/png", "image/jpeg"];
    const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB per image

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: "Only PNG and JPG images are allowed.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        toast({
          title: "File too large",
          description: "Images must be smaller than 8MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        if (!base64) {
          toast({
            title: "Failed to read file",
            description: "Could not process the selected image.",
            variant: "destructive",
          });
          return;
        }

        const newAttachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl: result,
          base64,
          source,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.onerror = () => {
        toast({
          title: "File error",
          description: "Failed to read the selected image.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    if (!GEMINI_SUPPORTS_IMAGE_INPUT) {
      toast({
        title: "Update your model",
        description: "Switch to a Gemini Flash or Vision model to attach images.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }
    processFiles(files, "upload");
    // reset input so same file re-select possible
    event.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  return (
    <div className="glass-panel p-4 space-y-3">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[100px] bg-background/50 border-white/10 resize-none"
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group rounded-lg overflow-hidden border border-border/60 bg-background/60"
            >
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="h-20 w-20 object-cover"
              />
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${attachment.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          multiple
          onChange={handleFilePick}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-shrink-0"
          onClick={() => {
            if (!GEMINI_SUPPORTS_IMAGE_INPUT) {
              toast({
                title: "Image attachments unavailable",
                description: "Current Gemini model does not accept images. Use a Flash or Vision variant.",
                variant: "destructive",
              });
              return;
            }
            fileInputRef.current?.click();
          }}
          title={GEMINI_SUPPORTS_IMAGE_INPUT ? "Attach image" : "Model does not support images"}
        >
          <Paperclip className="w-4 h-4 mr-2" />
          Attach
        </Button>

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
          disabled={(input.trim().length === 0 && attachments.length === 0) || disabled}
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
