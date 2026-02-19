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
  Tag,
  Divider,
  Popconfirm,
  Tooltip,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  projectsApi,
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
  Project,
  ProjectVersion,
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

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [project, setProject] = useState<Project | null>(null)
  const [versions, setVersions] = useState<ProjectVersion[]>([])
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
  const [editingVersionId, setEditingVersionId] = useState<number | null>(null)
  const [editingVersionName, setEditingVersionName] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [projectId])

  useEffect(() => {
    if (currentVersionId) {
      loadStages()
      loadCostResult()
    }
  }, [currentVersionId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [projectRes, rolesRes, ratesRes] = await Promise.all([
        projectsApi.getById(projectId),
        rolesApi.getAll(),
        rateCategoriesApi.getAll(),
      ])

      setProject(projectRes.data)
      setRoles(rolesRes.data)
      setRateCategories(ratesRes.data)
      setVersions(projectRes.data.versions || [])

      // Load calendar for project period
      const startMonth = projectRes.data.start_date.substring(0, 7)
      const endMonth = projectRes.data.end_date.substring(0, 7)
      const calendarRes = await calendarApi.getRange(startMonth, endMonth)
      setMonths(calendarRes.data)

      // Select first version or create one
      if (projectRes.data.versions && projectRes.data.versions.length > 0) {
        setCurrentVersionId(projectRes.data.versions[0].id)
      } else {
        // Create initial version
        const versionRes = await versionsApi.create(projectId, {
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
      const response = await stagesApi.getAll(projectId, currentVersionId)
      setStages(response.data)
    } catch (error) {
      console.error('Failed to load stages:', error)
    }
  }

  const loadCostResult = async () => {
    if (!currentVersionId) return
    try {
      const response = await costApi.calculate(projectId, currentVersionId)
      setCostResult(response.data)
    } catch (error) {
      console.error('Failed to calculate cost:', error)
    }
  }

  const handleAddStage = async () => {
    if (!project || !currentVersionId) return

    try {
      const values = await stageForm.validateFields()
      const stageData: Partial<Stage> = {
        stage_type: values.stage_type,
        name: values.name,
        order_index: stages.length,
        start_date: values.period[0].format('YYYY-MM-DD'),
        end_date: values.period[1].format('YYYY-MM-DD'),
        allocations: [],
      }

      await stagesApi.create(projectId, currentVersionId, stageData)
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
      await allocationsApi.create(projectId, currentVersionId, stageId, allocation)
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
      await allocationsApi.update(projectId, currentVersionId, stageId, allocId, data)
      loadStages()
      loadCostResult()
    } catch (error) {
      message.error('Ошибка обновления')
    }
  }

  const handleDeleteAllocation = async (stageId: number, allocId: number) => {
    if (!currentVersionId) return
    try {
      await allocationsApi.delete(projectId, currentVersionId, stageId, allocId)
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
      await versionsApi.update(projectId, currentVersionId, values)
      message.success('Версия обновлена')
      setVersionEditModalOpen(false)
      // Reload project to update versions list
      const projectRes = await projectsApi.getById(projectId)
      setVersions(projectRes.data.versions || [])
    } catch (error) {
      message.error('Ошибка обновления версии')
    }
  }

  const handleCreateNewVersion = async () => {
    try {
      const versionRes = await versionsApi.create(projectId, {
        name: `Версия ${versions.length + 1}`,
        is_baseline: false,
      })
      const updatedVersions = [...versions, versionRes.data]
      setVersions(updatedVersions)
      setCurrentVersionId(versionRes.data.id)
      message.success('Новая версия создана')
    } catch (error) {
      message.error('Ошибка создания версии')
    }
  }

  const handleDeleteVersion = async (versionId: number) => {
    try {
      await versionsApi.delete(projectId, versionId)
      const updatedVersions = versions.filter(v => v.id !== versionId)
      setVersions(updatedVersions)
      if (currentVersionId === versionId) {
        setCurrentVersionId(updatedVersions.length > 0 ? updatedVersions[0].id : null)
        if (updatedVersions.length === 0) {
          setStages([])
          setCostResult(null)
        }
      }
      message.success('Версия удалена')
    } catch (error) {
      message.error('Ошибка удаления версии')
    }
  }

  const handleCopyVersion = async (versionId: number) => {
    try {
      const res = await versionsApi.copy(projectId, versionId)
      const updatedVersions = [...versions, res.data]
      setVersions(updatedVersions)
      setCurrentVersionId(res.data.id)
      message.success('Версия скопирована')
    } catch (error) {
      message.error('Ошибка копирования версии')
    }
  }

  const startInlineEdit = (v: ProjectVersion) => {
    setEditingVersionId(v.id)
    setEditingVersionName(v.name || 'Версия ' + v.version_number)
  }

  const saveInlineEdit = async () => {
    if (!editingVersionId) return
    try {
      await versionsApi.update(projectId, editingVersionId, { name: editingVersionName })
      setVersions(versions.map(v =>
        v.id === editingVersionId ? { ...v, name: editingVersionName } : v
      ))
      setEditingVersionId(null)
    } catch (error) {
      message.error('Ошибка переименования')
    }
  }

  const cancelInlineEdit = () => {
    setEditingVersionId(null)
  }

  const formatVersionLabel = (v: ProjectVersion) => {
    return `v${v.version_number}: ${v.name || 'Версия ' + v.version_number}`
  }

  const getCurrentVersionCreatedAt = () => {
    const currentVersion = versions.find(v => v.id === currentVersionId)
    if (currentVersion) {
      const createdAt = new Date(currentVersion.created_at)
      return createdAt.toLocaleDateString('ru-RU') + ' ' +
             createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }
    return ''
  }

  const templateStages = project?.methodology === 'waterfall' ? WATERFALL_STAGES : AGILE_STAGES

  // Get months from stage dates for allocation table
  const getStageMonths = (stage: Stage) => {
    const startMonth = stage.start_date.substring(0, 7)
    const endMonth = stage.end_date.substring(0, 7)
    return months.filter(m => m.year_month >= startMonth && m.year_month <= endMonth)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!project) {
    return <div>Проект не найден</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
                Назад
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                {project.name}
              </Title>
              <Tag color={project.methodology === 'waterfall' ? 'green' : 'blue'}>
                {project.methodology.toUpperCase()}
              </Tag>
            </Space>
            <Space>
              <Select
                style={{ width: 400 }}
                value={currentVersionId}
                onChange={(val) => {
                  if (editingVersionId) return
                  setCurrentVersionId(val)
                }}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={handleCreateNewVersion}
                      style={{ width: '100%' }}
                    >
                      Новая версия
                    </Button>
                  </>
                )}
                optionRender={(option) => {
                  const v = versions.find(ver => ver.id === option.value)
                  if (!v) return option.label
                  const isEditing = editingVersionId === v.id
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 4 }}
                             onClick={e => e.stopPropagation()}>
                          <span style={{ whiteSpace: 'nowrap' }}>v{v.version_number}:</span>
                          <Input
                            size="small"
                            value={editingVersionName}
                            onChange={e => setEditingVersionName(e.target.value)}
                            onPressEnter={saveInlineEdit}
                            onKeyDown={e => { if (e.key === 'Escape') cancelInlineEdit() }}
                            autoFocus
                            style={{ flex: 1 }}
                          />
                          <Button type="text" size="small" icon={<CheckOutlined />}
                                  onClick={saveInlineEdit} style={{ color: '#52c41a' }} />
                          <Button type="text" size="small" icon={<CloseOutlined />}
                                  onClick={cancelInlineEdit} />
                        </div>
                      ) : (
                        <>
                          <span
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              startInlineEdit(v)
                            }}
                            style={{ flex: 1 }}
                          >
                            {formatVersionLabel(v)}
                          </span>
                          <Space size={0} onClick={e => e.stopPropagation()}>
                            <Tooltip title="Переименовать">
                              <Button type="text" size="small" icon={<EditOutlined />}
                                      onClick={() => startInlineEdit(v)} />
                            </Tooltip>
                            <Tooltip title="Копировать">
                              <Button type="text" size="small" icon={<CopyOutlined />}
                                      onClick={() => handleCopyVersion(v.id)} />
                            </Tooltip>
                            <Tooltip title="Удалить">
                              <Popconfirm
                                title="Удалить версию?"
                                description="Все этапы и данные будут удалены"
                                onConfirm={() => handleDeleteVersion(v.id)}
                                okText="Удалить"
                                cancelText="Отмена"
                              >
                                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Tooltip>
                          </Space>
                        </>
                      )}
                    </div>
                  )
                }}
                options={versions.map(v => ({
                  value: v.id,
                  label: formatVersionLabel(v),
                }))}
              />
              <Button
                icon={<FileExcelOutlined />}
                href={currentVersionId ? exportApi.excel(projectId, currentVersionId) : undefined}
              >
                Excel
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                href={currentVersionId ? exportApi.pdf(projectId, currentVersionId) : undefined}
              >
                PDF
              </Button>
            </Space>
          </Space>
          {currentVersionId && (
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              Создано: {getCurrentVersionCreatedAt()}
            </Text>
          )}
        </Card>

        {/* Workflow */}
        <Card title="Workflow проекта">
          <WorkflowDiagram
            methodology={project.methodology}
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
                    ({stage.start_date} — {stage.end_date})
                  </Text>
                </Space>
              ),
              children: (
                <AllocationTable
                  allocations={stage.allocations}
                  roles={roles}
                  rateCategories={rateCategories}
                  months={getStageMonths(stage)}
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
        <CostSummary result={costResult || {
          project_id: projectId,
          version_id: currentVersionId || 0,
          project_name: project.name,
          methodology: project.methodology,
          start_date: project.start_date,
          end_date: project.end_date,
          total_cost: 0,
          total_revenue: 0,
          total_margin: 0,
          margin_percent: null,
          total_internal_cost: 0,
          total_external_cost: 0,
          stages: [],
          cost_by_role: {},
          cost_by_month: {},
          revenue_by_month: {},
        }} />
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
            <Select>
              {templateStages.map(s => (
                <Select.Option
                  key={s.type}
                  value={s.type}
                  style={{ paddingLeft: s.isSubstage ? 24 : 8 }}
                >
                  {s.name}
                </Select.Option>
              ))}
            </Select>
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
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              disabledDate={date => {
                const start = dayjs(project.start_date)
                const end = dayjs(project.end_date)
                return date.isBefore(start, 'day') || date.isAfter(end, 'day')
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

export default ProjectDetail
