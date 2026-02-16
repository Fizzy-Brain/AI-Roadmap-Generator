import { MindmapData, RoadmapTextData, RoleInfo } from "@/types/roadmap";
import { mockRoles, mockRoadmapText, mockMindmapData } from "@/data/mockData";

// Configure your backend base URL here
const API_BASE_URL = "";

// For now, use mock data. Replace with actual API calls when backend is ready.
const USE_MOCK = true;

export async function fetchRoles(): Promise<RoleInfo[]> {
  if (USE_MOCK) return mockRoles;
  const res = await fetch(`${API_BASE_URL}/roles`);
  return res.json();
}

export async function fetchRoadmapText(roleId: string): Promise<RoadmapTextData | null> {
  if (USE_MOCK) return mockRoadmapText[roleId] || null;
  const res = await fetch(`${API_BASE_URL}/roadmap/text/${roleId}`);
  return res.json();
}

export async function fetchMindmapData(roleId: string): Promise<MindmapData | null> {
  if (USE_MOCK) return mockMindmapData[roleId] || null;
  const res = await fetch(`${API_BASE_URL}/roadmap/mindmap/${roleId}`);
  return res.json();
}

export async function generateRoadmap(roleName: string): Promise<RoadmapTextData> {
  if (USE_MOCK) {
    const id = roleName.toLowerCase().replace(/\s+/g, "-");
    return mockRoadmapText[id] || mockRoadmapText["fullstack-developer"]!;
  }
  const res = await fetch(`${API_BASE_URL}/roadmap/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: roleName }),
  });
  return res.json();
}

export async function generateMindmap(roleName: string): Promise<MindmapData> {
  if (USE_MOCK) {
    const id = roleName.toLowerCase().replace(/\s+/g, "-");
    return mockMindmapData[id] || mockMindmapData["fullstack-developer"]!;
  }
  const res = await fetch(`${API_BASE_URL}/mindmap/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: roleName }),
  });
  return res.json();
}

export async function adminLogin(username: string, password: string): Promise<boolean> {
  if (USE_MOCK) return username === "admin" && password === "admin123";
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  return data.success;
}

export async function addRole(role: RoleInfo): Promise<void> {
  if (USE_MOCK) return;
  await fetch(`${API_BASE_URL}/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(role),
  });
}

export async function deleteRole(roleId: string): Promise<void> {
  if (USE_MOCK) return;
  await fetch(`${API_BASE_URL}/roles/${roleId}`, { method: "DELETE" });
}
