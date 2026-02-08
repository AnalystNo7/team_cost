import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  DatePicker,
  Radio,
  Popconfirm,
  message,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { projectsApi } from '../services/api'
import type { Project, MethodologyType } from '../types'

const { Title } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input

const Projects: React.FC = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsApi.getAll()
      setProjects(response.data)
    } catch (error) {
      message.error('Ошибка загрузки проектов')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProject(null)
    form.resetFields()
    form.setFieldsValue({ methodology: 'waterfall' })
    setModalOpen(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      methodology: project.methodology,
      period: [dayjs(project.start_date), dayjs(project.end_date)],
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await projectsApi.delete(id)
      message.success('Проект удалён')
      loadProjects()
    } catch (error) {
      message.error('Ошибка удаления проекта')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        name: values.name,
        description: values.description,
        methodology: values.methodology as MethodologyType,
        start_date: values.period[0].format('YYYY-MM-DD'),
        end_date: values.period[1].format('YYYY-MM-DD'),
      }

      if (editingProject) {
        await projectsApi.update(editingProject.id, data)
        message.success('Проект обновлён')
      } else {
        await projectsApi.create(data)
        message.success('Проект создан')
      }

      setModalOpen(false)
      loadProjects()
    } catch (error) {
      message.error('Ошибка сохранения проекта')
    }
  }

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <a onClick={() => navigate(`/projects/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Методология',
      dataIndex: 'methodology',
      key: 'methodology',
      render: (methodology: string) => (
        <Tag color={methodology === 'waterfall' ? 'green' : 'blue'}>
          {methodology.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Период',
      key: 'period',
      render: (_: unknown, record: Project) => (
        <span>{record.start_date} — {record.end_date}</span>
      ),
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: Project) => (
        <Space>
          <Button
            icon={<FolderOpenOutlined />}
            onClick={() => navigate(`/projects/${record.id}`)}
          >
            Открыть
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(record)
            }}
          />
          <Popconfirm
            title="Удалить проект?"
            description="Все расчёты проекта будут удалены"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Проекты</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Новый проект
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingProject ? 'Редактировать проект' : 'Новый проект'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingProject ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="Название проекта"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Название проекта" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={3} placeholder="Описание проекта" />
          </Form.Item>

          <Form.Item
            name="methodology"
            label="Методология"
            rules={[{ required: true, message: 'Выберите методологию' }]}
          >
            <Radio.Group>
              <Radio.Button value="waterfall">Waterfall</Radio.Button>
              <Radio.Button value="agile">Agile</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="period"
            label="Период проекта"
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

export default Projects
