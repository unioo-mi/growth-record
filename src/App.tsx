import { Link, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ScrollToTop } from './components/ScrollToTop'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { NewRecordPage } from './pages/NewRecordPage'
import { RecordDetailPage } from './pages/RecordDetailPage'
import { RecordEditorPage } from './pages/RecordEditorPage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'

function NotFoundPage() {
  return (
    <div className="page narrow-page">
      <div className="empty-state">
        <h1>这一页走丢了</h1>
        <p>返回首页，继续记录今天的成长。</p>
        <Link to="/" className="primary-button">返回首页</Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="questions" element={<LibraryPage type="question" />} />
          <Route path="knowledge" element={<LibraryPage type="knowledge" />} />
          <Route path="tools" element={<LibraryPage type="tool" />} />
          <Route path="projects" element={<LibraryPage type="project" />} />
          <Route path="new" element={<NewRecordPage />} />
          <Route path="new/:type" element={<RecordEditorPage />} />
          <Route path="record/:id" element={<RecordDetailPage />} />
          <Route path="record/:id/edit" element={<RecordEditorPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
