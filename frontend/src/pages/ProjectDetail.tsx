import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Table,
  Modal,
  Form,
  Input,
  DatePicker,
  Popconfirm,
  Tag,
  Descriptions,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalculatorOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { projectsApi, calculationsApi } from '../services/api'
import type { Project, Calculation } from '../types'
import WorkflowDiagram from '../components/WorkflowDiagram'

const { Title } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [project, setProject] = useState<Project | null>(null)
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [calcModalOpen, setCalcModalOpen] = useState(false)
  const [editingCalc, setEditingCalc] = useState<Calculation | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      const [projectRes, calcsRes] = await Promise.all([
        projectsApi.getById(projectId),
        calculationsApi.getAll(projectId),
      ])
      setProject(projectRes.data)
      setCalculations(calcsRes.data)
    } catch (error) {
      message.error('Ошибка загрузки проекта')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCalc = () => {
    setEditingCalc(null)
    form.resetFields()
    if (project) {
      form.setFieldsValue({
        period: [dayjs(project.start_date), dayjs(project.end_date)],
      })
    }
    setCalcModalOpen(true)
  }

  const handleEditCalc = (calc: Calculation) => {
    setEditingCalc(calc)
    form.setFieldsValue({
      name: calc.name,
      description: calc.description,
      period: [dayjs(calc.start_date), dayjs(calc.end_date)],
    })
    setCalcModalOpen(true)
  }

  const handleDeleteCalc = async (calcId: number) => {
    try {
      await calculationsApi.delete(projectId, calcId)
      message.success('Расчёт удалён')
      loadProject()
    } catch (error) {
      message.error('Ошибка удаления расчёта')
    }
  }

  const handleSubmitCalc = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        name: values.name,
        description: values.description,
        start_date: values.period[0].format('YYYY-MM-DD'),
        end_date: values.period[1].format('YYYY-MM-DD'),
      }

      if (editingCalc) {
        await calculationsApi.update(projectId, editingCalc.id, data)
        message.success('Расчёт обновлён')
      } else {
        await calculationsApi.create(projectId, data)
        message.success('Расчёт создан')
      }

      setCalcModalOpen(false)
      loadProject()
    } catch (error) {
      message.error('Ошибка сохранения расчёта')
    }
  }

  const columns = [
    {
      title: 'Название расчёта',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Calculation) => (
        <a onClick={() => navigate(`/projects/${projectId}/calculations/${record.id}`)}>
          {text}
        </a>
      ),
    },
    {
      title: 'Период',
      key: 'period',
      render: (_: unknown, record: Calculation) => (
        <span>{record.start_date} — {record.end_date}</span>
      ),
    },
    {
      title: 'Версий',
      key: 'versions',
      render: (_: unknown, record: Calculation) => (
        <Tag>{record.versions?.length || 0}</Tag>
      ),
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => {
        const d = new Date(date)
        return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: Calculation) => (
        <Space>
          <Button
            icon={<CalculatorOutlined />}
            onClick={() => navigate(`/projects/${projectId}/calculations/${record.id}`)}
          >
            Открыть
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleEditCalc(record)
            }}
          />
          <Popconfirm
            title="Удалить расчёт?"
            onConfirm={() => handleDeleteCalc(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

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
          </Space>
        </Card>

        {/* Project Info */}
        <Card title="Информация о проекте">
          <Descriptions column={2}>
            <Descriptions.Item label="Методология">
              {project.methodology.toUpperCase()}
            </Descriptions.Item>
            <Descriptions.Item label="Период">
              {project.start_date} — {project.end_date}
            </Descriptions.Item>
            <Descriptions.Item label="Описание" span={2}>
              {project.description || 'Нет описания'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Workflow */}
        <Card title="Workflow проекта">
          <WorkflowDiagram
            methodology={project.methodology}
            stages={[]}
            activeStageIndex={-1}
          />
        </Card>

        {/* Calculations */}
        <Card
          title="Расчёты проекта"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCalc}>
              Новый расчёт
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={calculations}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: 'Нет расчётов. Создайте первый расчёт.' }}
          />
        </Card>
      </Space>

      {/* Create/Edit Calculation Modal */}
      <Modal
        title={editingCalc ? 'Редактировать расчёт' : 'Новый расчёт'}
        open={calcModalOpen}
        onOk={handleSubmitCalc}
        onCancel={() => setCalcModalOpen(false)}
        okText={editingCalc ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="Название расчёта"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Например: Базовый расчёт, Оптимистичный сценарий" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={2} placeholder="Описание расчёта" />
          </Form.Item>

          <Form.Item
            name="period"
            label="Период расчёта"
            rules={[{ required: true, message: 'Укажите период' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectDetail
