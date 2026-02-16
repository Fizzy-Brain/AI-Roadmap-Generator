import { RoadmapTextData } from "@/types/roadmap";
import { Download, ChevronDown, ChevronRight, GripVertical, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useCallback } from "react";
import { useAppState } from "@/context/AppContext";

interface RoadmapViewProps {
  data: RoadmapTextData;
}

interface RoadmapSection {
  title: string;
  items: RoadmapItem[];
}

interface RoadmapItem {
  name: string;
  children: string[];
}

function parseContent(content: string) {
  let description = "";
  let skills: string[] = [];
  const sections: RoadmapSection[] = [];
  let topics: string[] = [];
  let currentSection = "";
  let currentRoadmapSection: RoadmapSection | null = null;
  let currentItem: RoadmapItem | null = null;

  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("ROLE:")) continue;
    if (trimmed === "DESCRIPTION:") { currentSection = "desc"; continue; }
    if (trimmed === "SKILLS REQUIRED:") { currentSection = "skills"; continue; }
    if (trimmed === "ROADMAP:") { currentSection = "roadmap"; continue; }
    if (trimmed.startsWith("TOPICS:")) {
      currentSection = "topics";
      const topicsStr = trimmed.replace("TOPICS:", "").trim();
      if (topicsStr) topics = topicsStr.split(",").map(t => t.trim()).filter(Boolean);
      continue;
    }

    if (currentSection === "desc" && trimmed) description += trimmed + " ";
    if (currentSection === "skills" && trimmed.startsWith("-")) skills.push(trimmed.slice(1).trim());

    if (currentSection === "roadmap") {
      const indent = line.search(/\S/);
      if (indent < 0) continue;

      // Top-level section title (no indent, not numbered)
      if (indent === 0 && !trimmed.startsWith("•") && !/^\d+\./.test(trimmed)) continue;

      // Numbered category (e.g., "1. Frontend Development")
      if (/^\d+\./.test(trimmed)) {
        if (currentItem && currentRoadmapSection) currentRoadmapSection.items.push(currentItem);
        if (currentRoadmapSection) sections.push(currentRoadmapSection);
        currentRoadmapSection = { title: trimmed.replace(/^\d+\.\s*/, ""), items: [] };
        currentItem = null;
        continue;
      }

      // Sub-item with bullet
      if (trimmed.startsWith("•")) {
        const name = trimmed.slice(1).trim();
        // 8 spaces = main item under numbered category, 12+ = child
        if (indent <= 8) {
          if (currentItem && currentRoadmapSection) currentRoadmapSection.items.push(currentItem);
          currentItem = { name, children: [] };
        } else {
          if (currentItem) currentItem.children.push(name);
        }
        continue;
      }
    }

    if (currentSection === "topics" && trimmed) {
      topics = trimmed.split(",").map(t => t.trim()).filter(Boolean);
    }
  }

  if (currentItem && currentRoadmapSection) currentRoadmapSection.items.push(currentItem);
  if (currentRoadmapSection) sections.push(currentRoadmapSection);

  return { description: description.trim(), skills, sections, topics };
}

const SECTION_COLORS = [
  "bg-primary/10 text-primary border-primary/20",
  "bg-success/10 text-success border-success/20",
  "bg-warning/10 text-warning border-warning/20",
  "bg-info/10 text-info border-info/20",
  "bg-destructive/10 text-destructive border-destructive/20",
  "bg-accent text-accent-foreground border-accent",
];

function SectionCard({
  section,
  index,
  isAdmin,
  onReorder,
  totalSections,
}: {
  section: RoadmapSection;
  index: number;
  isAdmin: boolean;
  onReorder: (from: number, to: number) => void;
  totalSections: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = SECTION_COLORS[index % SECTION_COLORS.length];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/50"
      >
        {isAdmin && (
          <div className="flex flex-col gap-0.5 mr-1">
            <button
              onClick={(e) => { e.stopPropagation(); if (index > 0) onReorder(index, index - 1); }}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
              disabled={index === 0}
            >▲</button>
            <button
              onClick={(e) => { e.stopPropagation(); if (index < totalSections - 1) onReorder(index, index + 1); }}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
              disabled={index === totalSections - 1}
            >▼</button>
          </div>
        )}
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold ${colorClass}`}>
          {index + 1}
        </span>
        <span className="flex-1 font-heading text-lg text-foreground">{section.title}</span>
        <span className="text-xs text-muted-foreground mr-2">{section.items.length} topics</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-secondary/30 p-3.5"
              >
                <div className="mb-2 font-medium text-sm text-foreground">{item.name}</div>
                {item.children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.children.map((child, j) => (
                      <span
                        key={j}
                        className="rounded-md bg-background border border-border px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {child}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoadmapView({ data }: RoadmapViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAppState();
  const parsed = parseContent(data.content);
  const [sections, setSections] = useState(parsed.sections);

  const handleReorder = useCallback((from: number, to: number) => {
    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleDownload = () => {
    const blob = new Blob([data.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.role}-roadmap.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in space-y-6" ref={ref}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-3xl text-foreground">
          {data.role}
        </h2>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>

      {/* Description */}
      {parsed.description && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            About this role
          </h3>
          <p className="text-sm leading-relaxed text-secondary-foreground">{parsed.description}</p>
        </div>
      )}

      {/* Skills */}
      {parsed.skills.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Skills Required
          </h3>
          <div className="flex flex-wrap gap-2">
            {parsed.skills.map((skill, i) => (
              <span
                key={i}
                className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Roadmap */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Learning Path
          </h3>
          {isAdmin && (
            <span className="text-xs text-muted-foreground">
              ↕ Drag to reorder sections
            </span>
          )}
        </div>
        <div className="space-y-2">
          {sections.map((section, i) => (
            <SectionCard
              key={section.title + i}
              section={section}
              index={i}
              isAdmin={isAdmin}
              onReorder={handleReorder}
              totalSections={sections.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
