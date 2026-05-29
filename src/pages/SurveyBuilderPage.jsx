import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { surveysApi } from '../services/api'

const QUESTION_TYPES = [
  { value: 'open_text',       label: 'OPEN TEXT' },
  { value: 'single_choice',   label: 'SINGLE CHOICE' },
  { value: 'multiple_choice', label: 'MULTIPLE CHOICE' },
  { value: 'scale',           label: 'SCALE (1-10)' },
  { value: 'rating',          label: 'RATING' },
  { value: 'date',            label: 'DATE' },
]
const SURVEY_TYPES = ['satisfaction', 'academic', 'feedback', 'poll', 'quiz']

const defaultQ = () => ({
  _id: Math.random().toString(36).slice(2),
  text: '', type: 'open_text', required: false,
  options: [{ text: '', value: '1' }, { text: '', value: '2' }],
  scale_config: { min: 1, max: 10, min_label: 'NOT LIKELY', max_label: 'VERY LIKELY' }
})

const S = {
  page: { minHeight: '100vh', background: '#fff', fontFamily: "'Share Tech Mono', monospace" },
  header: { borderBottom: '2px solid #000', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, background: '#fff', zIndex: 10 },
  back: { padding: '5px 10px', border: '1.5px solid #000', background: '#fff', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase' },
  titleInput: { flex: 1, border: 'none', borderBottom: '1.5px solid #000', outline: 'none', fontFamily: "'VT323', monospace", fontSize: '24px', background: 'transparent', textTransform: 'uppercase', padding: '2px 0' },
  hBtn: { padding: '6px 14px', border: '1.5px solid #000', background: '#fff', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  hBtnPrimary: { padding: '6px 14px', border: '1.5px solid #000', background: '#000', color: '#fff', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  linkBanner: { background: '#000', color: '#fff', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  tabs: { borderBottom: '1.5px solid #000', display: 'flex', padding: '0 20px', background: '#fff' },
  tabBtn: { padding: '10px 18px', border: 'none', borderBottom: '3px solid transparent', background: 'none', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' },
  tabActive: { padding: '10px 18px', border: 'none', borderBottom: '3px solid #000', background: 'none', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#000', fontWeight: 'bold' },
  main: { maxWidth: '780px', margin: '0 auto', padding: '20px' },
}

export default function SurveyBuilderPage() {
  const { surveyId } = useParams()
  const isEdit = Boolean(surveyId)
  const navigate = useNavigate()
  const [survey, setSurvey] = useState({ title: '', description: '', type: 'satisfaction', settings: { allow_anonymous: true, show_progress_bar: true, time_limit_minutes: null, confirmation_message: 'THANK YOU FOR YOUR RESPONSE!' } })
  const [questions, setQuestions] = useState([])
  const [activeQ, setActiveQ] = useState(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publicUrl, setPublicUrl] = useState('')
  const [tab, setTab] = useState('builder')

  useEffect(() => { if (isEdit) loadSurvey() }, [surveyId])

  const loadSurvey = async () => {
    const { data } = await surveysApi.get(surveyId)
    setSurvey({ title: data.title, description: data.description, type: data.type, settings: data.settings || {} })
    setQuestions(data.questions?.sort((a, b) => a.order - b.order).map(q => ({ ...q, _id: q.id })) || [])
    if (data.public_token) setPublicUrl(`${window.location.origin}/s/${data.public_token}`)
  }

  const save = async () => {
    if (!survey.title.trim()) return alert('[ ERROR: SURVEY TITLE IS REQUIRED ]')
    setSaving(true)
    try {
      let sid = surveyId
      if (!isEdit) {
        const { data } = await surveysApi.create(survey)
        sid = data.id
      } else {
        await surveysApi.update(surveyId, survey)
      }

      // Build updated questions with server IDs, no direct mutation
      const updatedQuestions = []
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const payload = {
          text: q.text, type: q.type, required: q.required,
          order: i + 1, options: q.options, scale_config: q.scale_config
        }
        if (q.id) {
          await surveysApi.updateQuestion(sid, q.id, payload)
          updatedQuestions.push(q)
        } else {
          const { data: created } = await surveysApi.addQuestion(sid, payload)
          updatedQuestions.push({ ...q, id: created.id })
        }
      }
      // Update state properly with real IDs
      setQuestions(updatedQuestions)

      if (!isEdit) {
        navigate(`/surveys/${sid}/edit`)
      } else {
        alert('[ SURVEY SAVED SUCCESSFULLY ]')
      }
    } catch (err) {
      alert('ERROR: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    if (!surveyId) return alert('[ SAVE FIRST ]')
    setPublishing(true)
    try {
      const { data } = await surveysApi.publish(surveyId)
      const url = data.public_url || `${window.location.origin}/s/${data.public_token}`
      setPublicUrl(url)
    } catch (err) { alert('ERROR: ' + err.response?.data?.message) }
    finally { setPublishing(false) }
  }

  const addQ = () => { const q = defaultQ(); setQuestions(qs => [...qs, q]); setActiveQ(q._id) }
  const updQ = (id, u) => setQuestions(qs => qs.map(q => q._id === id ? { ...q, ...u } : q))
  const delQ = async (q) => {
    if (!confirm('[ CONFIRM DELETE QUESTION? ]')) return
    if (q.id && surveyId) await surveysApi.deleteQuestion(surveyId, q.id)
    setQuestions(qs => qs.filter(x => x._id !== q._id))
    if (activeQ === q._id) setActiveQ(null)
  }
  const moveQ = (idx, dir) => {
    const next = [...questions]; const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]; setQuestions(next)
  }
  const addOpt = (qid) => setQuestions(qs => qs.map(q => q._id === qid ? { ...q, options: [...(q.options || []), { text: '', value: String((q.options?.length || 0) + 1) }] } : q))
  const updOpt = (qid, idx, text) => setQuestions(qs => qs.map(q => q._id === qid ? { ...q, options: q.options.map((o, i) => i === idx ? { ...o, text } : o) } : q))
  const delOpt = (qid, idx) => setQuestions(qs => qs.map(q => q._id === qid ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q))

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <button style={S.back} onClick={() => navigate('/dashboard')}
          onMouseEnter={e => { e.target.style.background = '#000'; e.target.style.color = '#fff' }}
          onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}>
          ← BACK
        </button>
        <input style={S.titleInput} value={survey.title}
          onChange={e => setSurvey(s => ({ ...s, title: e.target.value }))}
          placeholder="SURVEY TITLE..." />
        <button style={S.hBtn} onClick={save} disabled={saving}
          onMouseEnter={e => { if (!saving) { e.target.style.background = '#000'; e.target.style.color = '#fff' } }}
          onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}>
          {saving ? '[ SAVING... ]' : '[ SAVE ]'}
        </button>
        {isEdit && (
          <button style={S.hBtnPrimary} onClick={publish} disabled={publishing}>
            {publishing ? '[ PUBLISHING... ]' : '[ PUBLISH & SHARE ]'}
          </button>
        )}
      </header>

      {/* Public URL banner */}
      {publicUrl && (
        <div style={S.linkBanner}>
          <span>▶ PUBLIC LINK ACTIVE:</span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{publicUrl}</span>
          <button style={{ padding: '3px 10px', border: '1px solid #fff', background: 'transparent', color: '#fff', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}
            onClick={() => { navigator.clipboard.writeText(publicUrl); alert('COPIED!') }}>
            [COPY]
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={S.tabs}>
        <button style={tab === 'builder' ? S.tabActive : S.tabBtn} onClick={() => setTab('builder')}>// BUILDER</button>
        <button style={tab === 'settings' ? S.tabActive : S.tabBtn} onClick={() => setTab('settings')}>// SETTINGS</button>
      </div>

      <div style={S.main}>
        {tab === 'builder' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Survey meta */}
            <div style={{ border: '1.5px solid #000', padding: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: '200px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>// DESCRIPTION</div>
                <textarea className="textarea" value={survey.description || ''} rows={2}
                  onChange={e => setSurvey(s => ({ ...s, description: e.target.value }))}
                  placeholder="DESCRIBE THE SURVEY..." />
              </div>
              <div style={{ minWidth: '140px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>// TYPE</div>
                <select className="select" value={survey.type} onChange={e => setSurvey(s => ({ ...s, type: e.target.value }))}>
                  {SURVEY_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            {/* Question count */}
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              QUESTIONS [{questions.length}]
            </div>

            {/* Questions */}
            {questions.map((q, idx) => (
              <div key={q._id} className="fade-in"
                onClick={() => setActiveQ(q._id)}
                style={{ border: `1.5px solid ${activeQ === q._id ? '#000' : '#ccc'}`, padding: '14px', cursor: 'pointer', boxShadow: activeQ === q._id ? '3px 3px 0 #000' : 'none', transition: 'box-shadow 0.1s' }}>
                {/* Q header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ background: '#000', color: '#fff', padding: '2px 8px', fontSize: '11px', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                    Q{idx + 1}
                  </span>
                  <select style={{ padding: '3px 8px', border: '1px solid #000', background: '#fff', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}
                    value={q.type} onChange={e => updQ(q._id, { type: e.target.value })} onClick={e => e.stopPropagation()}>
                    {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', textTransform: 'uppercase', color: '#666', cursor: 'pointer' }}>
                    <input type="checkbox" checked={q.required} onChange={e => updQ(q._id, { required: e.target.checked })} /> REQUIRED
                  </label>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 0 }}>
                    {[['↑', () => moveQ(idx, -1)], ['↓', () => moveQ(idx, 1)], ['✕', () => delQ(q)]].map(([lbl, fn], i) => (
                      <button key={lbl} onClick={e => { e.stopPropagation(); fn() }}
                        style={{ padding: '3px 8px', border: '1px solid #000', marginLeft: i > 0 ? '-1px' : 0, background: '#fff', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}
                        onMouseEnter={e => { e.target.style.background = '#000'; e.target.style.color = '#fff' }}
                        onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea className="textarea" value={q.text} rows={2}
                  onChange={e => updQ(q._id, { text: e.target.value })}
                  placeholder="ENTER QUESTION TEXT..." />

                {/* Options */}
                {['single_choice', 'multiple_choice', 'checkbox'].includes(q.type) && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(q.options || []).map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#888' }}>{q.type === 'single_choice' ? '○' : '□'}</span>
                        <input style={{ flex: 1, padding: '4px 8px', border: '1px solid #ccc', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase', outline: 'none' }}
                          value={opt.text} onChange={e => updOpt(q._id, oi, e.target.value)}
                          placeholder={`OPTION ${oi + 1}`} />
                        <button onClick={() => delOpt(q._id, oi)}
                          style={{ padding: '4px 8px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: '11px' }}
                          onMouseEnter={e => { e.target.style.background = '#000'; e.target.style.color = '#fff' }}
                          onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => addOpt(q._id)}
                      style={{ padding: '4px 10px', border: '1px dashed #999', background: '#fff', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', textTransform: 'uppercase', textAlign: 'left', color: '#666' }}>
                      + ADD OPTION
                    </button>
                  </div>
                )}

                {/* Scale config */}
                {['scale', 'rating'].includes(q.type) && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[['MIN', 'min', '60px'], ['MAX', 'max', '60px'], ['MIN LABEL', 'min_label', '140px'], ['MAX LABEL', 'max_label', '140px']].map(([lbl, key, w]) => (
                      <div key={key}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#888', marginBottom: '3px' }}>{lbl}</div>
                        <input style={{ width: w, padding: '4px 6px', border: '1px solid #ccc', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase', outline: 'none' }}
                          type={['min', 'max'].includes(key) ? 'number' : 'text'}
                          value={q.scale_config?.[key] || ''}
                          onChange={e => updQ(q._id, { scale_config: { ...q.scale_config, [key]: ['min', 'max'].includes(key) ? Number(e.target.value) : e.target.value } })} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button onClick={addQ}
              style={{ padding: '12px', border: '1.5px dashed #000', background: '#fff', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#000', width: '100%' }}
              onMouseEnter={e => { e.target.style.background = '#000'; e.target.style.color = '#fff' }}
              onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}>
              + ADD QUESTION
            </button>
          </div>
        ) : (
          /* Settings tab */
          <div style={{ border: '1.5px solid #000', padding: '16px' }}>
            <div className="section-label">// SURVEY SETTINGS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                ['ALLOW ANONYMOUS RESPONSES', 'allow_anonymous', 'RESPONDENTS WON\'T NEED TO PROVIDE IDENTITY'],
                ['SHOW PROGRESS BAR', 'show_progress_bar', 'DISPLAY COMPLETION PROGRESS TO RESPONDENTS'],
              ].map(([lbl, key, desc]) => (
                <div key={key} style={{ borderBottom: '1px dashed #ddd', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginTop: '2px' }}>{desc}</div>
                  </div>
                  <input type="checkbox" checked={survey.settings?.[key] ?? true}
                    onChange={e => setSurvey(s => ({ ...s, settings: { ...s.settings, [key]: e.target.checked } }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>// TIME LIMIT (MINUTES, OPTIONAL)</div>
                <input className="input" type="number" value={survey.settings?.time_limit_minutes || ''}
                  onChange={e => setSurvey(s => ({ ...s, settings: { ...s.settings, time_limit_minutes: e.target.value ? Number(e.target.value) : null } }))}
                  placeholder="NO LIMIT" style={{ maxWidth: '180px' }} />
              </div>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>// CONFIRMATION MESSAGE</div>
                <textarea className="textarea" rows={3}
                  value={survey.settings?.confirmation_message || ''}
                  onChange={e => setSurvey(s => ({ ...s, settings: { ...s.settings, confirmation_message: e.target.value } }))}
                  placeholder="THANK YOU FOR YOUR RESPONSE!" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
