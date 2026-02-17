import { MindmapNode } from "@/types/roadmap";

const BACKEND_URL = "/api";

/**
 * Fix unquoted keys in JS-object-like strings returned by the backend.
 */
function fixUnquotedKeys(str: string): string {
  return str.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
}

/** Enriched response from /generate — tree + AI-generated metadata */
interface EnrichedGeneration {
  tree: MindmapNode;
  description?: string;
  skills?: string[];
  topics?: string[];
}

function parseGenerationResult(raw: string): EnrichedGeneration {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      parsed = JSON.parse(fixUnquotedKeys(raw));
    } catch (e) {
      console.error("Failed to parse generation JSON:", e, "\nRaw:", raw.slice(0, 500));
      throw new Error("Failed to parse roadmap data from backend");
    }
  }

  // New enriched format: { tree, description, skills, topics }
  if ("tree" in parsed && typeof parsed.tree === "object") {
    return {
      tree: parsed.tree as MindmapNode,
      description: typeof parsed.description === "string" ? parsed.description : undefined,
      skills: Array.isArray(parsed.skills) ? (parsed.skills as string[]) : undefined,
      topics: Array.isArray(parsed.topics) ? (parsed.topics as string[]) : undefined,
    };
  }

  // Legacy format: the entire object IS the tree (no description/skills)
  return { tree: parsed as unknown as MindmapNode };
}

// ── Roadmap Generation (calls Python backend) ──────────────────────
export async function generateMindmap(roleName: string): Promise<EnrichedGeneration & { textContent?: string }> {
  const res = await fetch(`${BACKEND_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_role: roleName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to generate roadmap" }));
    throw new Error(err.detail || err.error || "Failed to generate roadmap");
  }

  const data = await res.json();
  const raw = typeof data.result === "string" ? data.result : JSON.stringify(data.result);
  const enriched = parseGenerationResult(raw);

  // Backend may also return pre-stored text_content (from file cache)
  const textContent = data.text_content as string | undefined;
  return { ...enriched, textContent };
}

export async function convertToText(
  jsonData: MindmapNode,
  description?: string,
  skills?: string[],
  topics?: string[],
): Promise<string> {
  const body: Record<string, unknown> = { json_data: jsonData };
  if (description) body.description = description;
  if (skills && skills.length > 0) body.skills = skills;
  if (topics && topics.length > 0) body.topics = topics;

  const res = await fetch(`${BACKEND_URL}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to convert" }));
    throw new Error(err.detail || err.error || "Failed to convert roadmap to text");
  }

  const data = await res.json();
  return data.result;
}

// ── Full generation pipeline ───────────────────────────────────────
export interface GenerationResult {
  mindmap: MindmapNode;
  textContent: string;
  topics: string[];
  cached?: boolean;
}

// ── File-based storage via backend (data/mindmaps.json & data/roadmaps.json) ──

async function getStoredMindmap(role: string): Promise<MindmapNode | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/storage/mindmap/${encodeURIComponent(role)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as MindmapNode;
  } catch {
    return null;
  }
}

async function getStoredRoadmap(role: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/storage/roadmap/${encodeURIComponent(role)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.content as string;
  } catch {
    return null;
  }
}

export async function generateFullRoadmap(roleName: string): Promise<GenerationResult> {
  // Check backend file-based storage first
  const [storedMindmap, storedRoadmap] = await Promise.all([
    getStoredMindmap(roleName),
    getStoredRoadmap(roleName),
  ]);

  if (storedMindmap && storedRoadmap) {
    return {
      mindmap: storedMindmap,
      textContent: storedRoadmap,
      topics: extractTopics(storedRoadmap),
      cached: true,
    };
  }

  // Generate fresh from backend (returns tree + description + skills + topics)
  const enriched = await generateMindmap(roleName);

  // If backend returned pre-stored text content (from file cache hit)
  if (enriched.textContent) {
    return {
      mindmap: enriched.tree,
      textContent: enriched.textContent,
      topics: extractTopics(enriched.textContent),
      cached: true,
    };
  }

  // Convert to text, passing the AI-generated description/skills/topics
  // Backend's /convert auto-saves to roadmaps.json
  const textContent = await convertToText(
    enriched.tree,
    enriched.description,
    enriched.skills,
    enriched.topics,
  );

  return { mindmap: enriched.tree, textContent, topics: extractTopics(textContent) };
}

export async function updateRoadmap(
  roleName: string,
  updatedMindmap: MindmapNode
): Promise<string> {
  // /convert auto-saves to roadmaps.json on backend
  const textContent = await convertToText(updatedMindmap);
  return textContent;
}

export async function clearCache(roleName: string) {
  try {
    await fetch(`${BACKEND_URL}/storage/${encodeURIComponent(roleName)}`, {
      method: "DELETE",
    });
  } catch {
    // Ignore errors
  }
}

// ── Topic extraction ───────────────────────────────────────────────
export function extractTopics(content: string): string[] {
  const topicsMatch = content.match(/TOPICS:\s*([\s\S]*?)(?:\n\n|\n$|$)/);
  if (topicsMatch?.[1]) {
    return topicsMatch[1]
      .trim()
      .split(/,\s*/)
      .filter(Boolean);
  }
  const roadmapMatch = content.match(/ROADMAP[^:]*:\s*([\s\S]*?)(?:TOPICS|$)/);
  if (roadmapMatch?.[1]) {
    const mainTopics = roadmapMatch[1].match(/\d+\.\s*([A-Za-z0-9\s/&]+)/g);
    if (mainTopics) {
      return mainTopics.map((t) => t.replace(/\d+\.\s*/, "").trim()).filter(Boolean);
    }
  }
  return [];
}

// ── Auth ───────────────────────────────────────────────────────────
export async function adminLogin(
  username: string,
  password: string
): Promise<boolean> {
  return username === "admin" && password === "admin123";
}
