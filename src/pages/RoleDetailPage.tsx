import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import RoadmapView from "@/components/RoadmapView";
import MindmapView from "@/components/MindmapView";
import ProgressInsight from "@/components/ProgressInsight";
import { Button } from "@/components/ui/button";
import { Map, GitBranch, BarChart3, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { mockRoadmapText, mockMindmapData } from "@/data/mockData";

type ViewMode = "roadmap" | "mindmap" | "progress";

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const [searchParams] = useSearchParams();
  const roleName = searchParams.get("name") || roleId?.replace(/-/g, " ") || "";
  const [view, setView] = useState<ViewMode | null>(null);
  const [loading, setLoading] = useState(false);

  const roadmapData = roleId ? mockRoadmapText[roleId] || mockRoadmapText["fullstack-developer"] : null;
  const mindmapData = roleId ? mockMindmapData[roleId] || mockMindmapData["fullstack-developer"] : null;

  const topics = useMemo(() => {
    if (!roadmapData) return [];
    const topicsMatch = roadmapData.content.match(/TOPICS:\s*\n?(.*)/s);
    if (topicsMatch) {
      return topicsMatch[1].split(",").map((t) => t.trim()).filter(Boolean);
    }
    return [];
  }, [roadmapData]);

  const handleGenerate = (mode: ViewMode) => {
    setLoading(true);
    setTimeout(() => {
      setView(mode);
      setLoading(false);
    }, 400);
  };

  const tabs: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: "roadmap", label: "Roadmap", icon: <Map className="h-4 w-4" /> },
    { mode: "mindmap", label: "Mindmap", icon: <GitBranch className="h-4 w-4" /> },
    { mode: "progress", label: "Progress", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to roles
        </Link>

        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-4xl capitalize text-foreground sm:text-5xl">
            {roleName}
          </h1>
        </div>

        {/* Tab buttons */}
        <div className="mb-8 flex gap-1 rounded-xl border border-border bg-card p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.mode}
              onClick={() => handleGenerate(tab.mode)}
              disabled={loading}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                view === tab.mode
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && view === "roadmap" && roadmapData && (
          <RoadmapView data={roadmapData} />
        )}

        {!loading && view === "mindmap" && mindmapData && (
          <MindmapView data={mindmapData} />
        )}

        {!loading && view === "progress" && (
          <ProgressInsight roleName={roleName} topics={topics} />
        )}

        {!loading && !view && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <Map className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="mb-1 font-heading text-xl text-foreground">
              Choose a view
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate a roadmap, mindmap, or track your progress
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
