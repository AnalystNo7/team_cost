import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, List, Button, Typography, Empty } from 'antd'
import {
  CalculatorOutlined,
  PlusOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import { calculationsApi } from '../services/api'
import type { Calculation } from '../types'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalculations()
  }, [])

  const loadCalculations = async () => {
    try {
      const response = await calculationsApi.getAll()
      setCalculations(response.data)
    } catch (error) {
      console.error('Failed to load calculations:', error)
    } finally {
      setLoading(false)
    }
  }

  const recentCalculations = calculations.slice(0, 5)

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Калькулятор стоимости проектной команды</Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Расчёт экономической эффективности проекта с учётом налогового законодательства РФ
      </Text>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Всего расчётов"
              value={calculations.length}
              prefix={<CalculatorOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Waterfall"
              value={calculations.filter(c => c.methodology === 'waterfall').length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Agile"
              value={calculations.filter(c => c.methodology === 'agile').length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => navigate('/calculations')}
          >
            <Button type="primary" size="large" icon={<PlusOutlined />}>
              Новый расчёт
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title="Последние расчёты"
            extra={
              <Button type="link" onClick={() => navigate('/calculations')}>
                Все расчёты
              </Button>
            }
          >
            {recentCalculations.length > 0 ? (
              <List
                dataSource={recentCalculations}
                renderItem={item => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/calculations/${item.id}`)}
                    actions={[
                      <Text type="secondary" key="date">
                        {new Date(item.created_at).toLocaleDateString('ru-RU')}
                      </Text>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FolderOpenOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={item.name}
                      description={
                        <span>
                          {item.methodology.toUpperCase()} | {item.start_date} — {item.end_date}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Нет расчётов" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Быстрый старт">
            <List>
              <List.Item>
                <Text>1. Создайте новый расчёт</Text>
              </List.Item>
              <List.Item>
                <Text>2. Выберите методологию (Waterfall/Agile)</Text>
              </List.Item>
              <List.Item>
                <Text>3. Укажите период проекта</Text>
              </List.Item>
              <List.Item>
                <Text>4. Добавьте этапы и участников команды</Text>
              </List.Item>
              <List.Item>
                <Text>5. Заполните FTE загрузку по месяцам</Text>
              </List.Item>
              <List.Item>
                <Text>6. Получите расчёт себестоимости и маржи</Text>
              </List.Item>
            </List>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
