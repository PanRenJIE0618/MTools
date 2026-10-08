import { Outlet } from 'react-router-dom'
import { CategoryProvider } from '../lib/categoryContext'
import Sidebar from './Sidebar'
import Toast from './Toast'

export default function AppShell(): React.JSX.Element {
  return (
    <CategoryProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="app-shell__main">
          <Outlet />
        </div>
        <Toast />
      </div>
    </CategoryProvider>
  )
}
