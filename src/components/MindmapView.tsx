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
  getNodesBounds,
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
    side?: "left" | "right";
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
        position={data.side === "left" ? Position.Right : Position.Left}
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
        position={data.side === "left" ? Position.Left : Position.Right}
        className="!w-0 !h-0 !border-0 !bg-transparent !min-w-0 !min-h-0"
      />
      {data.isRoot && (
        <>
          <Handle
            type="source"
            id="source-left"
            position={Position.Left}
            className="!w-0 !h-0 !border-0 !bg-transparent !min-w-0 !min-h-0"
          />
          <Handle
            type="source"
            id="source-right"
            position={Position.Right}
            className="!w-0 !h-0 !border-0 !bg-transparent !min-w-0 !min-h-0"
          />
        </>
      )}
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
const X_SPACING = 240;

/**
 * Pre-compute the vertical space a subtree requires.
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
    inheritedColor?: string,
    side: "left" | "right" = "right"
  ): void {
    const currentId = pathStr;
    const ownColor = node.color;
    const branchColor = getBranchColor(pathIndices);
    const effectiveColor = ownColor || inheritedColor || branchColor;
    if (depth > maxDepth) maxDepth = depth;

    const isCollapsed = collapsedPaths.has(pathStr);
    const childCount = node.children?.length || 0;

    const myHeight = subtreeHeight(node, pathStr, collapsedPaths);
    const centerY = yOffset + myHeight / 2 - NODE_HEIGHT / 2;

    // For left side, X goes negative; for right side, X goes positive
    const xPos = depth === 0 ? 0 : side === "right" ? depth * X_SPACING : -(depth * X_SPACING);

    nodes.push({
      id: currentId,
      type: "custom",
      position: { x: xPos, y: centerY },
      data: {
        label: node.name,
        color: depth === 0 ? undefined : effectiveColor,
        isRoot: depth === 0,
        depth,
        childCount,
        collapsed: isCollapsed,
        onToggle: childCount > 0 ? () => onToggle(pathStr) : undefined,
        side,
      },
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        sourceHandle: depth === 1 ? (side === "left" ? "source-left" : "source-right") : undefined,
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
        effectiveColor,
        side
      );
      childY +=
        subtreeHeight(child, childPath, collapsedPaths) + NODE_GAP;
    }
  }

  // Split root children into right and left halves
  const rootChildren = rootNode.children || [];
  const half = Math.ceil(rootChildren.length / 2);
  const rightChildren = rootChildren.slice(0, half);
  const leftChildren = rootChildren.slice(half);

  // Compute yOffsets for right side
  let rightTotalH = 0;
  for (let i = 0; i < rightChildren.length; i++) {
    if (i > 0) rightTotalH += NODE_GAP;
    rightTotalH += subtreeHeight(rightChildren[i], `root-${i}`, collapsedPaths);
  }

  // Compute yOffsets for left side
  let leftTotalH = 0;
  for (let i = 0; i < leftChildren.length; i++) {
    if (i > 0) leftTotalH += NODE_GAP;
    leftTotalH += subtreeHeight(leftChildren[i], `root-${half + i}`, collapsedPaths);
  }

  // Center root vertically between the two sides
  const maxTotalH = Math.max(rightTotalH, leftTotalH, NODE_HEIGHT);
  const rootY = maxTotalH / 2 - NODE_HEIGHT / 2;

  // Place root node
  nodes.push({
    id: "root",
    type: "custom",
    position: { x: 0, y: rootY },
    data: {
      label: rootNode.name,
      isRoot: true,
      depth: 0,
      childCount: rootChildren.length,
      collapsed: false,
      onToggle: rootChildren.length > 0 ? () => onToggle("root") : undefined,
      side: "right" as const,
    },
  });

  // Traverse right children
  const rightStartY = maxTotalH / 2 - rightTotalH / 2;
  let childY = rightStartY;
  for (let i = 0; i < rightChildren.length; i++) {
    const childPath = `root-${i}`;
    traverse(
      rightChildren[i],
      "root",
      1,
      childY,
      childPath,
      [i],
      undefined,
      "right"
    );
    childY += subtreeHeight(rightChildren[i], childPath, collapsedPaths) + NODE_GAP;
  }

  // Traverse left children
  const leftStartY = maxTotalH / 2 - leftTotalH / 2;
  childY = leftStartY;
  for (let i = 0; i < leftChildren.length; i++) {
    const originalIdx = half + i;
    const childPath = `root-${originalIdx}`;
    traverse(
      leftChildren[i],
      "root",
      1,
      childY,
      childPath,
      [originalIdx],
      undefined,
      "left"
    );
    childY += subtreeHeight(leftChildren[i], childPath, collapsedPaths) + NODE_GAP;
  }

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

  // Download as PNG — captures the actual React Flow DOM for pixel-perfect output
  const handleDownload = useCallback(async () => {
    const flowEl = flowRef.current?.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!flowEl || nodes.length === 0) return;

    // Get the bounding box of all nodes from React Flow
    const nodeBounds = getNodesBounds(nodes);
    const PADDING = 80;
    const TITLE_H = 60;

    // Measure actual rendered node sizes from the DOM
    const nodeEls = flowRef.current?.querySelectorAll(".react-flow__node");
    let realMaxX = nodeBounds.x + nodeBounds.width;
    let realMaxY = nodeBounds.y + nodeBounds.height;
    let realMinX = nodeBounds.x;
    let realMinY = nodeBounds.y;
    if (nodeEls) {
      for (const el of nodeEls) {
        const htmlEl = el as HTMLElement;
        const x = parseFloat(htmlEl.style.left || htmlEl.getAttribute("data-x") || "0") ||
          (htmlEl.getBoundingClientRect().x - flowEl.getBoundingClientRect().x);
        const y = parseFloat(htmlEl.style.top || htmlEl.getAttribute("data-y") || "0") ||
          (htmlEl.getBoundingClientRect().y - flowEl.getBoundingClientRect().y);
        // Use transform to get actual position
        const transform = htmlEl.style.transform;
        const match = transform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          const tx = parseFloat(match[1]);
          const ty = parseFloat(match[2]);
          const w = htmlEl.offsetWidth;
          const h = htmlEl.offsetHeight;
          if (tx < realMinX) realMinX = tx;
          if (ty < realMinY) realMinY = ty;
          if (tx + w > realMaxX) realMaxX = tx + w;
          if (ty + h > realMaxY) realMaxY = ty + h;
        }
      }
    }

    const contentW = realMaxX - realMinX;
    const contentH = realMaxY - realMinY;
    const imgW = contentW + PADDING * 2;
    const imgH = contentH + PADDING * 2 + TITLE_H;
    const SCALE = 2;

    // Create a canvas
    const canvas = document.createElement("canvas");
    canvas.width = imgW * SCALE;
    canvas.height = imgH * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(SCALE, SCALE);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, imgW, imgH);

    // Title
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 24px 'DM Sans', 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(data.role, imgW / 2, TITLE_H / 2 + PADDING / 4);

    const offsetX = -realMinX + PADDING;
    const offsetY = -realMinY + PADDING + TITLE_H;

    // Helper functions
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

    // Measure each node's actual rendered width by using canvas text measurement
    // and store positions + dimensions
    const nodeRects: Record<string, { x: number; y: number; w: number; h: number; side: string }> = {};
    for (const n of nodes) {
      const nd = n.data as Record<string, unknown>;
      const isRoot = nd.isRoot as boolean;
      const depth = (nd.depth as number) || 0;
      const label = nd.label as string;
      const side = (nd.side as string) || "right";
      const fontSize = isRoot ? 16 : depth === 1 ? 14 : 13;
      const fontWeight = isRoot ? "bold" : depth === 1 ? "600" : "500";
      ctx.font = `${fontWeight} ${fontSize}px 'DM Sans', 'Inter', system-ui, sans-serif`;
      const textW = ctx.measureText(label).width;
      const padX = isRoot ? 40 : 28;
      const padY = isRoot ? 20 : 14;
      const nodeW = Math.max(textW + padX, isRoot ? 140 : 80);
      const nodeH = fontSize + padY;

      // For left-side nodes, align right edge to position.x + some offset
      // (react-flow positions are top-left of node)
      const x = n.position.x + offsetX;
      const y = n.position.y + offsetY;
      nodeRects[n.id] = { x, y, w: nodeW, h: nodeH, side };
    }

    // Draw edges using sharp right-angle step paths
    for (const e of edges) {
      const src = nodeRects[e.source];
      const tgt = nodeRects[e.target];
      if (!src || !tgt) continue;

      const tgtSide = tgt.side;

      let x1: number, y1: number, x2: number, y2: number;

      if (tgtSide === "left") {
        x1 = src.x;
        y1 = src.y + src.h / 2;
        x2 = tgt.x + tgt.w;
        y2 = tgt.y + tgt.h / 2;
      } else {
        x1 = src.x + src.w;
        y1 = src.y + src.h / 2;
        x2 = tgt.x;
        y2 = tgt.y + tgt.h / 2;
      }

      const edgeStyle = e.style as Record<string, unknown> | undefined;
      ctx.strokeStyle = (edgeStyle?.stroke as string) || "#a5b4fc";
      ctx.lineWidth = (edgeStyle?.strokeWidth as number) || 1.5;
      ctx.globalAlpha = (edgeStyle?.opacity as number) || 0.6;

      const midX = (x1 + x2) / 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);

      if (Math.abs(y2 - y1) < 1) {
        ctx.lineTo(x2, y2);
      } else {
        // Sharp right-angle: horizontal to midX, vertical to target Y, horizontal to target
        ctx.lineTo(midX, y1);
        ctx.lineTo(midX, y2);
        ctx.lineTo(x2, y2);
      }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw nodes
    for (const n of nodes) {
      const nd = n.data as Record<string, unknown>;
      const isRoot = nd.isRoot as boolean;
      const color = nd.color as string | undefined;
      const depth = (nd.depth as number) || 0;
      const label = nd.label as string;
      const rect = nodeRects[n.id];
      const { x, y, w: nodeW, h: nodeH } = rect;

      // Compute background color (matching the CustomNode logic)
      let bg = "#f8fafc";
      let txtCol = "#1e293b";
      let borderCol = "#e2e8f0";
      if (isRoot) {
        bg = "#4338ca";
        txtCol = "#ffffff";
        borderCol = "#3730a3";
      } else if (color) {
        const tintFactor = depth <= 1 ? 0 : depth === 2 ? 0.25 : depth === 3 ? 0.45 : 0.6;
        if (tintFactor === 0) {
          bg = color;
        } else {
          const { r, g, b } = parseColor(color);
          bg = `rgb(${Math.round(r + (255 - r) * tintFactor)}, ${Math.round(g + (255 - g) * tintFactor)}, ${Math.round(b + (255 - b) * tintFactor)})`;
        }
        txtCol = luminance(bg) > 160 ? "#1e293b" : "#ffffff";
        borderCol = color;
      }

      // Rounded rect
      const r = 10;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + nodeW - r, y);
      ctx.arcTo(x + nodeW, y, x + nodeW, y + r, r);
      ctx.lineTo(x + nodeW, y + nodeH - r);
      ctx.arcTo(x + nodeW, y + nodeH, x + nodeW - r, y + nodeH, r);
      ctx.lineTo(x + r, y + nodeH);
      ctx.arcTo(x, y + nodeH, x, y + nodeH - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();

      // Shadow for root
      if (isRoot) {
        ctx.save();
        ctx.shadowColor = "rgba(67, 56, 202, 0.3)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = bg;
        ctx.fill();
      }

      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      const fontSize = isRoot ? 16 : depth === 1 ? 14 : 13;
      const fontWeight = isRoot ? "bold" : depth === 1 ? "600" : "500";
      ctx.font = `${fontWeight} ${fontSize}px 'DM Sans', 'Inter', system-ui, sans-serif`;
      ctx.fillStyle = txtCol;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + nodeW / 2, y + nodeH / 2);

      // Collapsed badge
      const collapsed = nd.collapsed as boolean;
      const childCount = nd.childCount as number;
      if (collapsed && childCount > 0) {
        const badgeText = `${childCount}`;
        ctx.font = "bold 10px 'DM Sans', 'Inter', system-ui, sans-serif";
        const badgeW = Math.max(ctx.measureText(badgeText).width + 10, 18);
        const badgeH = 16;
        const badgeX = x + nodeW / 2 + ctx.measureText(label).width / 2 + 6;
        // Use the main font to measure label width
        ctx.font = `${fontWeight} ${fontSize}px 'DM Sans', 'Inter', system-ui, sans-serif`;
        const labelW = ctx.measureText(label).width;
        const bx = x + nodeW / 2 + labelW / 2 + 6;
        const by = y + nodeH / 2 - badgeH / 2;

        ctx.beginPath();
        const br = badgeH / 2;
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + badgeW - br, by);
        ctx.arcTo(bx + badgeW, by, bx + badgeW, by + br, br);
        ctx.lineTo(bx + badgeW, by + badgeH - br);
        ctx.arcTo(bx + badgeW, by + badgeH, bx + badgeW - br, by + badgeH, br);
        ctx.lineTo(bx + br, by + badgeH);
        ctx.arcTo(bx, by + badgeH, bx, by + badgeH - br, br);
        ctx.lineTo(bx, by + br);
        ctx.arcTo(bx, by, bx + br, by, br);
        ctx.closePath();
        ctx.fillStyle = color || "#6366f1";
        ctx.fill();

        ctx.font = "bold 10px 'DM Sans', 'Inter', system-ui, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, bx + badgeW / 2, by + badgeH / 2);
      }
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
