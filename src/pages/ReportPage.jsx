import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { surveysApi } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from 'recharts'

export default function ReportPage() {
  const { surveyId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState({ pdf: false, excel: false })

  useEffect(() => { loadReport() }, [surveyId])

  const loadReport = async () => {
    try { const { data } = await surveysApi.getReport(surveyId); setReport(data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleExport = async (type) => {
    setExporting(e => ({ ...e, [type]: true }))
    try {
      if (type === 'pdf') await surveysApi.exportPDF(surveyId)
      else await surveysApi.exportExcel(surveyId)
    } catch (err) {
      alert('[ ERROR: ' + err.message + ' ]')
    } finally {
      setExporting(e => ({ ...e, [type]: false }))
    }
  }

  const formatDuration = (sec) => {
    if (!sec) return '—'
    if (sec < 60) return `${sec}S`
    return `${Math.floor(sec / 60)}M ${sec % 60}S`
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ border: '1.5px solid #000', background: '#fff', padding: '6px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase' }}>
        <div style={{ color: '#888', fontSize: '10px' }}>{label}</div>
        <div style={{ fontWeight: 'bold' }}>{payload[0].value}{payload[0].unit || ''}</div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Share Tech Mono', monospace" }}>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: '32px' }}>LOADING REPORT<span className="blink">_</span></div>
    </div>
  )
  if (!report) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase' }}>[ ERROR LOADING REPORT ]</div>

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Share Tech Mono', monospace" }}>

      {/* Header */}
      <div style={{ borderBottom: '2px solid #000', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
        <button style={{ padding: '5px 10px', border: '1.5px solid #000', background: '#fff', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase' }}
          onClick={() => navigate('/dashboard')}
          onMouseEnter={e => { e.target.style.background = '#000'; e.target.style.color = '#fff' }}
          onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}>
          ← BACK
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '0.03em' }}>{report.survey_title.toUpperCase()}</div>
          <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>// COMBAT REPORT</div>
        </div>

        {/* ── EXPORT BUTTONS ── */}
        <div style={{ display: 'flex', gap: 0 }}>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting.pdf}
            style={{
              padding: '6px 14px', border: '1.5px solid #000', marginRight: '-1.5px',
              background: exporting.pdf ? '#000' : '#fff',
              color: exporting.pdf ? '#fff' : '#000',
              fontFamily: "'Share Tech Mono', monospace", fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              cursor: exporting.pdf ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
            onMouseEnter={e => { if (!exporting.pdf) { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' } }}
            onMouseLeave={e => { if (!exporting.pdf) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' } }}>
            {exporting.pdf ? '[ GENERATING... ]' : '↓ PDF'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting.excel}
            style={{
              padding: '6px 14px', border: '1.5px solid #000',
              background: exporting.excel ? '#000' : '#fff',
              color: exporting.excel ? '#fff' : '#000',
              fontFamily: "'Share Tech Mono', monospace", fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              cursor: exporting.excel ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
            onMouseEnter={e => { if (!exporting.excel) { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' } }}
            onMouseLeave={e => { if (!exporting.excel) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' } }}>
            {exporting.excel ? '[ GENERATING... ]' : '↓ EXCEL'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>

        {/* KPIs */}
        <div className="section-label">STATS SUMMARY</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: '20px', border: '1.5px solid #000' }}>
          {[
            { val: report.total_responses, label: 'TOTAL RESPONSES' },
            { val: report.complete_responses, label: 'COMPLETE' },
            { val: report.total_questions, label: 'QUESTIONS' },
            { val: formatDuration(report.avg_duration_seconds), label: 'AVG DURATION' },
          ].map((k, i) => (
            <div key={i} style={{ padding: '20px', textAlign: 'center', borderRight: i % 2 === 0 ? '1.5px solid #000' : 'none', borderTop: i >= 2 ? '1.5px solid #000' : 'none' }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: '48px', lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', marginTop: '4px' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Responses by day */}
        {report.responses_by_day?.length > 0 && (
          <div style={{ border: '1.5px solid #000', padding: '16px', marginBottom: '16px' }}>
            <div className="section-label">RESPONSES OVER TIME</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={report.responses_by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, textTransform: 'uppercase' }} />
                <YAxis tick={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#000" strokeWidth={2} dot={{ fill: '#000', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per-question */}
        <div className="section-label">QUESTION BREAKDOWN</div>
        {report.questions_summary?.map((q, idx) => (
          <div key={q.question_id} style={{ border: '1.5px solid #000', padding: '16px', marginBottom: '-1.5px' }} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
              <span style={{ background: '#000', color: '#fff', padding: '2px 8px', fontSize: '11px', fontFamily: "'Share Tech Mono', monospace", flexShrink: 0 }}>Q{idx + 1}</span>
              <div>
                <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{q.question_text}</div>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '2px', textTransform: 'uppercase' }}>
                  {q.response_count} RESPONSES · {q.skip_count} SKIPPED · {q.question_type.toUpperCase()}
                </div>
              </div>
            </div>

            {q.option_stats?.length > 0 && (
              <ResponsiveContainer width="100%" height={Math.max(100, q.option_stats.length * 36)}>
                <BarChart data={q.option_stats} layout="vertical" margin={{ left: 8, right: 40 }}>
                  <XAxis type="number" tick={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="option_text" width={160} tick={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, textTransform: 'uppercase' }} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ border: '1.5px solid #000', background: '#fff', padding: '6px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}>
                      <div style={{ textTransform: 'uppercase' }}>{payload[0]?.payload.option_text}</div>
                      <div>{payload[0]?.payload.count} ({payload[0]?.value?.toFixed(1)}%)</div>
                    </div>
                  ) : null} />
                  <Bar dataKey="percentage" radius={0}>
                    {q.option_stats.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#000' : '#555'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {q.numeric_stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1.5px solid #000' }}>
                {[['MIN', q.numeric_stats.min], ['MAX', q.numeric_stats.max], ['MEAN', q.numeric_stats.mean?.toFixed(2)], ['MEDIAN', q.numeric_stats.median]].map(([lbl, val], i) => (
                  <div key={lbl} style={{ padding: '12px', textAlign: 'center', borderRight: i < 3 ? '1.5px solid #000' : 'none' }}>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: '32px', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>{lbl}</div>
                  </div>
                ))}
              </div>
            )}

            {q.open_answers?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {q.open_answers.slice(0, 5).map((ans, i) => (
                  <div key={i} style={{ border: '1px solid #ddd', padding: '7px 10px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#555' }}>
                    [{i + 1}] {ans}
                  </div>
                ))}
                {q.open_answers.length > 5 && <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', padding: '4px' }}>+{q.open_answers.length - 5} MORE RESPONSES...</div>}
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: '20px', border: '1.5px dashed #bbb', padding: '10px 14px', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          COMMANDER'S TIP:<br />
          PUBLISH YOUR SURVEY AND SHARE THE UNIQUE LINK TO COLLECT MORE RESPONSES.
        </div>
      </div>
    </div>
  )
}