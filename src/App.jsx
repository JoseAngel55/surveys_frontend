import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SurveyBuilderPage from './pages/SurveyBuilderPage'
import ReportPage from './pages/ReportPage'
import PublicSurveyPage from './pages/PublicSurveyPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>Cargando...</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Public survey route — no auth required */}
          <Route path="/s/:token" element={<PublicSurveyPage />} />
          {/* Protected routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/surveys/new" element={<PrivateRoute><SurveyBuilderPage /></PrivateRoute>} />
          <Route path="/surveys/:surveyId/edit" element={<PrivateRoute><SurveyBuilderPage /></PrivateRoute>} />
          <Route path="/surveys/:surveyId/report" element={<PrivateRoute><ReportPage /></PrivateRoute>} />
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
