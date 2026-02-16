export interface MindmapNode {
  name: string;
  color?: string;
  children?: MindmapNode[];
}

export interface MindmapData {
  department: string;
  role: string;
  data: MindmapNode;
}

export interface RoadmapTextData {
  department: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface RoleInfo {
  id: string;
  name: string;
  department: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
}
