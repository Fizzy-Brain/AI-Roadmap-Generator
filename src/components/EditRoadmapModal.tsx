import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  GripVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { MindmapNode } from "@/types/roadmap";

interface TreeNode extends MindmapNode {
  id: string;
  children?: TreeNode[];
}

interface EditRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mindMapData: MindmapNode | null;
  isLoading: boolean;
  role: string;
  onSave: (updatedData: MindmapNode) => Promise<void>;
}

interface FlattenedNode {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  children: string[];
  path: number[];
}

export default function EditRoadmapModal({
  isOpen,
  onClose,
  mindMapData,
  isLoading,
  role,
  onSave,
}: EditRoadmapModalProps) {
  const { toast } = useToast();
  const [editedData, setEditedData] = useState<TreeNode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [flattenedNodes, setFlattenedNodes] = useState<
    Record<string, FlattenedNode>
  >({});
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDragNode, setActiveDragNode] = useState<FlattenedNode | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Deep clone and add IDs
  useEffect(() => {
    if (mindMapData) {
      const dataWithIds = JSON.parse(JSON.stringify(mindMapData)) as TreeNode;
      ensureNodeIds(dataWithIds);
      setEditedData(dataWithIds);
      const initial = new Set<string>();
      if (dataWithIds.id) initial.add(dataWithIds.id);
      setExpandedNodes(initial);
    }
  }, [mindMapData]);

  useEffect(() => {
    if (!isOpen && mindMapData) {
      const dataWithIds = JSON.parse(JSON.stringify(mindMapData)) as TreeNode;
      ensureNodeIds(dataWithIds);
      setEditedData(dataWithIds);
    }
  }, [isOpen, mindMapData]);

  useEffect(() => {
    if (editedData) {
      const flattened: Record<string, FlattenedNode> = {};
      flattenTree(editedData, flattened, null, [], 0);
      setFlattenedNodes(flattened);
    }
  }, [editedData]);

  const flattenTree = (
    node: TreeNode,
    result: Record<string, FlattenedNode>,
    parentId: string | null,
    path: number[],
    level: number
  ) => {
    if (!node.id) return;
    result[node.id] = {
      id: node.id,
      name: node.name,
      parentId,
      level,
      children: (node.children || []).map((child) => child.id),
      path,
    };
    if (node.children) {
      node.children.forEach((child, index) => {
        flattenTree(child, result, node.id, [...path, index], level + 1);
      });
    }
  };

  const ensureNodeIds = (node: TreeNode, prefix: string = "") => {
    if (!node.id) {
      node.id = prefix + "_" + Math.random().toString(36).substr(2, 9);
    }
    if (node.children) {
      node.children.forEach((child, index) => {
        ensureNodeIds(child as TreeNode, node.id + "_" + index);
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    const dragNode = flattenedNodes[event.active.id as string];
    if (dragNode) setActiveDragNode(dragNode);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDragNode(null);
    if (!over || active.id === over.id) return;

    const activeNode = flattenedNodes[active.id as string];
    const overNode = flattenedNodes[over.id as string];
    if (!activeNode || !overNode) return;
    if (isDescendant(activeNode.id, overNode.id)) return;

    const newData = JSON.parse(JSON.stringify(editedData)) as TreeNode;

    if (activeNode.parentId === overNode.parentId) {
      if (reorderWithinParent(newData, activeNode.id, overNode.id)) {
        setEditedData(newData);
      }
    } else {
      const removedNode = removeNodeById(newData, activeNode.id);
      if (!removedNode) return;
      if (addNodeAsSibling(newData, overNode.id, removedNode)) {
        setEditedData(newData);
      }
    }
  };

  const isDescendant = (nodeAId: string, nodeBId: string): boolean => {
    let current = flattenedNodes[nodeBId];
    while (current && current.parentId) {
      if (current.parentId === nodeAId) return true;
      current = flattenedNodes[current.parentId];
    }
    return false;
  };

  const findNodeById = (root: TreeNode | null, id: string): TreeNode | null => {
    if (!root) return null;
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findNodeById(child as TreeNode, id);
        if (found) return found;
      }
    }
    return null;
  };

  const removeNodeById = (root: TreeNode, id: string): TreeNode | null => {
    if (!root.children) return null;
    const index = root.children.findIndex((child) => child.id === id);
    if (index !== -1) {
      const [removed] = root.children.splice(index, 1);
      if (root.children.length === 0) delete root.children;
      return removed as TreeNode;
    }
    for (const child of root.children) {
      const removed = removeNodeById(child as TreeNode, id);
      if (removed) return removed;
    }
    return null;
  };

  const addNodeAsSibling = (
    root: TreeNode,
    siblingId: string,
    node: TreeNode
  ): boolean => {
    if (root.id === siblingId) {
      if (!root.children) root.children = [];
      root.children.push(node);
      return true;
    }
    const siblingNode = flattenedNodes[siblingId];
    if (!siblingNode || !siblingNode.parentId) return false;
    const parent = findNodeById(root, siblingNode.parentId);
    if (!parent || !parent.children) return false;
    const siblingIndex = parent.children.findIndex(
      (child) => child.id === siblingId
    );
    if (siblingIndex === -1) return false;
    parent.children.splice(siblingIndex + 1, 0, node);
    return true;
  };

  const reorderWithinParent = (
    root: TreeNode,
    activeIdVal: string,
    overIdVal: string
  ): boolean => {
    const activeNode = flattenedNodes[activeIdVal];
    const overNode = flattenedNodes[overIdVal];
    if (
      !activeNode ||
      !overNode ||
      activeNode.parentId !== overNode.parentId
    )
      return false;

    const parentId = activeNode.parentId;
    let parent: TreeNode;
    if (!parentId || root.id === parentId) {
      parent = root;
    } else {
      const found = findNodeById(root, parentId);
      if (!found) return false;
      parent = found;
    }
    if (!parent.children) return false;

    const activeIndex = parent.children.findIndex(
      (child) => child.id === activeIdVal
    );
    const overIndex = parent.children.findIndex(
      (child) => child.id === overIdVal
    );
    if (activeIndex === -1 || overIndex === -1) return false;

    const [movedItem] = parent.children.splice(activeIndex, 1);
    parent.children.splice(overIndex, 0, movedItem);
    return true;
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
      return newSet;
    });
  };

  const addNode = useCallback(
    (parentId: string, newNodeName: string) => {
      if (!editedData) return;
      const newData = JSON.parse(JSON.stringify(editedData)) as TreeNode;
      const parent =
        parentId === newData.id
          ? newData
          : findNodeById(newData, parentId);
      if (!parent) return;
      if (!parent.children) parent.children = [];
      const newNode: TreeNode = {
        name: newNodeName,
        id: parentId + "_" + Math.random().toString(36).substr(2, 9),
      };
      parent.children.push(newNode);
      setEditedData(newData);
      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        newSet.add(parentId);
        return newSet;
      });
    },
    [editedData]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (!editedData || nodeId === editedData.id) return;
      const newData = JSON.parse(JSON.stringify(editedData)) as TreeNode;
      removeNodeById(newData, nodeId);
      setEditedData(newData);
    },
    [editedData]
  );

  const updateNodeName = useCallback(
    (nodeId: string, newName: string) => {
      if (!editedData) return;
      const newData = JSON.parse(JSON.stringify(editedData)) as TreeNode;
      if (nodeId === newData.id) {
        newData.name = newName;
        setEditedData(newData);
        return;
      }
      const node = findNodeById(newData, nodeId);
      if (node) {
        node.name = newName;
        setEditedData(newData);
      }
    },
    [editedData]
  );

  const handleSave = async () => {
    if (!editedData) return;
    setIsSaving(true);
    try {
      // Strip IDs before saving
      const cleanData = stripIds(editedData);
      await onSave(cleanData);
      toast({ title: "Success", description: "Roadmap updated successfully" });
      onClose();
    } catch (error) {
      console.error("Error saving roadmap:", error);
      toast({
        title: "Error",
        description: "Failed to update roadmap",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const stripIds = (node: TreeNode): MindmapNode => {
    const clean: MindmapNode = { name: node.name };
    if (node.color) clean.color = node.color;
    if (node.children && node.children.length > 0) {
      clean.children = node.children.map((c) => stripIds(c as TreeNode));
    }
    return clean;
  };

  // Sortable Node component
  const SortableTreeNode = ({ node }: { node: FlattenedNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: node.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      marginLeft: `${node.level * 20}px`,
    };

    const hasChildren = flattenedNodes[node.id]?.children?.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div ref={setNodeRef} style={style} className="my-1 relative">
        {isDragging && (
          <div className="absolute -left-2 -right-2 -top-1 -bottom-1 rounded border-2 border-dashed border-primary/40 pointer-events-none" />
        )}
        <div className="flex items-center gap-2 py-1.5 px-2 bg-card rounded-lg border border-border">
          <div
            className="cursor-grab flex items-center justify-center h-7 w-7 hover:bg-secondary rounded transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={() => toggleNodeExpansion(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          <Input
            value={node.name}
            onChange={(e) => updateNodeName(node.id, e.target.value)}
            className="flex-1 h-7 text-sm"
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary hover:text-primary"
            onClick={() => {
              const newNodeName = prompt("Enter name for new node:");
              if (newNodeName) addNode(node.id, newNodeName);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>

          {node.parentId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to delete this node and all its children?"
                  )
                ) {
                  deleteNode(node.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderTree = (nodeId: string, visited = new Set<string>()) => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);
    const node = flattenedNodes[nodeId];
    if (!node) return null;
    const isExpanded = expandedNodes.has(nodeId);

    return (
      <React.Fragment key={nodeId}>
        <SortableTreeNode node={node} />
        {isExpanded &&
          node.children &&
          node.children.length > 0 && (
            <div className="children-container">
              {node.children.map((childId) => renderTree(childId, visited))}
            </div>
          )}
      </React.Fragment>
    );
  };

  const getChildIds = (): string[] => {
    return Object.keys(flattenedNodes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Edit Roadmap: {role}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Drag and drop nodes to reorganize your roadmap. Use the grip handle to
          drag. Nodes will be reordered within their level when dragged.
        </p>

        <div className="flex-1 overflow-auto p-4 border border-border rounded-xl my-2 bg-secondary/20">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-primary animate-spin mr-2" />
              <p>Loading roadmap data...</p>
            </div>
          ) : editedData ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <div className="tree-editor">
                {/* Root node */}
                <div className="py-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedData.name}
                      onChange={(e) => {
                        setEditedData({ ...editedData, name: e.target.value });
                      }}
                      className="font-bold text-lg flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary"
                      onClick={() => {
                        const name = prompt("Enter name for new node:");
                        if (name && editedData) addNode(editedData.id, name);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <SortableContext
                  items={getChildIds()}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mt-2">
                    {editedData.children?.map((child) =>
                      renderTree((child as TreeNode).id, new Set())
                    )}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeId && activeDragNode ? (
                    <div className="flex items-center gap-2 py-1.5 px-3 bg-card shadow-lg border border-primary/30 rounded-lg">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {activeDragNode.name}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </div>
            </DndContext>
          ) : (
            <p className="text-center text-muted-foreground">
              No roadmap data available
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !editedData}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
