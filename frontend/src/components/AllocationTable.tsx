import React, { useState } from 'react'
import {
  Table,
  InputNumber,
  Select,
  Button,
  Space,
  Popconfirm,
  Input,
  message,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { StageAllocation, Role, RateCategory, MonthlyFTE, WorkCalendarEntry } from '../types'

interface AllocationTableProps {
  allocations: StageAllocation[]
  roles: Role[]
  rateCategories: RateCategory[]
  months: WorkCalendarEntry[]
  onAdd: (allocation: Partial<StageAllocation>) => void
  onUpdate: (id: number, data: Partial<StageAllocation>) => void
  onDelete: (id: number) => void
}

const AllocationTable: React.FC<AllocationTableProps> = ({
  allocations,
  roles,
  rateCategories,
  months,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [newAllocation, setNewAllocation] = useState<Partial<StageAllocation>>({
    resource_type: 'internal',
    monthly_fte: [],
  })

  const handleAddAllocation = () => {
    if (!newAllocation.role_id) {
      message.error('Выберите роль')
      return
    }

    // Initialize monthly FTE for all months
    const monthlyFte: MonthlyFTE[] = months.map(m => ({
      year_month: m.year_month,
      fte_value: 0,
    }))

    onAdd({
      ...newAllocation,
      monthly_fte: monthlyFte,
    })

    setNewAllocation({
      resource_type: 'internal',
      monthly_fte: [],
    })
  }

  const handleFteChange = (allocation: StageAllocation, yearMonth: string, value: number | null) => {
    const existingFte = allocation.monthly_fte || []
    const found = existingFte.find(f => f.year_month === yearMonth)

    let updatedFte
    if (found) {
      updatedFte = existingFte.map(f =>
        f.year_month === yearMonth ? { ...f, fte_value: value || 0 } : f
      )
    } else {
      updatedFte = [...existingFte, { year_month: yearMonth, fte_value: value || 0 }]
    }
    onUpdate(allocation.id!, { monthly_fte: updatedFte })
  }

  const columns = [
    {
      title: 'Роль',
      dataIndex: 'role_id',
      key: 'role',
      width: 180,
      render: (roleId: number) => {
        const role = roles.find(r => r.id === roleId)
        return role?.name || '-'
      },
    },
    {
      title: 'Тип',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 100,
      render: (type: string) => (type === 'internal' ? 'Внутр.' : 'Внешн.'),
    },
    {
      title: 'Категория',
      dataIndex: 'rate_category_id',
      key: 'rate_category',
      width: 80,
      render: (catId: number, record: StageAllocation) => (
        <Select
          size="small"
          style={{ width: 70 }}
          value={catId}
          onChange={value => onUpdate(record.id!, { rate_category_id: value })}
          options={rateCategories.map(c => ({ value: c.id, label: c.code }))}
        />
      ),
    },
    {
      title: 'ЗП (мес)',
      dataIndex: 'monthly_salary',
      key: 'salary',
      width: 110,
      render: (salary: number, record: StageAllocation) =>
        record.resource_type === 'internal' ? (
          <InputNumber
            size="small"
            style={{ width: 100 }}
            value={salary}
            min={0}
            step={10000}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            parser={v => Number(v?.replace(/\s/g, '') || 0)}
            onChange={value => onUpdate(record.id!, { monthly_salary: value || 0 })}
          />
        ) : (
          '-'
        ),
    },
    {
      title: 'Премия %',
      dataIndex: 'bonus_percent',
      key: 'bonus',
      width: 80,
      render: (bonus: number, record: StageAllocation) =>
        record.resource_type === 'internal' ? (
          <InputNumber
            size="small"
            style={{ width: 60 }}
            value={bonus}
            min={0}
            max={100}
            onChange={value => onUpdate(record.id!, { bonus_percent: value || 0 })}
          />
        ) : (
          '-'
        ),
    },
    // Monthly FTE columns
    ...months.map(month => ({
      title: <div className="month-header">{month.year_month.slice(5)}</div>,
      key: month.year_month,
      width: 60,
      render: (_: unknown, record: StageAllocation) => {
        const fte = record.monthly_fte.find(f => f.year_month === month.year_month)
        return (
          <InputNumber
            size="small"
            className="fte-input"
            value={fte?.fte_value || 0}
            min={0}
            max={1}
            step={0.1}
            onChange={value => handleFteChange(record, month.year_month, value)}
          />
        )
      },
    })),
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: StageAllocation) => (
        <Popconfirm
          title="Удалить участника?"
          onConfirm={() => onDelete(record.id!)}
          okText="Да"
          cancelText="Нет"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 200 }}
          placeholder="Выберите роль"
          value={newAllocation.role_id}
          onChange={value => setNewAllocation({ ...newAllocation, role_id: value })}
          options={roles.map(r => ({ value: r.id, label: r.name }))}
        />
        <Select
          style={{ width: 120 }}
          value={newAllocation.resource_type}
          onChange={value => setNewAllocation({ ...newAllocation, resource_type: value })}
          options={[
            { value: 'internal', label: 'Внутренний' },
            { value: 'external', label: 'Внешний' },
          ]}
        />
        <Input
          style={{ width: 150 }}
          placeholder="ФИО (опционально)"
          value={newAllocation.employee_name}
          onChange={e => setNewAllocation({ ...newAllocation, employee_name: e.target.value })}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAllocation}>
          Добавить
        </Button>
      </Space>

      <Table
        className="allocation-table"
        columns={columns}
        dataSource={allocations}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default AllocationTable
