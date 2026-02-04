import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { rolesApi } from '../services/api'
import type { Role } from '../types'

const { TextArea } = Input

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await rolesApi.getAll()
      setRoles(response.data)
    } catch (error) {
      message.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingId(role.id)
      form.setFieldsValue(role)
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
        await rolesApi.update(editingId, values)
        message.success('Роль обновлена')
      } else {
        await rolesApi.create(values)
        message.success('Роль создана')
      }

      setModalOpen(false)
      loadRoles()
    } catch (error) {
      message.error('Ошибка сохранения')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await rolesApi.delete(id)
      message.success('Роль удалена')
      loadRoles()
    } catch (error) {
      message.error('Ошибка удаления')
    }
  }

  const columns = [
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
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Удалить роль?"
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
        title="Справочник проектных ролей"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Добавить роль
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      <Modal
        title={editingId ? 'Редактировать роль' : 'Новая роль'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="Название роли"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Например: Разработчик (Backend)" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={3} placeholder="Описание роли и обязанностей" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Roles
