import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { DiagramViewer } from "@/components/diagram/DiagramViewer";
import { ZoomControls } from "@/components/diagram/ZoomControls";
import { DiagramControls } from "@/components/diagram/DiagramControls";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { ExamplesModal } from "@/components/modals/ExamplesModal";
import { CodeViewModal } from "@/components/modals/CodeViewModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { HistoryModal } from "@/components/modals/HistoryModal";
import { HelpModal } from "@/components/modals/HelpModal";
import { storage } from "@/lib/storage";
import { generateDiagram } from "@/lib/gemini";
import { Message, DiagramHistoryEntry, AppSettings } from "@/types/diagflow";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Sparkles,
  History,
  HelpCircle,
  Maximize2,
  Minimize2,
  Workflow,
} from "lucide-react";

const Index = () => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDiagram, setCurrentDiagram] = useState("");
  const [diagramHistory, setDiagramHistory] = useState<DiagramHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load from storage on mount
  useEffect(() => {
    const savedMessages = storage.getChatHistory();
    const savedDiagram = storage.getCurrentDiagram();
    const savedHistory = storage.getDiagramHistory();
    const savedIndex = storage.getHistoryIndex();

    setMessages(savedMessages);
    setCurrentDiagram(savedDiagram);
    setDiagramHistory(savedHistory);
    setHistoryIndex(savedIndex);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp(true);
      }
      if (e.key === "Escape") {
        setShowSettings(false);
        setShowExamples(false);
        setShowCodeView(false);
        setShowExport(false);
        setShowHistory(false);
        setShowHelp(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      }
      if (e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      }
      if (e.key === "0") {
        e.preventDefault();
        handleZoomReset();
      }
      if (e.key === "f" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, diagramHistory]);

  const handleSendMessage = async (content: string) => {
    if (!settings.geminiApiKey) {
      toast({
        title: "API Key Required",
        description: "Please add your Gemini API key in settings",
        variant: "destructive",
      });
      setShowSettings(true);
      return;
    }

    const userMessage: Message = {
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const response = await generateDiagram(
        settings.geminiApiKey,
        content,
        currentDiagram,
        messages
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: `${response.explanation}\n\n${
          response.suggestions.length > 0
            ? "**Suggestions:**\n" + response.suggestions.map((s) => `• ${s}`).join("\n")
            : ""
        }`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentDiagram(response.code);

      // Add to history
      if (settings.autoSave) {
        const newEntry: DiagramHistoryEntry = {
          code: response.code,
          prompt: content,
          timestamp: Date.now(),
        };
        const newHistory = [...diagramHistory, newEntry];
        setDiagramHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        storage.saveDiagramHistory(newHistory);
        storage.saveHistoryIndex(newHistory.length - 1);
      }

      storage.saveCurrentDiagram(response.code);
      storage.saveChatHistory([...messages, userMessage, assistantMessage]);

      toast({
        title: "Diagram Generated",
        description: "Your system diagram is ready",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate diagram",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated",
    });
  };

  const handleApplyCode = (code: string) => {
    setCurrentDiagram(code);
    storage.saveCurrentDiagram(code);
    
    if (settings.autoSave) {
      const newEntry: DiagramHistoryEntry = {
        code,
        prompt: "Manual code edit",
        timestamp: Date.now(),
      };
      const newHistory = [...diagramHistory, newEntry];
      setDiagramHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      storage.saveDiagramHistory(newHistory);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentDiagram(diagramHistory[newIndex].code);
      storage.saveHistoryIndex(newIndex);
      storage.saveCurrentDiagram(diagramHistory[newIndex].code);
    }
  };

  const handleRedo = () => {
    if (historyIndex < diagramHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentDiagram(diagramHistory[newIndex].code);
      storage.saveHistoryIndex(newIndex);
      storage.saveCurrentDiagram(diagramHistory[newIndex].code);
    }
  };

  const handleRestoreHistory = (index: number) => {
    setHistoryIndex(index);
    setCurrentDiagram(diagramHistory[index].code);
    storage.saveHistoryIndex(index);
    storage.saveCurrentDiagram(diagramHistory[index].code);
    toast({
      title: "Diagram Restored",
      description: "Previous version loaded successfully",
    });
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Gradient Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-background)" }} />

      {/* Header */}
      <header className="relative z-10 glass-panel border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Workflow className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Diagflow</h1>
              <p className="text-xs text-muted-foreground">AI-Powered System Design</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="glass-panel"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(true)}
              className="glass-panel"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Examples
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="glass-panel"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(true)}
              className="glass-panel"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="glass-panel"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Chat Column */}
        <div className="w-[400px] flex flex-col border-r border-white/10">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3 max-w-sm animate-float">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto">
                    <Workflow className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">Welcome to Diagflow</h2>
                  <p className="text-sm text-muted-foreground">
                    Describe your system architecture and let Archie transform it into beautiful diagrams
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}

            {isGenerating && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <ChatInput
              onSend={handleSendMessage}
              onShowExamples={() => setShowExamples(true)}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Diagram Column */}
        <div className="flex-1 flex flex-col relative">
          {/* Controls Bar */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <DiagramControls
              onUndo={handleUndo}
              onRedo={handleRedo}
              onViewCode={() => setShowCodeView(true)}
              onExport={() => setShowExport(true)}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < diagramHistory.length - 1}
              disabled={!currentDiagram}
            />

            <ZoomControls
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onFullscreen={toggleFullscreen}
            />
          </div>

          {/* Diagram Viewer */}
          <div className="flex-1 dotted-grid relative">
            <DiagramViewer
              code={currentDiagram}
              theme={settings.theme}
              zoom={zoom}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <ExamplesModal
        open={showExamples}
        onOpenChange={setShowExamples}
        onSelectExample={handleSendMessage}
      />

      <CodeViewModal
        open={showCodeView}
        onOpenChange={setShowCodeView}
        code={currentDiagram}
        onApply={handleApplyCode}
      />

      <ExportModal
        open={showExport}
        onOpenChange={setShowExport}
        code={currentDiagram}
      />

      <HistoryModal
        open={showHistory}
        onOpenChange={setShowHistory}
        history={diagramHistory}
        onRestore={handleRestoreHistory}
      />

      <HelpModal
        open={showHelp}
        onOpenChange={setShowHelp}
      />
    </div>
  );
};

export default Index;
