import { Button } from "@/components/ui/button";
import { Code2, Download, Undo2, Redo2 } from "lucide-react";

interface DiagramControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onViewCode: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  disabled?: boolean;
}

export function DiagramControls({
  onUndo,
  onRedo,
  onViewCode,
  onExport,
  canUndo,
  canRedo,
  disabled,
}: DiagramControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="glass-panel p-1 flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onRedo}
          disabled={!canRedo || disabled}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={onViewCode}
        disabled={disabled}
        className="glass-panel hover-glow"
      >
        <Code2 className="w-4 h-4 mr-2" />
        View Code
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onExport}
        disabled={disabled}
        className="glass-panel hover-glow"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  );
}
