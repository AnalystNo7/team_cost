import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Calculations from './pages/Calculations'
import CalculationDetail from './pages/CalculationDetail'
import References from './pages/References'
import Settings from './pages/Settings'

const { Content } = Layout

function App() {
  return (
    <MainLayout>
      <Content className="site-layout-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calculations" element={<Calculations />} />
          <Route path="/calculations/:id" element={<CalculationDetail />} />
          <Route path="/references" element={<References />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Content>
    </MainLayout>
  )
}

export default App
