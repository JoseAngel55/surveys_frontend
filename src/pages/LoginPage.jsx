import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'ERROR: AUTHENTICATION FAILED')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '2rem', fontFamily: "'Share Tech Mono', monospace" }}>
      <div style={{ width: '100%', maxWidth: '400px' }} className="fade-in">

        {/* Header */}
        <div style={{ borderBottom: '3px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            [ SYSTEM ACCESS TERMINAL ]
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: '48px', lineHeight: 1, letterSpacing: '0.05em' }}>
            SURVEYAPP
          </div>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', marginTop: '4px' }}>
            EVALUATION & SURVEY SYSTEM v1.0
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', marginBottom: '20px', gap: 0 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '8px', border: '1.5px solid #000', background: mode === m ? '#000' : '#fff',
                color: mode === m ? '#fff' : '#000', fontFamily: "'Share Tech Mono', monospace",
                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                marginLeft: m === 'register' ? '-1.5px' : 0 }}>
              {m === 'login' ? '→ LOGIN' : '→ REGISTER'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'register' && (
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', color: '#555' }}>// DISPLAY NAME</div>
              <input className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ENTER NAME..." required />
            </div>
          )}
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', color: '#555' }}>// EMAIL ADDRESS</div>
            <input className="input" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="USER@DOMAIN.COM" required />
          </div>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', color: '#555' }}>// PASSWORD</div>
            <input className="input" type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••••••" required minLength={6} />
          </div>

          {error && (
            <div style={{ border: '1.5px solid #000', padding: '8px 12px', background: '#000', color: '#fff', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ⚠ {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ marginTop: '8px', justifyContent: 'center', fontSize: '13px', padding: '10px' }}>
            {loading ? '[ PROCESSING... ]' : `[ ${mode === 'login' ? 'AUTHENTICATE' : 'CREATE ACCOUNT'} ]`}
            {loading && <span className="blink">_</span>}
          </button>
        </form>

        {/* Footer tip */}
        <div style={{ marginTop: '24px', border: '1.5px dashed #bbb', padding: '10px 12px', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          SYSTEM TIP: USE CTRL+SHIFT+P TO ACCESS ALL FEATURES VIA THE COMMAND PALETTE.
        </div>
      </div>
    </div>
  )
}
