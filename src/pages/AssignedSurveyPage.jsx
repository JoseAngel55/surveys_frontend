import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

const assignedApi = {
  getSurvey: (token) => api.get(`/public/a/${token}`),
  respond: (token, data) => api.post(`/public/a/${token}/respond`, data),
}

export default function AssignedSurveyPage() {
  const { token } = useParams()
  const [survey, setSurvey] = useState(null)
  const [answers, setAnswers] = useState({})
  const [respondentName, setRespondentName] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
  const [step, setStep] = useState('loading') // loading | form | done | error | expired | completed
  const [errorMsg, setErrorMsg] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState('')
  const [startedAt] = useState(() => new Date().toISOString())
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => { loadSurvey() }, [token])

  useEffect(() => {
    if (timeLeft === null || step !== 'form') return
    if (timeLeft <= 0) { setStep('expired'); return }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, step])

  const loadSurvey = async () => {
    try {
      const { data } = await assignedApi.getSurvey(token)
      setSurvey(data)
      if (data.respondent?.name) setRespondentName(data.respondent.name)
      if (data.respondent?.email) setRespondentEmail(data.respondent.email)
      if (data.settings.time_limit_minutes) {
        setTimeLeft(data.settings.time_limit_minutes * 60)
      }
      setStep('form')
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'ALREADY_COMPLETED') return setStep('completed')
      if (code === 'EXPIRED' || code === 'SURVEY_CLOSED') {
        setErrorMsg(err.response?.data?.message || 'Esta encuesta ya no está disponible')
        return setStep('expired')
      }
      setErrorMsg(err.response?.data?.message || 'Encuesta no encontrada')
      setStep('error')
    }
  }

  const setAnswer = (qid, value) => {
    setAnswers(a => ({ ...a, [qid]: value }))
    setErrors(e => ({ ...e, [qid]: null }))
  }

  const toggleOption = (qid, val) => {
    const current = answers[qid] || []
    setAnswer(qid, current.includes(val) ? current.filter(v => v !== val) : [...current, val])
  }

  const validate = () => {
    const errs = {}
    if (!survey.settings.allow_anonymous) {
      if (!respondentName.trim()) errs._name = 'REQUIRED'
      if (!respondentEmail.trim()) errs._email = 'REQUIRED'
    }
    survey.questions.forEach(q => {
      if (q.required) {
        const ans = answers[q.id]
        if (!ans || (Array.isArray(ans) && ans.length === 0)) errs[q.id] = '// CAMPO REQUERIDO'
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = async () => {
    if (timeLeft !== null && timeLeft <= 0) return
    if (!validate()) return
    setSubmitting(true)
    try {
      const answerList = Object.entries(answers).map(([question_id, value]) => ({ question_id, value }))
      const { data } = await assignedApi.respond(token, {
        respondent_name: respondentName || null,
        respondent_email: respondentEmail || null,
        started_at: startedAt,
        answers: answerList
      })
      setConfirmMsg(data.message)
      setStep('done')
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'ALREADY_COMPLETED') return setStep('completed')
      if (code === 'TIME_EXPIRED') return setStep('expired')
      alert('ERROR: ' + (err.response?.data?.message || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const Term = ({ children }) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', fontFamily: "'Share Tech Mono', monospace", padding: '2rem' }}>
      <div style={{ border: '1.5px solid #000', padding: '32px 40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>{children}</div>
    </div>
  )

  if (step === 'loading') return (
    <Term>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: '32px' }}>CARGANDO<span className="blink">_</span></div>
    </Term>
  )

  if (step === 'error') return (
    <Term>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: '36px', marginBottom: '12px' }}>[ ERROR ]</div>
      <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', marginBottom: '16px' }}>{errorMsg}</div>
    </Term>
  )

  if (step === 'completed') return (
    <Term>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: '48px', marginBottom: '8px', color: '#000' }}>[ ✓ ]</div>
      <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>YA RESPONDISTE ESTA ENCUESTA</div>
      <div style={{ border: '1.5px dashed #bbb', padding: '10px 14px', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>
        ESTE ENLACE YA NO ES VÁLIDO. GRACIAS POR TU PARTICIPACIÓN.
      </div>
    </Term>
  )

  if (step === 'expired') return (
    <Term>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: '36px', marginBottom: '8px' }}>[ EXPIRADO ]</div>
      <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>{errorMsg || 'EL TIEMPO O PLAZO DE ESTA ENCUESTA HA VENCIDO.'}</div>
    </Term>
  )

  if (step === 'done') return (
    <Term>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: '56px', marginBottom: '8px' }}>[ OK ]</div>
      <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>RESPUESTA ENVIADA</div>
      <div style={{ border: '1.5px dashed #bbb', padding: '10px 14px', fontSize: '12px', color: '#555', textTransform: 'uppercase' }}>
        {confirmMsg || '¡GRACIAS POR TU RESPUESTA!'}
      </div>
      <div style={{ marginTop: '16px', fontSize: '10px', color: '#aaa', textTransform: 'uppercase' }}>
        ESTE ENLACE YA NO PUEDE SER UTILIZADO NUEVAMENTE.
      </div>
    </Term>
  )

  const answered = Object.keys(answers).length
  const total = survey.questions.length
  const progress = total ? Math.round((answered / total) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Share Tech Mono', monospace", paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ borderBottom: '2px solid #000', padding: '12px 20px', background: '#000', color: '#fff' }}>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: '28px', letterSpacing: '0.05em' }}>SURVEYAPP</div>
        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase' }}>ENCUESTA ASIGNADA — ENLACE ÚNICO</div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px' }}>

        {/* Assigned badge */}
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ border: '1.5px solid #000', padding: '2px 10px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#000', color: '#fff' }}>
            ▶ ENCUESTA ASIGNADA
          </span>
          {survey.due_date && (
            <span style={{ border: '1.5px solid #ccc', padding: '2px 10px', fontSize: '10px', textTransform: 'uppercase', color: '#888' }}>
              VENCE: {new Date(survey.due_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
            </span>
          )}
        </div>

        {/* Survey title */}
        <div style={{ border: '1.5px solid #000', padding: '16px', marginBottom: '16px', boxShadow: '3px 3px 0 #000' }}>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: '32px', letterSpacing: '0.03em', marginBottom: '4px' }}>
            {survey.title.toUpperCase()}
          </div>
          {survey.description && (
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', letterSpacing: '0.06em' }}>
              {survey.description}
            </div>
          )}
        </div>

        {/* Progress */}
        {survey.settings.show_progress_bar && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', color: '#888' }}>
              <span>PROGRESO</span><span>{answered}/{total} RESPONDIDAS</span>
            </div>
            <div style={{ height: '6px', border: '1px solid #000', background: '#fff' }}>
              <div style={{ height: '100%', background: '#000', width: `${progress}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Timer */}
        {timeLeft !== null && (
          <div style={{
            marginBottom: '16px',
            border: `1.5px solid ${timeLeft <= 60 ? '#000' : '#ccc'}`,
            padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: timeLeft <= 60 ? '#000' : '#fff'
          }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: timeLeft <= 60 ? '#fff' : '#888' }}>TIEMPO RESTANTE</span>
            <span style={{ fontFamily: "'VT323', monospace", fontSize: '24px', color: timeLeft <= 60 ? '#fff' : '#000' }}>
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              {timeLeft <= 60 && <span className="blink"> !</span>}
            </span>
          </div>
        )}

        {/* Identity (prefilled if known) */}
        {!survey.settings.allow_anonymous && (
          <div style={{ border: '1.5px solid #000', padding: '14px', marginBottom: '16px' }}>
            <div className="section-label">// DATOS DEL RESPONDENTE</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                ['NOMBRE', '_name', respondentName, setRespondentName, 'text', 'NOMBRE COMPLETO'],
                ['EMAIL', '_email', respondentEmail, setRespondentEmail, 'email', 'EMAIL@DOMINIO.COM']
              ].map(([lbl, key, val, onChange, type, ph]) => (
                <div key={key} style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>// {lbl} *</div>
                  <input
                    className={`input${errors[key] ? ' input-error' : ''}`}
                    type={type} value={val}
                    onChange={e => { onChange(e.target.value); setErrors(er => ({ ...er, [key]: null })) }}
                    placeholder={ph}
                    readOnly={key === '_email' && Boolean(survey.respondent?.email)}
                  />
                  {errors[key] && <div style={{ fontSize: '10px', color: '#000', marginTop: '2px', textTransform: 'uppercase' }}>⚠ {errors[key]}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        {survey.questions.map((q, idx) => (
          <div key={q.id} style={{
            border: `1.5px solid ${errors[q.id] ? '#000' : '#ccc'}`,
            padding: '14px', marginBottom: '10px',
            boxShadow: errors[q.id] ? '2px 2px 0 #000' : 'none',
            background: '#fff'
          }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <span style={{ background: '#000', color: '#fff', padding: '1px 7px', fontSize: '11px', flexShrink: 0 }}>P{idx + 1}</span>
              <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                {q.text}{q.required && <span style={{ marginLeft: '4px' }}>*</span>}
              </span>
            </div>

            {q.type === 'open_text' && (
              <textarea className="textarea" rows={3} value={answers[q.id] || ''}
                onChange={e => setAnswer(q.id, e.target.value)} placeholder="ESCRIBE TU RESPUESTA..." />
            )}

            {q.type === 'single_choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(q.options || []).map((opt, i) => {
                  const active = answers[q.id] === opt.value
                  return (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', border: `1px solid ${active ? '#000' : '#ddd'}`, background: active ? '#000' : '#fff' }}>
                      <input type="radio" name={q.id} value={opt.value} checked={active} onChange={() => setAnswer(q.id, opt.value)} style={{ accentColor: '#fff' }} />
                      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: active ? '#fff' : '#000' }}>{opt.text}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {['multiple_choice', 'checkbox'].includes(q.type) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(q.options || []).map((opt, i) => {
                  const checked = (answers[q.id] || []).includes(opt.value)
                  return (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', border: `1px solid ${checked ? '#000' : '#ddd'}`, background: checked ? '#000' : '#fff' }}>
                      <input type="checkbox" value={opt.value} checked={checked} onChange={() => toggleOption(q.id, opt.value)} />
                      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: checked ? '#fff' : '#000' }}>{opt.text}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {['scale', 'rating'].includes(q.type) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', maxWidth: '70px' }}>{q.scale_config?.min_label}</span>
                <div style={{ display: 'flex', gap: 0, flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {Array.from({ length: (q.scale_config?.max || 10) - (q.scale_config?.min || 1) + 1 }, (_, i) => {
                    const val = String((q.scale_config?.min || 1) + i)
                    const active = answers[q.id] === val
                    return (
                      <button key={val} onClick={() => setAnswer(q.id, val)}
                        style={{ width: '36px', height: '36px', border: '1.5px solid #000', marginLeft: i > 0 ? '-1.5px' : 0, background: active ? '#000' : '#fff', color: active ? '#fff' : '#000', fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', cursor: 'pointer' }}>
                        {val}
                      </button>
                    )
                  })}
                </div>
                <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', maxWidth: '70px', textAlign: 'right' }}>{q.scale_config?.max_label}</span>
              </div>
            )}

            {q.type === 'date' && (
              <input className="input" type="date" value={answers[q.id] || ''} onChange={e => setAnswer(q.id, e.target.value)} style={{ maxWidth: '200px' }} />
            )}

            {errors[q.id] && <div style={{ marginTop: '8px', fontSize: '10px', textTransform: 'uppercase', color: '#000' }}>⚠ {errors[q.id]}</div>}
          </div>
        ))}

        <button onClick={submit} disabled={submitting || (timeLeft !== null && timeLeft <= 0)}
          style={{ width: '100%', padding: '14px', border: '1.5px solid #000', background: '#000', color: '#fff', fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #555' }}>
          {submitting ? '[ ENVIANDO... ]' : '[ ENVIAR RESPUESTA ]'}
        </button>
      </div>
    </div>
  )
}