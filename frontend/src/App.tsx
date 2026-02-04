import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Calculations from './pages/Calculations'
import CalculationDetail from './pages/CalculationDetail'
import Roles from './pages/Roles'
import RateCategories from './pages/RateCategories'
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
          <Route path="/roles" element={<Roles />} />
          <Route path="/rate-categories" element={<RateCategories />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Content>
    </MainLayout>
  )
}

export default App
