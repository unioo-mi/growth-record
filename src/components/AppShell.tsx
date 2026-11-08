import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  CircleHelp,
  FolderKanban,
  Home,
  Network,
  Plus,
  Search,
  Settings,
  Sprout,
  Wrench,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/questions', label: '问题', icon: CircleHelp },
  { to: '/knowledge', label: '知识', icon: Network },
  { to: '/tools', label: '工具', icon: Wrench },
  { to: '/projects', label: '项目', icon: FolderKanban },
]

export function AppShell() {
  const location = useLocation()
  const isCreating = location.pathname.startsWith('/new') || location.pathname.endsWith('/edit')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="返回成长首页">
          <span className="brand-mark">
            <Sprout size={23} strokeWidth={1.8} />
          </span>
          <span>
            <strong>小小足迹</strong>
            <small>孩子课外实践成长记录</small>
          </span>
        </Link>

        <nav className="side-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `side-nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-actions">
          <Link to="/search" className="sidebar-search">
            <Search size={17} />
            <span>搜索全部记录</span>
          </Link>
          <Link to="/new" className="primary-button sidebar-add">
            <Plus size={18} />
            <span>记录新发现</span>
          </Link>
          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-settings${isActive ? ' active' : ''}`}
          >
            <Settings size={17} />
            <span>设置与备份</span>
          </NavLink>
        </div>
      </aside>

      <header className="mobile-header">
        <Link to="/" className="mobile-brand">
          <span className="brand-mark">
            <Sprout size={20} strokeWidth={1.8} />
          </span>
          <strong>小小足迹</strong>
        </Link>
        <div className="mobile-header-actions">
          <Link to="/search" className="icon-button" aria-label="搜索">
            <Search size={20} />
          </Link>
          <Link to="/settings" className="icon-button" aria-label="设置">
            <Settings size={20} />
          </Link>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      {!isCreating && (
        <Link to="/new" className="mobile-fab" aria-label="新建记录">
          <Plus size={24} />
        </Link>
      )}

      <nav className="mobile-nav" aria-label="移动端主导航">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

