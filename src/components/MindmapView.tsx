import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MindmapData, MindmapNode } from "@/types/roadmap";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toPng } from "html-to-image";

interface MindmapViewProps {
  data: MindmapData;
}

function CustomNode({ data }: { data: { label: string; color?: string; isRoot?: boolean; depth?: number } }) {
  return (
    <div
      className="rounded-lg border px-3 py-2 text-center font-body text-xs font-medium shadow-md transition-shadow hover:shadow-lg"
      style={{
        background: data.isRoot
          ? "hsl(168, 70%, 45%)"
          : data.color
          ? `${data.color}dd`
          : "hsl(220, 18%, 14%)",
        borderColor: data.color || "hsl(220, 14%, 22%)",
        color: data.isRoot || data.color ? "#fff" : "hsl(210, 20%, 88%)",
        minWidth: 80,
        maxWidth: 160,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary !w-1.5 !h-1.5 !border-0" />
      <span className="leading-tight">{data.label}</span>
      <Handle type="source" position={Position.Right} className="!bg-primary !w-1.5 !h-1.5 !border-0" />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function buildFlowGraph(rootNode: MindmapNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let id = 0;
  const columnNodes: Map<number, string[]> = new Map();

  function traverse(node: MindmapNode, parentId: string | null, depth: number, yOffset: number, parentColor?: string): number {
    const currentId = `node-${id++}`;
    const color = node.color || parentColor;

    if (!columnNodes.has(depth)) columnNodes.set(depth, []);
    columnNodes.get(depth)!.push(currentId);

    nodes.push({
      id: currentId,
      type: "custom",
      position: { x: depth * 220, y: yOffset },
      data: {
        label: node.name,
        color: depth <= 1 ? color : undefined,
        isRoot: depth === 0,
        depth,
      },
    });

    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        style: { stroke: color || "hsl(168, 70%, 45%)", strokeWidth: 1.5, opacity: 0.5 },
        type: "smoothstep",
      });
    }

    if (!node.children || node.children.length === 0) return yOffset + 50;

    let currentY = yOffset;
    for (const child of node.children) {
      currentY = traverse(child, currentId, depth + 1, currentY, color);
    }

    const centerY = (yOffset + currentY - 50) / 2;
    const n = nodes.find((n) => n.id === currentId);
    if (n) n.position.y = centerY;

    return currentY;
  }

  traverse(rootNode, null, 0, 0);

  return { nodes, edges, maxDepth: Math.max(...Array.from(columnNodes.keys())) };
}

export default function MindmapView({ data }: MindmapViewProps) {
  const { nodes: initialNodes, edges: initialEdges, maxDepth } = useMemo(
    () => buildFlowGraph(data.data),
    [data]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [currentCol, setCurrentCol] = useState(0);
  const flowRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!flowRef.current) return;
    try {
      const dataUrl = await toPng(flowRef.current, {
        backgroundColor: "hsl(220, 20%, 7%)",
        quality: 1,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${data.role}-mindmap.png`;
      a.click();
    } catch (err) {
      console.error("Download failed", err);
    }
  }, [data.role]);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {data.role} — Mindmap
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentCol(Math.max(0, currentCol - 1))}
            disabled={currentCol === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Col {currentCol + 1}/{maxDepth + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentCol(Math.min(maxDepth, currentCol + 1))}
            disabled={currentCol >= maxDepth}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      <div
        ref={flowRef}
        className="h-[600px] w-full rounded-xl border border-border overflow-hidden"
        style={{ background: "hsl(220, 20%, 7%)" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.3,
            minZoom: 0.1,
            maxZoom: 2,
          }}
          defaultViewport={{ x: currentCol * -220 + 50, y: 0, zoom: 0.7 }}
          minZoom={0.05}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
        >
          <Controls className="!bg-card !border-border !rounded-lg [&>button]:!bg-secondary [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent" />
          <Background color="hsl(220, 14%, 15%)" variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
