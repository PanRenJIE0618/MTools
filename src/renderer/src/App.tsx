import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import HomePage from './pages/HomePage'
import ToolHostPage from './pages/ToolHostPage'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tools/:toolId" element={<ToolHostPage />} />
      </Route>
    </Routes>
  )
}

export default App
