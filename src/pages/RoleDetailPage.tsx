import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import RoadmapView from "@/components/RoadmapView";
import MindmapView from "@/components/MindmapView";
import ProgressInsight from "@/components/ProgressInsight";
import EditRoadmapModal from "@/components/EditRoadmapModal";
import { Button } from "@/components/ui/button";
import {
  Map,
  GitBranch,
  BarChart3,
  Loader2,
  ArrowLeft,
  Sparkles,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/context/AppContext";
import { MindmapNode, RoadmapTextData, MindmapData } from "@/types/roadmap";
import {
  generateFullRoadmap,
  extractTopics,
  updateRoadmap,
  GenerationResult,
} from "@/services/api";

type ViewMode = "roadmap" | "mindmap" | "progress";

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const [searchParams] = useSearchParams();
  const roleName =
    searchParams.get("name") || roleId?.replace(/-/g, " ") || "";
  const { toast } = useToast();
  const { isAdmin } = useAppState();

  const [view, setView] = useState<ViewMode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Data
  const [mindmapNode, setMindmapNode] = useState<MindmapNode | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);

  // Admin edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Derived data objects for child components
  const roadmapData: RoadmapTextData | null = useMemo(() => {
    if (!textContent) return null;
    return {
      department: "Job Roles",
      role: roleName,
      content: textContent,
      createdAt: new Date().toISOString(),
    };
  }, [textContent, roleName]);

  const mindmapData: MindmapData | null = useMemo(() => {
    if (!mindmapNode) return null;
    return { department: "Job Roles", role: roleName, data: mindmapNode };
  }, [mindmapNode, roleName]);

  // Auto-generate on mount
  const handleGenerate = useCallback(async () => {
    if (!roleName || isGenerating) return;
    setIsGenerating(true);
    setView(null);

    try {
      const result: GenerationResult = await generateFullRoadmap(roleName);
      setMindmapNode(result.mindmap);
      setTextContent(result.textContent);
      setTopics(result.topics);
      setHasGenerated(true);
      setView("roadmap"); // auto-show roadmap

      toast({
        title: result.cached ? "Loaded from cache" : "Roadmap ready",
        description: `Generated roadmap for ${roleName}`,
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description:
          error instanceof Error
            ? error.message
            : "Please try again with a valid engineering role",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [roleName, isGenerating, toast]);

  useEffect(() => {
    if (roleName && !hasGenerated && !isGenerating) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleName]);

  const handleViewChange = (mode: ViewMode) => {
    if (!hasGenerated) {
      handleGenerate();
    }
    setView(mode);
  };

  // Admin: save edited mindmap
  const handleSaveEditedRoadmap = async (updatedData: MindmapNode) => {
    setIsEditSaving(true);
    try {
      const newText = await updateRoadmap(roleName, updatedData);
      setMindmapNode(updatedData);
      setTextContent(newText);
      setTopics(extractTopics(newText));
      toast({
        title: "Roadmap updated",
        description: "Changes saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error updating roadmap",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsEditSaving(false);
    }
  };

  const tabs: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: "roadmap", label: "Roadmap", icon: <Map className="h-4 w-4" /> },
    {
      mode: "mindmap",
      label: "Mindmap",
      icon: <GitBranch className="h-4 w-4" />,
    },
    {
      mode: "progress",
      label: "Progress",
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to roles
        </Link>

        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-4xl capitalize text-foreground sm:text-5xl">
            {roleName}
          </h1>
        </div>

        {/* Tabs + Admin actions */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {tabs.map((tab) => (
              <button
                key={tab.mode}
                onClick={() => handleViewChange(tab.mode)}
                disabled={isGenerating}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  view === tab.mode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Admin: Edit Roadmap button */}
          {isAdmin && hasGenerated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="gap-1.5 border-primary/30 text-primary hover:bg-accent"
            >
              <Edit className="h-4 w-4" /> Edit Roadmap
            </Button>
          )}
        </div>

        {/* Loading */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30" />
              <div className="relative bg-accent p-5 rounded-full">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <p className="mt-6 text-foreground font-medium">
              Generating roadmap for {roleName}...
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This usually takes 15-30 seconds
            </p>
          </div>
        )}

        {/* Content */}
        {!isGenerating && view === "roadmap" && roadmapData && (
          <RoadmapView
            data={roadmapData}
            mindmapNode={mindmapNode}
            onMindmapUpdate={(updated) => {
              setMindmapNode(updated);
            }}
          />
        )}
        {!isGenerating && view === "mindmap" && mindmapData && (
          <MindmapView data={mindmapData} />
        )}
        {!isGenerating && view === "progress" && (
          <ProgressInsight roleName={roleName} topics={topics} />
        )}

        {/* Empty state - only before generation starts */}
        {!isGenerating && !hasGenerated && !view && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <Map className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="mb-1 font-heading text-xl text-foreground">
              Generating...
            </h3>
            <p className="text-sm text-muted-foreground">
              Your roadmap is being created
            </p>
          </div>
        )}
      </div>

      {/* Admin Edit Modal */}
      <EditRoadmapModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        mindMapData={mindmapNode}
        isLoading={isEditSaving}
        role={roleName}
        onSave={handleSaveEditedRoadmap}
      />
    </div>
  );
}
