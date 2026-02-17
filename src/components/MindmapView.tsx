import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MindmapData, MindmapNode } from "@/types/roadmap";
import { Button } from "@/components/ui/button";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Expand,
} from "lucide-react";

interface MindmapViewProps {
  data: MindmapData;
}

/* ─── Custom Node ───────────────────────────────────────────────── */
function CustomNode({
  data,
}: {
  data: {
    label: string;
    color?: string;
    isRoot?: boolean;
    depth?: number;
    childCount?: number;
    collapsed?: boolean;
    onToggle?: () => void;
  };
}) {
  const isRoot = data.isRoot;
  const depth = data.depth ?? 0;
  const branchColor = data.color;

  // Color logic: root = purple, depth-1 = full branch color,
  // depth-2+ = progressively lighter tints of the branch color
  function hexToRgb(hex: string) {
    const c = hex.replace("#", "");
    return {
      r: parseInt(c.substring(0, 2), 16),
      g: parseInt(c.substring(2, 4), 16),
      b: parseInt(c.substring(4, 6), 16),
    };
  }
  function tintColor(hex: string, factor: number) {
    const { r, g, b } = hexToRgb(hex);
    const tr = Math.round(r + (255 - r) * factor);
    const tg = Math.round(g + (255 - g) * factor);
    const tb = Math.round(b + (255 - b) * factor);
    return `rgb(${tr}, ${tg}, ${tb})`;
  }

  let bgColor: string;
  let textColor: string;
  let borderColor: string;

  if (isRoot) {
    bgColor = "#4338ca";
    textColor = "#ffffff";
    borderColor = "#3730a3";
  } else if (branchColor) {
    // depth 1 → full color, depth 2 → 25% lighter, depth 3 → 45%, depth 4+ → 60%
    const tintFactor = depth <= 1 ? 0 : depth === 2 ? 0.25 : depth === 3 ? 0.45 : 0.6;
    bgColor = tintFactor === 0 ? branchColor : tintColor(branchColor, tintFactor);
    // Dark text on very light backgrounds, white on saturated ones
    textColor = tintFactor >= 0.45 ? "#1e293b" : "#ffffff";
    borderColor = branchColor;
  } else {
    bgColor = "#f8fafc";
    textColor = "#1e293b";
    borderColor = "#e2e8f0";
  }

  const fontSize = isRoot ? 16 : depth === 1 ? 14 : 13;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onToggle?.();
      }}
      className="cursor-pointer transition-shadow hover:shadow-lg"
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        padding: isRoot ? "10px 20px" : "7px 14px",
        minWidth: isRoot ? 140 : 80,
        maxWidth: 220,
        textAlign: "center",
        boxShadow: isRoot
          ? "0 4px 14px rgba(67, 56, 202, 0.3)"
          : "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-0 !h-0 !border-0 !bg-transparent !min-w-0 !min-h-0"
      />
      <div className="flex items-center justify-center gap-1.5">
        <span
          style={{
            color: textColor,
            fontSize,
            fontWeight: isRoot ? 700 : data.depth === 1 ? 600 : 500,
            lineHeight: 1.3,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {data.label}
        </span>
        {data.collapsed && data.childCount && data.childCount > 0 && (
          <span
            style={{
              background: branchColor || "#6366f1",
              color: "#fff",
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 6px",
              minWidth: 18,
              textAlign: "center",
              lineHeight: "16px",
            }}
          >
            {data.childCount}
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-0 !h-0 !border-0 !bg-transparent !min-w-0 !min-h-0"
      />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

/* ─── Graph Builder ─────────────────────────────────────────────── */
interface BuildState {
  nodes: Node[];
  edges: Edge[];
  maxDepth: number;
}

const NODE_HEIGHT = 44;
const NODE_GAP = 12;

/**
 * Pre-compute the vertical space a subtree requires.
 * A leaf (or collapsed node) takes NODE_HEIGHT.
 * An expanded parent takes the sum of its children's heights
 * plus gaps between them.
 */
function subtreeHeight(
  node: MindmapNode,
  pathStr: string,
  collapsedPaths: Set<string>
): number {
  const isCollapsed = collapsedPaths.has(pathStr);
  if (!node.children || node.children.length === 0 || isCollapsed) {
    return NODE_HEIGHT;
  }
  let total = 0;
  for (let i = 0; i < node.children.length; i++) {
    if (i > 0) total += NODE_GAP;
    total += subtreeHeight(
      node.children[i],
      `${pathStr}-${i}`,
      collapsedPaths
    );
  }
  return total;
}

function buildFlowGraph(
  rootNode: MindmapNode,
  collapsedPaths: Set<string>,
  onToggle: (path: string) => void
): BuildState {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let maxDepth = 0;

  /**
   * Walk up the pathIndices to find the depth-1 ancestor's color.
   * This is the "branch color" that tints the entire branch.
   */
  function getBranchColor(pathIndices: number[]): string | undefined {
    if (pathIndices.length === 0) return undefined;
    const firstIdx = pathIndices[0];
    if (rootNode.children && rootNode.children[firstIdx]) {
      return rootNode.children[firstIdx].color;
    }
    return undefined;
  }

  function traverse(
    node: MindmapNode,
    parentId: string | null,
    depth: number,
    yOffset: number,
    pathStr: string,
    pathIndices: number[],
    inheritedColor?: string
  ): void {
    const currentId = pathStr;
    // Priority: node's own color from backend > inherited from parent > branch ancestor
    const ownColor = node.color;
    const branchColor = getBranchColor(pathIndices);
    const effectiveColor = ownColor || inheritedColor || branchColor;
    if (depth > maxDepth) maxDepth = depth;

    const isCollapsed = collapsedPaths.has(pathStr);
    const childCount = node.children?.length || 0;

    // Compute center Y for this node based on its subtree height
    const myHeight = subtreeHeight(node, pathStr, collapsedPaths);
    const centerY = yOffset + myHeight / 2 - NODE_HEIGHT / 2;

    nodes.push({
      id: currentId,
      type: "custom",
      position: { x: depth * 240, y: centerY },
      data: {
        label: node.name,
        color: depth === 0 ? undefined : effectiveColor,
        isRoot: depth === 0,
        depth,
        childCount,
        collapsed: isCollapsed,
        onToggle: childCount > 0 ? () => onToggle(pathStr) : undefined,
      },
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        style: {
          stroke: effectiveColor || "#a5b4fc",
          strokeWidth: depth <= 2 ? 2.5 : 1.5,
          opacity: 0.6,
        },
        type: "smoothstep",
      });
    }

    if (!node.children || node.children.length === 0 || isCollapsed) {
      return;
    }

    let childY = yOffset;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childPath = `${pathStr}-${i}`;
      traverse(
        child,
        currentId,
        depth + 1,
        childY,
        childPath,
        [...pathIndices, i],
        effectiveColor
      );
      childY +=
        subtreeHeight(child, childPath, collapsedPaths) + NODE_GAP;
    }
  }

  traverse(rootNode, null, 0, 0, "root", []);
  return { nodes, edges, maxDepth };
}

/* ─── Inner component (needs ReactFlowProvider) ─────────────────── */
function MindmapInner({ data }: MindmapViewProps) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => {
    // Start with depth-1 nodes expanded, rest collapsed
    const collapsed = new Set<string>();
    function collapseBelow(node: MindmapNode, path: string, depth: number) {
      if (depth >= 2 && node.children && node.children.length > 0) {
        collapsed.add(path);
      }
      node.children?.forEach((child, i) => {
        collapseBelow(child, `${path}-${i}`, depth + 1);
      });
    }
    collapseBelow(data.data, "root", 0);
    return collapsed;
  });

  const [currentLevel, setCurrentLevel] = useState(1);
  const flowRef = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const toggleNode = useCallback(
    (path: string) => {
      setCollapsedPaths((prev) => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    },
    []
  );

  const { nodes: flowNodes, edges: flowEdges, maxDepth } = useMemo(
    () => buildFlowGraph(data.data, collapsedPaths, toggleNode),
    [data.data, collapsedPaths, toggleNode]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync when flowNodes/flowEdges change
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
    // Fit view after a small delay to let nodes render
    setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
  }, [flowNodes, flowEdges, setNodes, setEdges, fitView]);

  // Expand next level
  const expandNextLevel = useCallback(() => {
    const targetLevel = currentLevel + 1;
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      function walk(node: MindmapNode, path: string, depth: number) {
        if (depth === targetLevel - 1) {
          // Uncollapse nodes at this level
          next.delete(path);
        }
        node.children?.forEach((child, i) => {
          walk(child, `${path}-${i}`, depth + 1);
        });
      }
      walk(data.data, "root", 0);
      return next;
    });
    setCurrentLevel(targetLevel);
  }, [currentLevel, data.data]);

  // Collapse previous level
  const collapsePrevLevel = useCallback(() => {
    if (currentLevel <= 1) return;
    const targetLevel = currentLevel - 1;
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      function walk(node: MindmapNode, path: string, depth: number) {
        if (depth >= targetLevel && node.children && node.children.length > 0) {
          next.add(path);
        }
        node.children?.forEach((child, i) => {
          walk(child, `${path}-${i}`, depth + 1);
        });
      }
      walk(data.data, "root", 0);
      return next;
    });
    setCurrentLevel(targetLevel);
  }, [currentLevel, data.data]);

  // Expand all
  const expandAll = useCallback(() => {
    setCollapsedPaths(new Set());
    setCurrentLevel(maxDepth + 1);
  }, [maxDepth]);

  // Reset
  const resetView = useCallback(() => {
    const collapsed = new Set<string>();
    function collapseBelow(node: MindmapNode, path: string, depth: number) {
      if (depth >= 2 && node.children && node.children.length > 0) {
        collapsed.add(path);
      }
      node.children?.forEach((child, i) => {
        collapseBelow(child, `${path}-${i}`, depth + 1);
      });
    }
    collapseBelow(data.data, "root", 0);
    setCollapsedPaths(collapsed);
    setCurrentLevel(1);
    setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 50);
  }, [data.data, fitView]);

  // Download as PNG — draws directly onto a Canvas for reliability
  const handleDownload = useCallback(() => {
    if (nodes.length === 0) return;

    const SCALE = 2; // retina quality
    const PADDING = 80;
    const NODE_W = 180;
    const NODE_H = 36;

    // Compute bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      const x = n.position.x;
      const y = n.position.y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + NODE_W > maxX) maxX = x + NODE_W;
      if (y + NODE_H > maxY) maxY = y + NODE_H;
    }

    // Title height
    const TITLE_H = 60;
    const canvasW = (maxX - minX + PADDING * 2);
    const canvasH = (maxY - minY + PADDING * 2 + TITLE_H);

    const canvas = document.createElement("canvas");
    canvas.width = canvasW * SCALE;
    canvas.height = canvasH * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(SCALE, SCALE);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Title
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 24px 'DM Sans', 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.role, canvasW / 2, PADDING / 2 + 12);

    const offsetX = -minX + PADDING;
    const offsetY = -minY + PADDING + TITLE_H;

    // Build node position lookup for edges
    const nodePos: Record<string, { x: number; y: number }> = {};
    for (const n of nodes) {
      nodePos[n.id] = { x: n.position.x + offsetX, y: n.position.y + offsetY };
    }

    // Draw edges (smoothstep-like: horizontal from source, then vertical, then horizontal to target)
    for (const e of edges) {
      const src = nodePos[e.source];
      const tgt = nodePos[e.target];
      if (!src || !tgt) continue;

      const x1 = src.x + NODE_W;
      const y1 = src.y + NODE_H / 2;
      const x2 = tgt.x;
      const y2 = tgt.y + NODE_H / 2;
      const midX = (x1 + x2) / 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(midX, y1, midX, y2, x2, y2);
      const edgeStyle = e.style as Record<string, unknown> | undefined;
      ctx.strokeStyle = (edgeStyle?.stroke as string) || "#a5b4fc";
      ctx.lineWidth = (edgeStyle?.strokeWidth as number) || 1.5;
      ctx.globalAlpha = (edgeStyle?.opacity as number) || 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Helper: parse color that may be hex or rgb(...)
    function parseColor(c: string): { r: number; g: number; b: number } {
      if (c.startsWith("rgb")) {
        const m = c.match(/\d+/g);
        return m ? { r: +m[0], g: +m[1], b: +m[2] } : { r: 248, g: 250, b: 252 };
      }
      const hex = c.replace("#", "");
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
    function luminance(c: string) {
      const { r, g, b } = parseColor(c);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Draw nodes
    for (const n of nodes) {
      const nd = n.data as Record<string, unknown>;
      const x = n.position.x + offsetX;
      const y = n.position.y + offsetY;
      const isRoot = nd.isRoot as boolean;
      const color = nd.color as string | undefined;
      const depth = (nd.depth as number) || 0;
      const label = nd.label as string;

      // Compute background color (matching the CustomNode logic)
      let bg = "#f8fafc";
      let txtCol = "#1e293b";
      if (isRoot) {
        bg = "#4338ca";
        txtCol = "#ffffff";
      } else if (color) {
        // Apply depth-based tinting
        const tintFactor = depth <= 1 ? 0 : depth === 2 ? 0.25 : depth === 3 ? 0.45 : 0.6;
        if (tintFactor === 0) {
          bg = color;
        } else {
          const { r, g, b } = parseColor(color);
          bg = `rgb(${Math.round(r + (255 - r) * tintFactor)}, ${Math.round(g + (255 - g) * tintFactor)}, ${Math.round(b + (255 - b) * tintFactor)})`;
        }
        txtCol = luminance(bg) > 160 ? "#1e293b" : "#ffffff";
      }

      // Measure text to compute node width
      ctx.font = `${isRoot ? "bold" : depth === 1 ? "600" : "500"} ${isRoot ? 14 : 12}px 'DM Sans', 'Inter', sans-serif`;
      const textW = ctx.measureText(label).width;
      const nodeW = Math.max(textW + 24, 80);

      // Rounded rect
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + nodeW - r, y);
      ctx.arcTo(x + nodeW, y, x + nodeW, y + r, r);
      ctx.lineTo(x + nodeW, y + NODE_H - r);
      ctx.arcTo(x + nodeW, y + NODE_H, x + nodeW - r, y + NODE_H, r);
      ctx.lineTo(x + r, y + NODE_H);
      ctx.arcTo(x, y + NODE_H, x, y + NODE_H - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = isRoot ? "#3730a3" : color || "#e2e8f0";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text
      ctx.fillStyle = txtCol;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + nodeW / 2, y + NODE_H / 2 + 1);
    }

    // Trigger download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.role.toLowerCase().replace(/\s+/g, "-")}-mindmap.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [data.role, nodes, edges]);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {data.role} — Mindmap
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Level navigation */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={collapsePrevLevel}
              disabled={currentLevel <= 1}
              title="Collapse level"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
              Level {currentLevel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={expandNextLevel}
              disabled={currentLevel > maxDepth}
              title="Expand level"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => zoomIn({ duration: 200 })}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => zoomOut({ duration: 200 })}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fitView({ padding: 0.15, duration: 300 })}
              title="Fit view"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={resetView}
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Expand all */}
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="gap-1.5 h-8 text-xs"
          >
            <Expand className="h-3.5 w-3.5" />
            Expand All
          </Button>

          {/* Download */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-1.5 h-8 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download PNG
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={flowRef}
        className="h-[650px] w-full rounded-xl border border-border overflow-hidden"
        style={{ background: "#ffffff" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15, minZoom: 0.05, maxZoom: 2 }}
          minZoom={0.02}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          style={{ background: "#ffffff" }}
        >
          <Controls
            showInteractive={false}
            className="!bg-white !border-gray-200 !rounded-lg !shadow-md [&>button]:!bg-white [&>button]:!border-gray-200 [&>button]:!text-gray-600 [&>button:hover]:!bg-gray-50"
          />
        </ReactFlow>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Click on any node to expand or collapse its children. Use the level controls to navigate depth-by-depth.
      </p>
    </div>
  );
}

/* ─── Wrapper with ReactFlowProvider ────────────────────────────── */
export default function MindmapView(props: MindmapViewProps) {
  return (
    <ReactFlowProvider>
      <MindmapInner {...props} />
    </ReactFlowProvider>
  );
}
