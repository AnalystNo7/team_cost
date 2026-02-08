import React, { useEffect, useState } from 'react'
import {
  Card,
  Tabs,
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
import { rolesApi, rateCategoriesApi } from '../services/api'
import type { Role, RateCategory } from '../types'

const References: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roles')

  // Roles state
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [roleForm] = Form.useForm()

  // Rate categories state
  const [categories, setCategories] = useState<RateCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [categoryForm] = Form.useForm()

  useEffect(() => {
    loadRoles()
    loadCategories()
  }, [])

  // ============ Roles ============
  const loadRoles = async () => {
    try {
      setRolesLoading(true)
      const response = await rolesApi.getAll()
      setRoles(response.data)
    } catch (error) {
      message.error('Ошибка загрузки ролей')
    } finally {
      setRolesLoading(false)
    }
  }

  const handleOpenRoleModal = (role?: Role) => {
    if (role) {
      setEditingRoleId(role.id)
      roleForm.setFieldsValue(role)
    } else {
      setEditingRoleId(null)
      roleForm.resetFields()
    }
    setRoleModalOpen(true)
  }

  const handleSubmitRole = async () => {
    try {
      const values = await roleForm.validateFields()
      if (editingRoleId) {
        await rolesApi.update(editingRoleId, values)
        message.success('Роль обновлена')
      } else {
        await rolesApi.create(values)
        message.success('Роль создана')
      }
      setRoleModalOpen(false)
      loadRoles()
    } catch (error) {
      message.error('Ошибка сохранения')
    }
  }

  const handleDeleteRole = async (id: number) => {
    try {
      await rolesApi.delete(id)
      message.success('Роль удалена')
      loadRoles()
    } catch (error) {
      message.error('Ошибка удаления')
    }
  }

  const roleColumns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || '-',
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
      render: (_: unknown, record: Role) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenRoleModal(record)} />
          <Popconfirm
            title="Удалить роль?"
            onConfirm={() => handleDeleteRole(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // ============ Rate Categories ============
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true)
      const response = await rateCategoriesApi.getAll()
      setCategories(response.data)
    } catch (error) {
      message.error('Ошибка загрузки категорий')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleOpenCategoryModal = (category?: RateCategory) => {
    if (category) {
      setEditingCategoryId(category.id)
      categoryForm.setFieldsValue(category)
    } else {
      setEditingCategoryId(null)
      categoryForm.resetFields()
    }
    setCategoryModalOpen(true)
  }

  const handleSubmitCategory = async () => {
    try {
      const values = await categoryForm.validateFields()
      if (editingCategoryId) {
        await rateCategoriesApi.update(editingCategoryId, values)
        message.success('Категория обновлена')
      } else {
        await rateCategoriesApi.create(values)
        message.success('Категория создана')
      }
      setCategoryModalOpen(false)
      loadCategories()
    } catch (error) {
      message.error('Ошибка сохранения')
    }
  }

  const handleDeleteCategory = async (id: number) => {
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

  const categoryColumns = [
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
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenCategoryModal(record)} />
          <Popconfirm
            title="Удалить категорию?"
            onConfirm={() => handleDeleteCategory(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'roles',
      label: 'Проектные роли',
      children: (
        <Card
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenRoleModal()}>
              Добавить роль
            </Button>
          }
        >
          <Table
            columns={roleColumns}
            dataSource={roles}
            rowKey="id"
            loading={rolesLoading}
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'categories',
      label: 'Категории ставок',
      children: (
        <Card
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenCategoryModal()}>
              Добавить категорию
            </Button>
          }
        >
          <Table
            columns={categoryColumns}
            dataSource={categories}
            rowKey="id"
            loading={categoriesLoading}
            pagination={false}
          />
        </Card>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title="Справочники">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* Role Modal */}
      <Modal
        title={editingRoleId ? 'Редактировать роль' : 'Новая роль'}
        open={roleModalOpen}
        onOk={handleSubmitRole}
        onCancel={() => setRoleModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={roleForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="Название роли"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Например: Архитектор" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea placeholder="Описание роли" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal
        title={editingCategoryId ? 'Редактировать категорию' : 'Новая категория'}
        open={categoryModalOpen}
        onOk={handleSubmitCategory}
        onCancel={() => setCategoryModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={categoryForm} layout="vertical" style={{ marginTop: 20 }}>
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

export default References
