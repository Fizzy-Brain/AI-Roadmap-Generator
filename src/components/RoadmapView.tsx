import { RoadmapTextData, MindmapNode } from "@/types/roadmap";
import {
  Download,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RoadmapViewProps {
  data: RoadmapTextData;
  mindmapNode?: MindmapNode | null;
  onMindmapUpdate?: (updated: MindmapNode) => void;
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
    if (trimmed === "DESCRIPTION:") {
      currentSection = "desc";
      continue;
    }
    if (trimmed === "SKILLS REQUIRED:") {
      currentSection = "skills";
      continue;
    }
    if (trimmed.startsWith("ROADMAP")) {
      currentSection = "roadmap";
      continue;
    }
    if (trimmed.startsWith("TOPICS:")) {
      currentSection = "topics";
      const topicsStr = trimmed.replace("TOPICS:", "").trim();
      if (topicsStr)
        topics = topicsStr
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      continue;
    }
    if (currentSection === "desc" && trimmed) description += trimmed + " ";
    if (currentSection === "skills" && trimmed.startsWith("-"))
      skills.push(trimmed.slice(1).trim());
    if (currentSection === "roadmap") {
      const indent = line.search(/\S/);
      if (indent < 0) continue;
      if (
        indent === 0 &&
        !trimmed.startsWith("•") &&
        !/^\d+\./.test(trimmed)
      )
        continue;
      if (/^\d+\./.test(trimmed)) {
        if (currentItem && currentRoadmapSection)
          currentRoadmapSection.items.push(currentItem);
        if (currentRoadmapSection) sections.push(currentRoadmapSection);
        currentRoadmapSection = {
          title: trimmed.replace(/^\d+\.\s*/, ""),
          items: [],
        };
        currentItem = null;
        continue;
      }
      if (trimmed.startsWith("•")) {
        const name = trimmed.slice(1).trim();
        if (indent <= 8) {
          if (currentItem && currentRoadmapSection)
            currentRoadmapSection.items.push(currentItem);
          currentItem = { name, children: [] };
        } else {
          if (currentItem) currentItem.children.push(name);
        }
        continue;
      }
    }
    if (currentSection === "topics" && trimmed) {
      topics = trimmed
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }
  if (currentItem && currentRoadmapSection)
    currentRoadmapSection.items.push(currentItem);
  if (currentRoadmapSection) sections.push(currentRoadmapSection);
  return { description: description.trim(), skills, sections, topics };
}

const SECTION_COLORS = [
  {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    tag: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    tag: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    tag: "bg-amber-50 text-amber-600 border-amber-200",
  },
  {
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
    tag: "bg-purple-50 text-purple-600 border-purple-200",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    tag: "bg-rose-50 text-rose-600 border-rose-200",
  },
  {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    badge: "bg-cyan-100 text-cyan-700",
    dot: "bg-cyan-500",
    tag: "bg-cyan-50 text-cyan-600 border-cyan-200",
  },
  {
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    tag: "bg-orange-50 text-orange-600 border-orange-200",
  },
];

function SectionCard({
  section,
  index,
}: {
  section: RoadmapSection;
  index: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const colors = SECTION_COLORS[index % SECTION_COLORS.length];

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all duration-200`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:opacity-80"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${colors.badge}`}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-heading text-xl text-foreground block">
            {section.title}
          </span>
          <span className="text-sm text-muted-foreground">
            {section.items.length} topics
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <div className="space-y-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-background/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${colors.dot}`}
                  />
                  <span className="font-medium text-base text-foreground">
                    {item.name}
                  </span>
                </div>
                {item.children.length > 0 && (
                  <div className="ml-[18px] flex flex-wrap gap-1.5">
                    {item.children.map((child, j) => (
                      <span
                        key={j}
                        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${colors.tag}`}
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

function TreeNodeView({
  node,
  level = 0,
  expandedNodes,
  toggleNode,
  path,
}: {
  node: MindmapNode;
  level: number;
  expandedNodes: Set<string>;
  toggleNode: (path: string) => void;
  path: string;
}) {
  const hasChildren = !!(node.children?.length);
  const isExpanded = expandedNodes.has(path);
  const color = node.color;

  return (
    <div style={{ marginLeft: level > 0 ? 16 : 0 }}>
      <div className="flex items-center gap-1.5 py-0.5">
        {hasChildren ? (
          <button
            onClick={() => toggleNode(path)}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-secondary transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        <span
          className="px-3 py-1.5 rounded-md text-base font-medium bg-secondary/50 border border-border/50 text-foreground"
          style={
            color ? { borderLeftColor: color, borderLeftWidth: 3 } : undefined
          }
        >
          {node.name}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-2.5 border-l border-border/50 pl-1">
          {node.children!.map((child, i) => (
            <TreeNodeView
              key={`${path}-${i}`}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              path={`${path}-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoadmapView({ data, mindmapNode }: RoadmapViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const parsed = useMemo(() => parseContent(data.content), [data.content]);
  const [activeTab, setActiveTab] = useState("overview");

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (mindmapNode) {
      initial.add("root");
      mindmapNode.children?.forEach((_, i) => {
        initial.add(`root-${i}`);
      });
    }
    return initial;
  });

  const toggleNode = (path: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleDownload = () => {
    const blob = new Blob([data.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.role}-roadmap.txt`.replace(/\s+/g, "-").toLowerCase();
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in space-y-6" ref={ref}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-3xl text-foreground">{data.role}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> Skills
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Roadmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {parsed.description && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                About this role
              </h3>
              <p className="text-base leading-relaxed text-secondary-foreground whitespace-pre-line">
                {parsed.description}
              </p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-3xl font-heading text-primary">
                {parsed.sections.length}
              </div>
              <div className="text-sm text-muted-foreground">Sections</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-3xl font-heading text-primary">
                {parsed.skills.length}
              </div>
              <div className="text-sm text-muted-foreground">Skills</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-3xl font-heading text-primary">
                {parsed.topics.length}
              </div>
              <div className="text-sm text-muted-foreground">Topics</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Required Skills
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {parsed.skills.map((skill, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="text-base text-secondary-foreground leading-relaxed">
                    {skill}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          {mindmapNode && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Full Tree View
              </h3>
              <div className="rounded-xl border border-border bg-card p-5 max-h-[500px] overflow-auto">
                <div className="px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20 font-semibold text-primary mb-3 text-lg">
                  {mindmapNode.name}
                </div>
                <div className="space-y-0.5">
                  {mindmapNode.children?.map((child, i) => (
                    <TreeNodeView
                      key={i}
                      node={child}
                      level={0}
                      expandedNodes={expandedNodes}
                      toggleNode={toggleNode}
                      path={`root-${i}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Learning Path
            </h3>
            <div className="space-y-3">
              {parsed.sections.map((section, i) => (
                <SectionCard
                  key={section.title + i}
                  section={section}
                  index={i}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
