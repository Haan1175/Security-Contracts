import axios from "axios";
import type {
  SecurityTool,
  ToolListResponse,
  ToolFilters,
  ToolSummary,
  ToolScoreRow,
  ToolGroupRow,
} from "../types";

const api = axios.create({ baseURL: "/api" });

export async function fetchTools(filters: ToolFilters): Promise<ToolListResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  );
  const { data } = await api.get("/tools", { params });
  return data;
}

export async function fetchTool(id: number): Promise<SecurityTool> {
  const { data } = await api.get(`/tools/${id}`);
  return data;
}

export async function createTool(payload: Partial<SecurityTool>): Promise<SecurityTool> {
  const { data } = await api.post("/tools", payload);
  return data;
}

export async function updateTool(id: number, payload: Partial<SecurityTool>): Promise<SecurityTool> {
  const { data } = await api.put(`/tools/${id}`, payload);
  return data;
}

export async function archiveTool(id: number): Promise<SecurityTool> {
  const { data } = await api.post(`/tools/${id}/archive`);
  return data;
}

export async function unarchiveTool(id: number): Promise<SecurityTool> {
  const { data } = await api.post(`/tools/${id}/unarchive`);
  return data;
}

export async function deleteTool(id: number): Promise<void> {
  await api.delete(`/tools/${id}`);
}

export async function fetchToolSummary(): Promise<ToolSummary> {
  const { data } = await api.get("/reports/tools/summary");
  return data;
}

export async function fetchToolScores(): Promise<ToolScoreRow[]> {
  const { data } = await api.get("/reports/tools/scores");
  return data;
}

export async function fetchToolGroup(groupBy: string): Promise<ToolGroupRow[]> {
  const { data } = await api.get("/reports/tools/group", { params: { group_by: groupBy } });
  return data;
}

export async function importToolsCsv(file: File): Promise<{ imported: number; errors: { row: number; error: string }[] }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/tools/import-csv", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
