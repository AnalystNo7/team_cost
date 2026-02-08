import axios from 'axios'
import type {
  Role,
  RateCategory,
  Project,
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

// Projects
export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects/'),
  getById: (id: number) => api.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) => api.post<Project>('/projects/', data),
  update: (id: number, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
}

// Calculations (nested under projects)
export const calculationsApi = {
  getAll: (projectId: number) => api.get<Calculation[]>(`/projects/${projectId}/calculations/`),
  getById: (projectId: number, id: number) => api.get<Calculation>(`/projects/${projectId}/calculations/${id}`),
  create: (projectId: number, data: Partial<Calculation>) => api.post<Calculation>(`/projects/${projectId}/calculations/`, data),
  update: (projectId: number, id: number, data: Partial<Calculation>) => api.put<Calculation>(`/projects/${projectId}/calculations/${id}`, data),
  delete: (projectId: number, id: number) => api.delete(`/projects/${projectId}/calculations/${id}`),
}

// Versions
export const versionsApi = {
  create: (projectId: number, calcId: number, data: Partial<CalculationVersion>) =>
    api.post<CalculationVersion>(`/projects/${projectId}/calculations/${calcId}/versions`, data),
  update: (projectId: number, calcId: number, versionId: number, data: Partial<CalculationVersion>) =>
    api.put<CalculationVersion>(`/projects/${projectId}/calculations/${calcId}/versions/${versionId}`, data),
  delete: (projectId: number, calcId: number, versionId: number) =>
    api.delete(`/projects/${projectId}/calculations/${calcId}/versions/${versionId}`),
}

// Stages
export const stagesApi = {
  getAll: (projectId: number, calcId: number, versionId: number) =>
    api.get<Stage[]>(`/projects/${projectId}/calculations/${calcId}/versions/${versionId}/stages`),
  create: (projectId: number, calcId: number, versionId: number, data: Partial<Stage>) =>
    api.post<Stage>(`/projects/${projectId}/calculations/${calcId}/versions/${versionId}/stages`, data),
  update: (projectId: number, calcId: number, versionId: number, stageId: number, data: Partial<Stage>) =>
    api.put<Stage>(`/projects/${projectId}/calculations/${calcId}/versions/${versionId}/stages/${stageId}`, data),
  delete: (projectId: number, calcId: number, versionId: number, stageId: number) =>
    api.delete(`/projects/${projectId}/calculations/${calcId}/versions/${versionId}/stages/${stageId}`),
}

// Allocations
export const allocationsApi = {
  create: (projectId: number, calcId: number, versionId: number, stageId: number, data: Partial<StageAllocation>) =>
    api.post<StageAllocation>(
      `/projects/${projectId}/calculations/${calcId}/versions/${versionId}/stages/${stageId}/allocations`,
      data
    ),
  update: (
    projectId: number,
    calcId: number,
    versionId: number,
    stageId: number,
    allocId: number,
    data: Partial<StageAllocation>
  ) =>
    api.put<StageAllocation>(
      `/projects/${projectId}/calculations/${calcId}/versions/${versionId}/stages/${stageId}/allocations/${allocId}`,
      data
    ),
  delete: (projectId: number, calcId: number, versionId: number, stageId: number, allocId: number) =>
    api.delete(
      `/projects/${projectId}/calculations/${calcId}/versions/${versionId}/stages/${stageId}/allocations/${allocId}`
    ),
}

// Cost Calculation
export const costApi = {
  calculate: (projectId: number, calcId: number, versionId: number) =>
    api.get<CostCalculationResult>(`/projects/${projectId}/calculations/${calcId}/versions/${versionId}/calculate`),
}

// Export
export const exportApi = {
  excel: (projectId: number, calcId: number, versionId: number) =>
    `/api/projects/${projectId}/calculations/${calcId}/versions/${versionId}/excel`,
  pdf: (projectId: number, calcId: number, versionId: number) =>
    `/api/projects/${projectId}/calculations/${calcId}/versions/${versionId}/pdf`,
}

export default api
