export interface Role {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface RateCategory {
  id: number
  code: string
  name?: string
  hourly_rate: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface WorkCalendarEntry {
  year_month: string
  working_days: number
  working_hours: number
}

export type MethodologyType = 'waterfall' | 'agile'
export type ResourceType = 'internal' | 'external'
export type StageType =
  | 'initiation'
  | 'elaboration'
  | 'design'
  | 'development'
  | 'pilot'
  | 'expansion'
  | 'closure'
  | 'mvp_creation'
  | 'mvp_pilot'

export interface Calculation {
  id: number
  name: string
  description?: string
  methodology: MethodologyType
  start_date: string
  end_date: string
  created_at: string
  updated_at?: string
  versions?: CalculationVersion[]
}

export interface CalculationVersion {
  id: number
  calculation_id: number
  version_number: number
  name?: string
  notes?: string
  is_baseline: boolean
  created_at: string
  stages?: Stage[]
}

export interface MonthlyFTE {
  id?: number
  year_month: string
  fte_value: number
}

export interface StageAllocation {
  id?: number
  stage_id?: number
  role_id: number
  rate_category_id?: number
  resource_type: ResourceType
  employee_name?: string
  monthly_salary?: number
  bonus_percent?: number
  fixed_monthly_cost?: number
  notes?: string
  monthly_fte: MonthlyFTE[]
  created_at?: string
}

export interface Stage {
  id?: number
  version_id?: number
  stage_type: StageType
  name?: string
  order_index: number
  start_month: string
  end_month: string
  allocations: StageAllocation[]
  created_at?: string
}

// Cost calculation results
export interface MonthlyDetail {
  year_month: string
  fte: number
  working_hours: number
  cost: number
  revenue: number
  margin: number
}

export interface AllocationCostResult {
  allocation_id: number
  role_name: string
  employee_name?: string
  resource_type: string
  rate_category?: string
  monthly_salary?: number
  bonus_percent?: number
  total_cost: number
  total_revenue: number
  total_margin: number
  margin_percent?: number
  monthly_details: MonthlyDetail[]
}

export interface StageCostResult {
  stage_id: number
  stage_type: string
  stage_name: string
  start_month: string
  end_month: string
  total_cost: number
  total_revenue: number
  total_margin: number
  margin_percent?: number
  internal_cost: number
  external_cost: number
  allocations: AllocationCostResult[]
}

export interface CostCalculationResult {
  calculation_id: number
  version_id: number
  calculation_name: string
  methodology: string
  start_date: string
  end_date: string
  total_cost: number
  total_revenue: number
  total_margin: number
  margin_percent?: number
  total_internal_cost: number
  total_external_cost: number
  stages: StageCostResult[]
  cost_by_role: Record<string, number>
  cost_by_month: Record<string, number>
  revenue_by_month: Record<string, number>
}

// Stage templates
export const WATERFALL_STAGES: { type: StageType; name: string; subStages?: string[] }[] = [
  { type: 'initiation', name: 'Инициирование' },
  { type: 'elaboration', name: 'Этап 1. Проработка' },
  {
    type: 'development',
    name: 'Этап 2. Создание и внедрение',
    subStages: ['Проектирование', 'Разработка и внедрение', 'Опытная эксплуатация']
  },
  { type: 'expansion', name: 'Этап 3. Развитие и тиражирование' },
  { type: 'closure', name: 'Этап 4. Завершение' },
]

export const AGILE_STAGES: { type: StageType; name: string; subStages?: string[] }[] = [
  { type: 'initiation', name: 'Инициирование' },
  { type: 'elaboration', name: 'Этап 1. Проработка' },
  {
    type: 'mvp_creation',
    name: 'Этап 2. Создание и внедрение',
    subStages: ['Создание MVP', 'Опытная эксплуатация и доработка MVP']
  },
  { type: 'expansion', name: 'Этап 3. Развитие и тиражирование' },
  { type: 'closure', name: 'Этап 4. Завершение' },
]

export const STAGE_NAMES: Record<StageType, string> = {
  initiation: 'Инициирование',
  elaboration: 'Проработка',
  design: 'Проектирование',
  development: 'Разработка и внедрение',
  pilot: 'Опытная эксплуатация',
  expansion: 'Развитие и тиражирование',
  closure: 'Завершение',
  mvp_creation: 'Создание MVP',
  mvp_pilot: 'Опытная эксплуатация и доработка MVP',
}
