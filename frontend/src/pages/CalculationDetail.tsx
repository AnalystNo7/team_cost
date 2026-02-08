import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Space,
  Spin,
  message,
  Collapse,
  Select,
  Typography,
  DatePicker,
  Modal,
  Form,
  Input,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  EditOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  calculationsApi,
  versionsApi,
  stagesApi,
  allocationsApi,
  rolesApi,
  rateCategoriesApi,
  calendarApi,
  costApi,
  exportApi,
} from '../services/api'
import type {
  Calculation,
  CalculationVersion,
  Stage,
  StageAllocation,
  Role,
  RateCategory,
  WorkCalendarEntry,
  CostCalculationResult,
} from '../types'
import { WATERFALL_STAGES, AGILE_STAGES, STAGE_NAMES } from '../types'
import WorkflowDiagram from '../components/WorkflowDiagram'
import AllocationTable from '../components/AllocationTable'
import CostSummary from '../components/CostSummary'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const CalculationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const calcId = Number(id)

  const [calculation, setCalculation] = useState<Calculation | null>(null)
  const [versions, setVersions] = useState<CalculationVersion[]>([])
  const [currentVersionId, setCurrentVersionId] = useState<number | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [rateCategories, setRateCategories] = useState<RateCategory[]>([])
  const [months, setMonths] = useState<WorkCalendarEntry[]>([])
  const [costResult, setCostResult] = useState<CostCalculationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [stageForm] = Form.useForm()
  const [versionEditModalOpen, setVersionEditModalOpen] = useState(false)
  const [versionEditForm] = Form.useForm()

  useEffect(() => {
    loadInitialData()
  }, [calcId])

  useEffect(() => {
    if (currentVersionId) {
      loadStages()
      loadCostResult()
    }
  }, [currentVersionId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [calcRes, rolesRes, ratesRes] = await Promise.all([
        calculationsApi.getById(calcId),
        rolesApi.getAll(),
        rateCategoriesApi.getAll(),
      ])

      setCalculation(calcRes.data)
      setRoles(rolesRes.data)
      setRateCategories(ratesRes.data)
      setVersions(calcRes.data.versions || [])

      // Load calendar for project period
      const calendarRes = await calendarApi.getRange(
        calcRes.data.start_date,
        calcRes.data.end_date
      )
      setMonths(calendarRes.data)

      // Select first version or create one
      if (calcRes.data.versions && calcRes.data.versions.length > 0) {
        setCurrentVersionId(calcRes.data.versions[0].id)
      } else {
        // Create initial version
        const versionRes = await versionsApi.create(calcId, {
          name: 'Базовая версия',
          is_baseline: true,
        })
        setVersions([versionRes.data])
        setCurrentVersionId(versionRes.data.id)
      }
    } catch (error) {
      message.error('Ошибка загрузки данных')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStages = async () => {
    if (!currentVersionId) return
    try {
      const response = await stagesApi.getAll(calcId, currentVersionId)
      setStages(response.data)
    } catch (error) {
      console.error('Failed to load stages:', error)
    }
  }

  const loadCostResult = async () => {
    if (!currentVersionId) return
    try {
      const response = await costApi.calculate(calcId, currentVersionId)
      setCostResult(response.data)
    } catch (error) {
      console.error('Failed to calculate cost:', error)
    }
  }

  const handleAddStage = async () => {
    if (!calculation || !currentVersionId) return

    try {
      const values = await stageForm.validateFields()
      const stageData: Partial<Stage> = {
        stage_type: values.stage_type,
        name: values.name,
        order_index: stages.length,
        start_month: values.period[0].format('YYYY-MM'),
        end_month: values.period[1].format('YYYY-MM'),
        allocations: [],
      }

      await stagesApi.create(calcId, currentVersionId, stageData)
      message.success('Этап добавлен')
      setStageModalOpen(false)
      stageForm.resetFields()
      loadStages()
      loadCostResult()
    } catch (error) {
      message.error('Ошибка добавления этапа')
    }
  }

  const handleAddAllocation = async (stageId: number, allocation: Partial<StageAllocation>) => {
    if (!currentVersionId) return
    try {
      await allocationsApi.create(calcId, currentVersionId, stageId, allocation)
      loadStages()
      loadCostResult()
    } catch (error) {
      message.error('Ошибка добавления участника')
    }
  }

  const handleUpdateAllocation = async (
    stageId: number,
    allocId: number,
    data: Partial<StageAllocation>
  ) => {
    if (!currentVersionId) return
    try {
      await allocationsApi.update(calcId, currentVersionId, stageId, allocId, data)
      loadStages()
      loadCostResult()
    } catch (error) {
      message.error('Ошибка обновления')
    }
  }

  const handleDeleteAllocation = async (stageId: number, allocId: number) => {
    if (!currentVersionId) return
    try {
      await allocationsApi.delete(calcId, currentVersionId, stageId, allocId)
      loadStages()
      loadCostResult()
    } catch (error) {
      message.error('Ошибка удаления')
    }
  }

  const handleEditVersion = () => {
    const currentVersion = versions.find(v => v.id === currentVersionId)
    if (currentVersion) {
      versionEditForm.setFieldsValue({
        name: currentVersion.name || 'Базовая версия',
        notes: currentVersion.notes || '',
      })
      setVersionEditModalOpen(true)
    }
  }

  const handleUpdateVersion = async () => {
    if (!currentVersionId) return
    try {
      const values = await versionEditForm.validateFields()
      await versionsApi.update(calcId, currentVersionId, values)
      message.success('Версия обновлена')
      setVersionEditModalOpen(false)
      // Reload calculation to update versions list
      const calcRes = await calculationsApi.getById(calcId)
      setVersions(calcRes.data.versions || [])
    } catch (error) {
      message.error('Ошибка обновления версии')
    }
  }

  const templateStages = calculation?.methodology === 'waterfall' ? WATERFALL_STAGES : AGILE_STAGES

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!calculation) {
    return <div>Расчёт не найден</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/calculations')}>
                Назад
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                {calculation.name}
              </Title>
              <Text type="secondary">
                {calculation.methodology.toUpperCase()} | {calculation.start_date} —{' '}
                {calculation.end_date}
              </Text>
            </Space>
            <Space>
              <Select
                style={{ width: 200 }}
                value={currentVersionId}
                onChange={setCurrentVersionId}
                options={versions.map(v => ({
                  value: v.id,
                  label: `v${v.version_number}: ${v.name || 'Базовая версия'}`,
                }))}
              />
              <Button
                icon={<EditOutlined />}
                onClick={handleEditVersion}
                disabled={!currentVersionId}
              />
              <Button
                icon={<FileExcelOutlined />}
                href={currentVersionId ? exportApi.excel(calcId, currentVersionId) : undefined}
              >
                Excel
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                href={currentVersionId ? exportApi.pdf(calcId, currentVersionId) : undefined}
              >
                PDF
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Workflow */}
        <Card title="Workflow проекта">
          <WorkflowDiagram
            methodology={calculation.methodology}
            stages={stages}
            activeStageIndex={activeStageIndex}
            onStageClick={setActiveStageIndex}
          />
        </Card>

        {/* Stages */}
        <Card
          title="Этапы проекта"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setStageModalOpen(true)}>
              Добавить этап
            </Button>
          }
        >
          <Collapse
            accordion
            items={stages.map((stage) => ({
              key: stage.id,
              label: (
                <Space>
                  <span>{stage.name || STAGE_NAMES[stage.stage_type]}</span>
                  <Text type="secondary">
                    ({stage.start_month} — {stage.end_month})
                  </Text>
                </Space>
              ),
              children: (
                <AllocationTable
                  allocations={stage.allocations}
                  roles={roles}
                  rateCategories={rateCategories}
                  months={months.filter(
                    m => m.year_month >= stage.start_month && m.year_month <= stage.end_month
                  )}
                  onAdd={alloc => handleAddAllocation(stage.id!, alloc)}
                  onUpdate={(allocId, data) =>
                    handleUpdateAllocation(stage.id!, allocId, data)
                  }
                  onDelete={allocId => handleDeleteAllocation(stage.id!, allocId)}
                />
              ),
            }))}
          />
        </Card>

        {/* Cost Summary */}
        {costResult && <CostSummary result={costResult} />}
      </Space>

      {/* Add Stage Modal */}
      <Modal
        title="Добавить этап"
        open={stageModalOpen}
        onOk={handleAddStage}
        onCancel={() => setStageModalOpen(false)}
        okText="Добавить"
        cancelText="Отмена"
      >
        <Form form={stageForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="stage_type"
            label="Тип этапа"
            rules={[{ required: true, message: 'Выберите тип' }]}
          >
            <Select
              options={templateStages.map(s => ({
                value: s.type,
                label: s.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="name" label="Название (опционально)">
            <Input placeholder="Кастомное название этапа" />
          </Form.Item>
          <Form.Item
            name="period"
            label="Период"
            rules={[{ required: true, message: 'Укажите период' }]}
          >
            <RangePicker
              picker="month"
              style={{ width: '100%' }}
              format="YYYY-MM"
              disabledDate={date => {
                const start = dayjs(calculation.start_date)
                const end = dayjs(calculation.end_date)
                return date.isBefore(start, 'month') || date.isAfter(end, 'month')
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Version Modal */}
      <Modal
        title="Редактировать версию"
        open={versionEditModalOpen}
        onOk={handleUpdateVersion}
        onCancel={() => setVersionEditModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={versionEditForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="Название версии"
            rules={[{ required: true, message: 'Введите название версии' }]}
          >
            <Input placeholder="Например: Базовая версия" />
          </Form.Item>
          <Form.Item name="notes" label="Примечания">
            <Input.TextArea rows={3} placeholder="Дополнительные примечания к версии" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CalculationDetail
