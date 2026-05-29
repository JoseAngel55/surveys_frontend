import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' }
})

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken })
          localStorage.setItem('token', data.token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
}

// ── Surveys ──
export const surveysApi = {
  list: (params) => api.get('/surveys', { params }),
  create: (data) => api.post('/surveys', data),
  get: (id) => api.get(`/surveys/${id}`),
  update: (id, data) => api.put(`/surveys/${id}`, data),
  delete: (id) => api.delete(`/surveys/${id}`),
  publish: (id) => api.post(`/surveys/${id}/publish`),
  close: (id) => api.post(`/surveys/${id}/close`),
  duplicate: (id) => api.post(`/surveys/${id}/duplicate`),
  // Questions
  getQuestions: (id) => api.get(`/surveys/${id}/questions`),
  addQuestion: (id, data) => api.post(`/surveys/${id}/questions`, data),
  updateQuestion: (sid, qid, data) => api.put(`/surveys/${sid}/questions/${qid}`, data),
  deleteQuestion: (sid, qid) => api.delete(`/surveys/${sid}/questions/${qid}`),
  reorderQuestions: (id, order) => api.patch(`/surveys/${id}/questions/reorder`, { order }),
  // Responses & Reports
  getResponses: (id) => api.get(`/surveys/${id}/responses`),
  getReport: (id) => api.get(`/surveys/${id}/reports`),
  // Exports — usa fetch con blob porque axios no maneja bien streams de archivo
  exportPDF: async (id) => {
    const token = localStorage.getItem('token')
    const base  = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const res   = await fetch(`${base}/surveys/${id}/export/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Error al generar PDF')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `reporte-${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
  exportExcel: async (id) => {
    const token = localStorage.getItem('token')
    const base  = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const res   = await fetch(`${base}/surveys/${id}/export/excel`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Error al generar Excel')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `reporte-${id}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  },
}

// ── Public ──
export const publicApi = {
  getSurvey: (token) => api.get(`/public/surveys/${token}`),
  respond: (token, data) => api.post(`/public/surveys/${token}/respond`, data),
}