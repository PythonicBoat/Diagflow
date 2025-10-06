import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileImage, FileCode, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

export function ExportModal({ open, onOpenChange, code }: ExportModalProps) {
  const { toast } = useToast();

  const handleExportSVG = () => {
    const svgElement = document.querySelector("#diagram-svg-container svg");
    if (!svgElement) {
      toast({
        title: "Error",
        description: "No diagram to export",
        variant: "destructive",
      });
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diagram-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "SVG file downloaded successfully",
    });
  };

  const handleExportPNG = () => {
    const svgElement = document.querySelector("#diagram-svg-container svg");
    if (!svgElement) {
      toast({
        title: "Error",
        description: "No diagram to export",
        variant: "destructive",
      });
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `diagram-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);

          toast({
            title: "Exported",
            description: "PNG file downloaded successfully",
          });
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] glass-panel border-white/10">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Export Diagram</DialogTitle>
          <DialogDescription>
            Choose your preferred export format
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Button
            onClick={handleExportPNG}
            variant="outline"
            className="glass-panel hover-glow h-auto py-4"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <FileImage className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Export as PNG</div>
                <div className="text-xs text-muted-foreground">
                  Raster image format
                </div>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleExportSVG}
            variant="outline"
            className="glass-panel hover-glow h-auto py-4"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <FileCode className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Export as SVG</div>
                <div className="text-xs text-muted-foreground">
                  Scalable vector format
                </div>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleCopyCode}
            variant="outline"
            className="glass-panel hover-glow h-auto py-4"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Copy className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Copy Code</div>
                <div className="text-xs text-muted-foreground">
                  Mermaid source code
                </div>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
