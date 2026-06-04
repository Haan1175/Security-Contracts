import axios from "axios";
import type {
  Contract,
  ContractListResponse,
  ContractFilters,
  ReportSummary,
  ReportGroup,
  EnumsResponse,
} from "../types";

const api = axios.create({ baseURL: "/api" });

export async function fetchContracts(filters: ContractFilters): Promise<ContractListResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  );
  const { data } = await api.get("/contracts", { params });
  return data;
}

export async function fetchContract(id: number): Promise<Contract> {
  const { data } = await api.get(`/contracts/${id}`);
  return data;
}

export async function createContract(payload: Partial<Contract>): Promise<Contract> {
  const { data } = await api.post("/contracts", payload);
  return data;
}

export async function updateContract(id: number, payload: Partial<Contract>): Promise<Contract> {
  const { data } = await api.put(`/contracts/${id}`, payload);
  return data;
}

export async function archiveContract(id: number): Promise<Contract> {
  const { data } = await api.post(`/contracts/${id}/archive`);
  return data;
}

export async function unarchiveContract(id: number): Promise<Contract> {
  const { data } = await api.post(`/contracts/${id}/unarchive`);
  return data;
}

export async function deleteContract(id: number): Promise<void> {
  await api.delete(`/contracts/${id}`);
}

export async function fetchSummary(): Promise<ReportSummary> {
  const { data } = await api.get("/reports/summary");
  return data;
}

export async function fetchGroupReport(groupBy: string): Promise<ReportGroup[]> {
  const { data } = await api.get("/reports/group", { params: { group_by: groupBy } });
  return data;
}

export async function fetchExpiringContracts(days: number): Promise<Contract[]> {
  const { data } = await api.get("/reports/expiring", { params: { days } });
  return data;
}

export async function fetchEnums(): Promise<EnumsResponse> {
  const { data } = await api.get("/enums");
  return data;
}

export async function importContractsCsv(file: File): Promise<{ imported: number; errors: { row: number; error: string }[] }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/contracts/import-csv", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
