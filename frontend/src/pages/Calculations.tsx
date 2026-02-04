import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Popconfirm,
  message,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { calculationsApi } from '../services/api'
import type { Calculation, MethodologyType } from '../types'

const { RangePicker } = DatePicker
const { TextArea } = Input

const Calculations: React.FC = () => {
  const navigate = useNavigate()
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCalculations()
  }, [])

  const loadCalculations = async () => {
    try {
      setLoading(true)
      const response = await calculationsApi.getAll()
      setCalculations(response.data)
    } catch (error) {
      message.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (calculation?: Calculation) => {
    if (calculation) {
      setEditingId(calculation.id)
      form.setFieldsValue({
        ...calculation,
        period: [dayjs(calculation.start_date), dayjs(calculation.end_date)],
      })
    } else {
      setEditingId(null)
      form.resetFields()
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        name: values.name,
        description: values.description,
        methodology: values.methodology,
        start_date: values.period[0].format('YYYY-MM'),
        end_date: values.period[1].format('YYYY-MM'),
      }

      if (editingId) {
        await calculationsApi.update(editingId, data)
        message.success('Расчёт обновлён')
      } else {
        const response = await calculationsApi.create(data)
        message.success('Расчёт создан')
        navigate(`/calculations/${response.data.id}`)
      }

      setModalOpen(false)
      loadCalculations()
    } catch (error) {
      message.error('Ошибка сохранения')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await calculationsApi.delete(id)
      message.success('Расчёт удалён')
      loadCalculations()
    } catch (error) {
      message.error('Ошибка удаления')
    }
  }

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Calculation) => (
        <a onClick={() => navigate(`/calculations/${record.id}`)}>{name}</a>
      ),
    },
    {
      title: 'Методология',
      dataIndex: 'methodology',
      key: 'methodology',
      width: 120,
      render: (m: MethodologyType) => (
        <Tag color={m === 'waterfall' ? 'green' : 'blue'}>{m.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Период',
      key: 'period',
      width: 180,
      render: (_: unknown, record: Calculation) => `${record.start_date} — ${record.end_date}`,
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Calculation) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/calculations/${record.id}`)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Удалить расчёт?"
            description="Все данные будут потеряны"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Расчёты стоимости"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Новый расчёт
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={calculations}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingId ? 'Редактировать расчёт' : 'Новый расчёт'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="Название проекта"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Например: Внедрение CRM системы" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={3} placeholder="Краткое описание проекта" />
          </Form.Item>

          <Form.Item
            name="methodology"
            label="Методология"
            rules={[{ required: true, message: 'Выберите методологию' }]}
          >
            <Select
              options={[
                { value: 'waterfall', label: 'Waterfall (Каскадная)' },
                { value: 'agile', label: 'Agile (Гибкая)' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="period"
            label="Период проекта"
            rules={[{ required: true, message: 'Укажите период' }]}
          >
            <RangePicker picker="month" style={{ width: '100%' }} format="YYYY-MM" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Calculations
