import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFullscreen: () => void;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFullscreen,
}: ZoomControlsProps) {
  return (
    <div className="glass-panel p-2 flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={onZoomReset}
        className="h-8 px-3 min-w-[4rem] text-xs font-mono"
      >
        {Math.round(zoom * 100)}%
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={onZoomIn}
        disabled={zoom >= 2}
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={onFullscreen}
        className="h-8 w-8 p-0"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
