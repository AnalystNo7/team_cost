import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import References from './pages/References'
import Settings from './pages/Settings'

const { Content } = Layout

function App() {
  return (
    <MainLayout>
      <Content className="site-layout-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/references" element={<References />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Content>
    </MainLayout>
  )
}

export default App
