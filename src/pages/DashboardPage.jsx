import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { surveysApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

const STATUS_TAG = {
  draft:    { label: 'DRAFT',    style: { borderStyle: 'dashed', color: '#888' } },
  active:   { label: 'ACTIVE',   style: { background: '#000', color: '#fff' } },
  closed:   { label: 'CLOSED',   style: { background: '#ddd', color: '#555' } },
  archived: { label: 'ARCHIVED', style: { color: '#aaa' } },
}

const FILTERS = ['ALL', 'DRAFT', 'ACTIVE', 'CLOSED']

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => { fetchSurveys() }, [])

  const fetchSurveys = async () => {
    setLoading(true)
    try {
      const { data } = await surveysApi.list({ limit: 50 })
      setSurveys(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('[ CONFIRM: DELETE SURVEY? ]')) return
    await surveysApi.delete(id)
    setSurveys(s => s.filter(x => x.id !== id))
  }

  const handleDuplicate = async (id) => {
    await surveysApi.duplicate(id)
    fetchSurveys()
  }

  const filtered = surveys.filter(s => filter === 'ALL' || s.status.toUpperCase() === filter)

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Share Tech Mono', monospace" }}>

      {/* ── TOPBAR ── */}
      <div style={{ borderBottom: '2px solid #000', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: '24px', letterSpacing: '0.05em' }}>SURVEYAPP</div>
          <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>/ DASHBOARD</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ border: '1.5px solid #000', padding: '4px 10px', fontSize: '11px', textTransform: 'uppercase', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#888' }}>USER:</span>
            <span>{user?.name?.toUpperCase() || 'UNKNOWN'}</span>
          </div>
          <button className="btn" onClick={logout} style={{ fontSize: '10px', padding: '4px 10px' }}>[ LOGOUT ]</button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>

        {/* ── STATS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', marginBottom: '20px', border: '1.5px solid #000' }}>
          {[
            { val: surveys.length, label: 'TOTAL SURVEYS' },
            { val: surveys.filter(s => s.status === 'active').length, label: 'ACTIVE' },
            { val: surveys.filter(s => s.status === 'draft').length, label: 'DRAFTS' },
            { val: surveys.filter(s => s.status === 'closed').length, label: 'CLOSED' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px', textAlign: 'center', borderRight: i < 3 ? '1.5px solid #000' : 'none' }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: '40px', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── COMBAT LOG HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div className="section-label" style={{ marginBottom: 0 }}>SURVEY LOG</div>
          <button className="btn btn-primary" onClick={() => navigate('/surveys/new')} style={{ fontSize: '11px' }}>
            + CREATE NEW SURVEY
          </button>
        </div>

        {/* ── FILTERS ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '12px' }}>
          {FILTERS.map((f, i) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '5px 14px', border: '1.5px solid #000', marginLeft: i > 0 ? '-1.5px' : 0,
                background: filter === f ? '#000' : '#fff', color: filter === f ? '#fff' : '#000',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', textTransform: 'uppercase',
                letterSpacing: '0.1em', cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>

        {/* ── SURVEY LIST ── */}
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '12px', textTransform: 'uppercase', border: '1.5px dashed #ccc' }}>
            [ LOADING... ]<span className="blink">_</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="box-dashed" style={{ padding: '32px', textAlign: 'center', color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>
            NO SURVEYS FOUND. CREATE YOUR FIRST ONE.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filtered.map((survey, idx) => {
              const st = STATUS_TAG[survey.status] || STATUS_TAG.draft
              return (
                <div key={survey.id} className="fade-in" style={{ border: '1.5px solid #000', marginTop: idx > 0 ? '-1.5px' : 0, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* Left */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '0.03em' }}>
                          {survey.title.toUpperCase()}
                        </span>
                        <span style={{ border: '1.5px solid #000', padding: '1px 8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', ...st.style }}>
                          {st.label}
                        </span>
                        <span style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase' }}>{survey.type}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {survey.description || '// NO DESCRIPTION'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase' }}>
                        CREATED: {new Date(survey.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                      </div>
                    </div>
                    {/* Right — timestamp like combat log */}
                    <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', whiteSpace: 'nowrap', paddingTop: '4px' }}>
                      {(() => {
                        const diff = Date.now() - new Date(survey.updated_at || survey.created_at)
                        const h = Math.floor(diff / 3600000)
                        if (h < 1) return 'JUST NOW'
                        if (h < 24) return `${h}H AGO`
                        return `${Math.floor(h / 24)}D AGO`
                      })()}
                    </div>
                  </div>

                  {/* Public link row */}
                  {survey.public_token && (
                    <div style={{ border: '1.5px dashed #888', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fafafa' }}>
                      <span style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase' }}>LINK:</span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }}>
                        {window.location.origin}/s/{survey.public_token}
                      </span>
                      <button className="btn" style={{ padding: '2px 8px', fontSize: '10px' }}
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${survey.public_token}`); alert('COPIED TO CLIPBOARD') }}>
                        [COPY]
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                    {[
                      { label: 'EDIT', action: () => navigate(`/surveys/${survey.id}/edit`) },
                      { label: 'REPORTS', action: () => navigate(`/surveys/${survey.id}/report`) },
                      { label: 'DUPLICATE', action: () => handleDuplicate(survey.id) },
                      { label: 'DELETE', action: () => handleDelete(survey.id) },
                    ].map((a, i) => (
                      <button key={a.label} onClick={a.action}
                        style={{ padding: '4px 12px', border: '1px solid #000', marginLeft: i > 0 ? '-1px' : 0,
                          background: '#fff', color: '#000', fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}
                        onMouseEnter={e => { e.target.style.background = '#000'; e.target.style.color = '#fff' }}
                        onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}>
                        → {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── COMMANDER TIP ── */}
        <div style={{ marginTop: '20px', border: '1.5px dashed #bbb', padding: '10px 14px', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          COMMANDER'S TIP:<br />
          PUBLISH A SURVEY TO GENERATE A UNIQUE PUBLIC LINK. SHARE IT WITH ANYONE TO COLLECT RESPONSES.
        </div>
      </div>
    </div>
  )
}
