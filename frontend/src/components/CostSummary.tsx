import React from 'react'
import { Card, Row, Col, Statistic, Table, Tabs } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import type { CostCalculationResult } from '../types'

interface CostSummaryProps {
  result: CostCalculationResult
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)

const CostSummary: React.FC<CostSummaryProps> = ({ result }) => {
  const stageColumns = [
    { title: 'Этап', dataIndex: 'stage_name', key: 'name' },
    { title: 'Период', key: 'period', render: (_: unknown, r: typeof result.stages[0]) => `${r.start_month} — ${r.end_month}` },
    { title: 'Себестоимость', dataIndex: 'total_cost', key: 'cost', render: (v: number) => formatCurrency(v) },
    { title: 'Выручка', dataIndex: 'total_revenue', key: 'revenue', render: (v: number) => formatCurrency(v) },
    { title: 'Маржа', dataIndex: 'total_margin', key: 'margin', render: (v: number) => formatCurrency(v) },
    { title: 'Маржа %', dataIndex: 'margin_percent', key: 'margin_pct', render: (v: number | null) => v ? `${v.toFixed(1)}%` : '-' },
  ]

  const roleData = Object.entries(result.cost_by_role).map(([role, cost]) => ({
    key: role,
    role,
    cost,
  }))

  const roleColumns = [
    { title: 'Роль', dataIndex: 'role', key: 'role' },
    { title: 'Себестоимость', dataIndex: 'cost', key: 'cost', render: (v: number) => formatCurrency(v) },
  ]

  const monthData = Object.keys(result.cost_by_month).map(month => ({
    key: month,
    month,
    cost: result.cost_by_month[month],
    revenue: result.revenue_by_month[month] || 0,
    margin: (result.revenue_by_month[month] || 0) - result.cost_by_month[month],
  }))

  const monthColumns = [
    { title: 'Месяц', dataIndex: 'month', key: 'month' },
    { title: 'Себестоимость', dataIndex: 'cost', key: 'cost', render: (v: number) => formatCurrency(v) },
    { title: 'Выручка', dataIndex: 'revenue', key: 'revenue', render: (v: number) => formatCurrency(v) },
    { title: 'Маржа', dataIndex: 'margin', key: 'margin', render: (v: number) => formatCurrency(v) },
  ]

  const marginColor = result.total_margin >= 0 ? '#3f8600' : '#cf1322'
  const marginIcon = result.total_margin >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />

  return (
    <Card title="Итоги расчёта">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <Statistic
              title="Общая себестоимость"
              value={result.total_cost}
              precision={0}
              suffix="₽"
              formatter={v => formatCurrency(Number(v))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <Statistic
              title="Внутренние ресурсы"
              value={result.total_internal_cost}
              precision={0}
              suffix="₽"
              formatter={v => formatCurrency(Number(v))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <Statistic
              title="Внешние ресурсы"
              value={result.total_external_cost}
              precision={0}
              suffix="₽"
              formatter={v => formatCurrency(Number(v))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <Statistic
              title="Общая выручка"
              value={result.total_revenue}
              precision={0}
              suffix="₽"
              valueStyle={{ color: '#1890ff' }}
              formatter={v => formatCurrency(Number(v))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <Statistic
              title="Маржа"
              value={result.total_margin}
              precision={0}
              suffix="₽"
              valueStyle={{ color: marginColor }}
              prefix={marginIcon}
              formatter={v => formatCurrency(Number(v))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <Statistic
              title="Маржинальность"
              value={result.margin_percent || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: marginColor }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        style={{ marginTop: 24 }}
        items={[
          {
            key: 'stages',
            label: 'По этапам',
            children: (
              <Table
                columns={stageColumns}
                dataSource={result.stages}
                rowKey="stage_id"
                pagination={false}
                size="small"
              />
            ),
          },
          {
            key: 'roles',
            label: 'По ролям',
            children: (
              <Table
                columns={roleColumns}
                dataSource={roleData}
                rowKey="role"
                pagination={false}
                size="small"
              />
            ),
          },
          {
            key: 'months',
            label: 'По месяцам',
            children: (
              <Table
                columns={monthColumns}
                dataSource={monthData}
                rowKey="month"
                pagination={false}
                size="small"
              />
            ),
          },
        ]}
      />
    </Card>
  )
}

export default CostSummary
