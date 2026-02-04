import axios from 'axios'
import type {
  Role,
  RateCategory,
  Calculation,
  CalculationVersion,
  Stage,
  StageAllocation,
  CostCalculationResult,
  WorkCalendarEntry,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Roles
export const rolesApi = {
  getAll: () => api.get<Role[]>('/roles/'),
  getById: (id: number) => api.get<Role>(`/roles/${id}`),
  create: (data: Partial<Role>) => api.post<Role>('/roles/', data),
  update: (id: number, data: Partial<Role>) => api.put<Role>(`/roles/${id}`, data),
  delete: (id: number) => api.delete(`/roles/${id}`),
}

// Rate Categories
export const rateCategoriesApi = {
  getAll: () => api.get<RateCategory[]>('/rate-categories/'),
  getById: (id: number) => api.get<RateCategory>(`/rate-categories/${id}`),
  create: (data: Partial<RateCategory>) => api.post<RateCategory>('/rate-categories/', data),
  update: (id: number, data: Partial<RateCategory>) => api.put<RateCategory>(`/rate-categories/${id}`, data),
  delete: (id: number) => api.delete(`/rate-categories/${id}`),
}

// Work Calendar
export const calendarApi = {
  getRange: (startMonth: string, endMonth: string) =>
    api.get<WorkCalendarEntry[]>(`/calendar/range/${startMonth}/${endMonth}`),
}

// Calculations
export const calculationsApi = {
  getAll: () => api.get<Calculation[]>('/calculations/'),
  getById: (id: number) => api.get<Calculation>(`/calculations/${id}`),
  create: (data: Partial<Calculation>) => api.post<Calculation>('/calculations/', data),
  update: (id: number, data: Partial<Calculation>) => api.put<Calculation>(`/calculations/${id}`, data),
  delete: (id: number) => api.delete(`/calculations/${id}`),
}

// Versions
export const versionsApi = {
  create: (calcId: number, data: Partial<CalculationVersion>) =>
    api.post<CalculationVersion>(`/calculations/${calcId}/versions`, data),
  delete: (calcId: number, versionId: number) =>
    api.delete(`/calculations/${calcId}/versions/${versionId}`),
}

// Stages
export const stagesApi = {
  getAll: (calcId: number, versionId: number) =>
    api.get<Stage[]>(`/calculations/${calcId}/versions/${versionId}/stages`),
  create: (calcId: number, versionId: number, data: Partial<Stage>) =>
    api.post<Stage>(`/calculations/${calcId}/versions/${versionId}/stages`, data),
  update: (calcId: number, versionId: number, stageId: number, data: Partial<Stage>) =>
    api.put<Stage>(`/calculations/${calcId}/versions/${versionId}/stages/${stageId}`, data),
  delete: (calcId: number, versionId: number, stageId: number) =>
    api.delete(`/calculations/${calcId}/versions/${versionId}/stages/${stageId}`),
}

// Allocations
export const allocationsApi = {
  create: (calcId: number, versionId: number, stageId: number, data: Partial<StageAllocation>) =>
    api.post<StageAllocation>(
      `/calculations/${calcId}/versions/${versionId}/stages/${stageId}/allocations`,
      data
    ),
  update: (
    calcId: number,
    versionId: number,
    stageId: number,
    allocId: number,
    data: Partial<StageAllocation>
  ) =>
    api.put<StageAllocation>(
      `/calculations/${calcId}/versions/${versionId}/stages/${stageId}/allocations/${allocId}`,
      data
    ),
  delete: (calcId: number, versionId: number, stageId: number, allocId: number) =>
    api.delete(
      `/calculations/${calcId}/versions/${versionId}/stages/${stageId}/allocations/${allocId}`
    ),
}

// Cost Calculation
export const costApi = {
  calculate: (calcId: number, versionId: number) =>
    api.get<CostCalculationResult>(`/calculations/${calcId}/versions/${versionId}/calculate`),
}

// Export
export const exportApi = {
  excel: (calcId: number, versionId: number) =>
    `/api/export/${calcId}/versions/${versionId}/excel`,
  pdf: (calcId: number, versionId: number) =>
    `/api/export/${calcId}/versions/${versionId}/pdf`,
}

export default api
