import React from 'react'
import { Card, Descriptions, Typography, Table, Tag } from 'antd'

const { Title, Paragraph } = Typography

const Settings: React.FC = () => {
  const taxRates = [
    { name: 'ПФР (Пенсионный фонд)', rate: '22%', note: 'До предельной базы 2 225 000 ₽' },
    { name: 'ПФР (сверх предельной базы)', rate: '10%', note: 'Свыше 2 225 000 ₽' },
    { name: 'ФСС (Фонд соц. страхования)', rate: '2.9%', note: 'До предельной базы' },
    { name: 'ФОМС (Мед. страхование)', rate: '5.1%', note: 'Без ограничений' },
    { name: 'Итого страховые взносы', rate: '30.2%', note: 'Стандартная ставка' },
  ]

  const ndflRates = [
    { threshold: 'До 2 400 000 ₽', rate: '13%' },
    { threshold: 'От 2 400 000 до 5 000 000 ₽', rate: '15%' },
    { threshold: 'От 5 000 000 до 20 000 000 ₽', rate: '18%' },
    { threshold: 'От 20 000 000 до 50 000 000 ₽', rate: '20%' },
    { threshold: 'Свыше 50 000 000 ₽', rate: '22%' },
  ]

  const calendarData = [
    { year: 2024, total_days: 247, total_hours: 1976 },
    { year: 2025, total_days: 247, total_hours: 1976 },
    { year: 2026, total_days: 247, total_hours: 1976 },
    { year: 2027, total_days: 247, total_hours: 1976 },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Настройки и справочная информация</Title>

      <Card title="Ставки страховых взносов (2024)" style={{ marginBottom: 24 }}>
        <Table
          dataSource={taxRates}
          columns={[
            { title: 'Вид взноса', dataIndex: 'name', key: 'name' },
            { title: 'Ставка', dataIndex: 'rate', key: 'rate', render: (r: string) => <Tag color="blue">{r}</Tag> },
            { title: 'Примечание', dataIndex: 'note', key: 'note' },
          ]}
          rowKey="name"
          pagination={false}
          size="small"
        />
        <Paragraph type="secondary" style={{ marginTop: 16 }}>
          Расчёт себестоимости: Себестоимость = (ЗП + Премия) × (1 + 0.302)
        </Paragraph>
      </Card>

      <Card title="Прогрессивная шкала НДФЛ (2024)" style={{ marginBottom: 24 }}>
        <Table
          dataSource={ndflRates}
          columns={[
            { title: 'Годовой доход', dataIndex: 'threshold', key: 'threshold' },
            { title: 'Ставка НДФЛ', dataIndex: 'rate', key: 'rate', render: (r: string) => <Tag color="green">{r}</Tag> },
          ]}
          rowKey="threshold"
          pagination={false}
          size="small"
        />
        <Paragraph type="secondary" style={{ marginTop: 16 }}>
          НДФЛ не влияет на себестоимость работодателя, но учитывается для информации.
        </Paragraph>
      </Card>

      <Card title="Производственный календарь РФ" style={{ marginBottom: 24 }}>
        <Table
          dataSource={calendarData}
          columns={[
            { title: 'Год', dataIndex: 'year', key: 'year' },
            { title: 'Рабочих дней', dataIndex: 'total_days', key: 'days' },
            { title: 'Рабочих часов', dataIndex: 'total_hours', key: 'hours' },
          ]}
          rowKey="year"
          pagination={false}
          size="small"
        />
        <Paragraph type="secondary" style={{ marginTop: 16 }}>
          Данные производственного календаря используются для расчёта FTE загрузки.
          1 FTE = Рабочие дни в месяце × 8 часов.
        </Paragraph>
      </Card>

      <Card title="Формулы расчёта">
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Себестоимость (внутр. ресурс)">
            (ЗП_месяц + Премия_месяц) × 1.302 × FTE
          </Descriptions.Item>
          <Descriptions.Item label="Премия в месяц">
            (ЗП_год × %_премии) / 12
          </Descriptions.Item>
          <Descriptions.Item label="Выручка">
            Часовая_ставка × Раб_часы_месяца × FTE
          </Descriptions.Item>
          <Descriptions.Item label="Маржа">
            Выручка − Себестоимость
          </Descriptions.Item>
          <Descriptions.Item label="Маржинальность">
            (Маржа / Выручка) × 100%
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default Settings
