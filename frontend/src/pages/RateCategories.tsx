import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { rateCategoriesApi } from '../services/api'
import type { RateCategory } from '../types'

const RateCategories: React.FC = () => {
  const [categories, setCategories] = useState<RateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await rateCategoriesApi.getAll()
      setCategories(response.data)
    } catch (error) {
      message.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category?: RateCategory) => {
    if (category) {
      setEditingId(category.id)
      form.setFieldsValue(category)
    } else {
      setEditingId(null)
      form.resetFields()
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingId) {
        await rateCategoriesApi.update(editingId, values)
        message.success('Категория обновлена')
      } else {
        await rateCategoriesApi.create(values)
        message.success('Категория создана')
      }

      setModalOpen(false)
      loadCategories()
    } catch (error) {
      message.error('Ошибка сохранения')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await rateCategoriesApi.delete(id)
      message.success('Категория удалена')
      loadCategories()
    } catch (error) {
      message.error('Ошибка удаления')
    }
  }

  const formatRate = (rate: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(rate) + '/час'

  const columns = [
    {
      title: 'Код',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => name || '-',
    },
    {
      title: 'Часовая ставка',
      dataIndex: 'hourly_rate',
      key: 'hourly_rate',
      render: (rate: number) => formatRate(rate),
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Активна' : 'Неактивна'}</Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: RateCategory) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Удалить категорию?"
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
        title="Справочник категорий ставок (внешние ставки)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Добавить категорию
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingId ? 'Редактировать категорию' : 'Новая категория'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="code"
            label="Код категории"
            rules={[{ required: true, message: 'Введите код' }]}
          >
            <Input placeholder="Например: K7" style={{ width: 100 }} />
          </Form.Item>

          <Form.Item name="name" label="Название">
            <Input placeholder="Описательное название" />
          </Form.Item>

          <Form.Item
            name="hourly_rate"
            label="Часовая ставка (₽)"
            rules={[{ required: true, message: 'Введите ставку' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              parser={v => Number(v?.replace(/\s/g, '') || 0) as unknown as 0}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RateCategories
