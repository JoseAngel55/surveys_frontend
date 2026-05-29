import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { surveysApi } from '../services/api'

const groupsApi = {
  list: () => api.get('/groups'),
  create: (data) => api.post('/groups', data),
  delete: (id) => api.delete(`/groups/${id}`),
  getMembers: (id) => api.get(`/groups/${id}/members`),
  addMembers: (id, data) => api.post(`/groups/${id}/members`, data),
  removeMember: (gid, uid) => api.delete(`/groups/${gid}/members/${uid}`),
  assign: (id, data) => api.post(`/groups/${id}/assign`, data),
  getAssignments: (id, survey_id) => api.get(`/groups/${id}/assignments${survey_id ? `?survey_id=${survey_id}` : ''}`),
}

const TABS = ['GRUPOS', 'MIEMBROS', 'ASIGNACIONES']

export default function GroupsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('GRUPOS')
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(false)

  // Forms
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [assignSurveyId, setAssignSurveyId] = useState('')
  const [assignDueDate, setAssignDueDate] = useState('')
  const [assignResult, setAssignResult] = useState(null)
  const [copied, setCopied] = useState({})

  useEffect(() => { fetchGroups(); fetchSurveys() }, [])
  useEffect(() => { if (selectedGroup) { fetchMembers(); fetchAssignments() } }, [selectedGroup])

  const fetchGroups = async () => {
    setLoading(true)
    try { const { data } = await groupsApi.list(); setGroups(data.data || []) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fetchSurveys = async () => {
    try { const { data } = await surveysApi.list({ limit: 100, status: 'active' }); setSurveys(data.data || []) }
    catch (e) { console.error(e) }
  }

  const fetchMembers = async () => {
    try { const { data } = await groupsApi.getMembers(selectedGroup.id); setMembers(data || []) }
    catch (e) { console.error(e) }
  }

  const fetchAssignments = async () => {
    try { const { data } = await groupsApi.getAssignments(selectedGroup.id); setAssignments(data || []) }
    catch (e) { console.error(e) }
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      const { data } = await groupsApi.create({ name: newGroupName, description: newGroupDesc })
      setGroups(g => [data, ...g])
      setNewGroupName(''); setNewGroupDesc('')
      setSelectedGroup(data); setTab('MIEMBROS')
    } catch (e) { alert('Error: ' + e.response?.data?.message) }
  }

  const deleteGroup = async (id) => {
    if (!confirm('¿ELIMINAR GRUPO?')) return
    await groupsApi.delete(id)
    setGroups(g => g.filter(x => x.id !== id))
    if (selectedGroup?.id === id) setSelectedGroup(null)
  }

  const addMembers = async () => {
    if (!emailInput.trim() || !selectedGroup) return
    const emails = emailInput.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean)
    try {
      const { data } = await groupsApi.addMembers(selectedGroup.id, { emails })
      await fetchMembers()
      setEmailInput('')
      const total = (data.added?.length || 0) + (data.created?.length || 0)
      alert(`[ ${total} MIEMBRO(S) AGREGADO(S) ]${data.errors?.length ? `\n${data.errors.length} ERROR(ES)` : ''}`)
    } catch (e) { alert('Error: ' + e.response?.data?.message) }
  }

  const removeMember = async (uid) => {
    if (!confirm('¿ELIMINAR MIEMBRO?')) return
    await groupsApi.removeMember(selectedGroup.id, uid)
    setMembers(m => m.filter(x => x.id !== uid))
  }

  const assignSurvey = async () => {
    if (!assignSurveyId || !selectedGroup) return alert('[ SELECCIONA UNA ENCUESTA ]')
    if (!members.length) return alert('[ EL GRUPO NO TIENE MIEMBROS ]')
    try {
      const { data } = await groupsApi.assign(selectedGroup.id, {
        survey_id: assignSurveyId,
        due_date: assignDueDate || null
      })
      setAssignResult(data)
      await fetchAssignments()
      setTab('ASIGNACIONES')
    } catch (e) { alert('Error: ' + e.response?.data?.message) }
  }

  const copyLink = (token, id) => {
    navigator.clipboard.writeText(`${window.location.origin}/a/${token}`)
    setCopied(c => ({ ...c, [id]: true }))
    setTimeout(() => setCopied(c => ({ ...c, [id]: false })), 2000)
  }

  const S = {
    page: { minHeight: '100vh', background: '#fff', fontFamily: "'Share Tech Mono', monospace" },
    topbar: { borderBottom: '2px solid #000', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, background: '#fff', zIndex: 10 },
    main: { maxWidth: '1100px', margin: '0 auto', padding: '20px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' },
    sidebar: { display: 'flex', flexDirection: 'column', gap: '0' },
    panel: { border: '1.5px solid #000', padding: '16px' },
    label: { fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' },
  }

  return (
    <div style={S.page}>
      {/* Topbar */}
      <div style={S.topbar}>
        <button style={{ padding: '5px 10px', border: '1.5px solid #000', background: '#fff', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase' }}
          onClick={() => navigate('/dashboard')}
          onMouseEnter={e => { e.target.style.background = '#000'; e.target.style.color = '#fff' }}
          onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}>
          ← BACK
        </button>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: '24px' }}>GESTIÓN DE GRUPOS</div>
        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>// GROUPS & ASSIGNMENTS</div>
      </div>

      <div style={{ ...S.main, gridTemplateColumns: window.innerWidth < 700 ? '1fr' : '280px 1fr' }}>

        {/* ── LEFT: Group list ── */}
        <div style={S.sidebar}>
          <div style={S.label}>// GRUPOS ({groups.length})</div>

          {/* Create new group */}
          <div style={{ border: '1.5px solid #000', padding: '12px', marginBottom: '-1.5px' }}>
            <div style={S.label}>// NUEVO GRUPO</div>
            <input className="input" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
              placeholder="NOMBRE DEL GRUPO" style={{ marginBottom: '6px' }} />
            <input className="input" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)}
              placeholder="DESCRIPCIÓN (OPCIONAL)" style={{ marginBottom: '8px' }} />
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
              onClick={createGroup}>+ CREAR GRUPO</button>
          </div>

          {/* Group list */}
          {loading ? (
            <div style={{ padding: '16px', fontSize: '11px', color: '#888', textTransform: 'uppercase', border: '1.5px solid #ccc', borderTop: 'none' }}>
              CARGANDO<span className="blink">_</span>
            </div>
          ) : groups.length === 0 ? (
            <div style={{ border: '1.5px dashed #ccc', borderTop: 'none', padding: '16px', fontSize: '11px', color: '#aaa', textTransform: 'uppercase', textAlign: 'center' }}>
              NO HAY GRUPOS
            </div>
          ) : (
            groups.map((g, i) => (
              <div key={g.id}
                onClick={() => { setSelectedGroup(g); setTab('MIEMBROS'); setAssignResult(null) }}
                style={{ border: `1.5px solid ${selectedGroup?.id === g.id ? '#000' : '#ccc'}`, borderTop: i === 0 ? 'none' : '1.5px solid #ccc', marginTop: i === 0 ? '-1.5px' : 0, padding: '10px 12px', cursor: 'pointer', background: selectedGroup?.id === g.id ? '#000' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: selectedGroup?.id === g.id ? '#fff' : '#000' }}>
                    {g.name.toUpperCase()}
                  </div>
                  {g.description && (
                    <div style={{ fontSize: '9px', color: selectedGroup?.id === g.id ? '#aaa' : '#888', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                      {g.description}
                    </div>
                  )}
                </div>
                <button onClick={e => { e.stopPropagation(); deleteGroup(g.id) }}
                  style={{ padding: '2px 6px', border: `1px solid ${selectedGroup?.id === g.id ? '#fff' : '#ccc'}`, background: 'transparent', color: selectedGroup?.id === g.id ? '#fff' : '#aaa', cursor: 'pointer', fontSize: '11px', fontFamily: "'Share Tech Mono', monospace" }}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* ── RIGHT: Panel ── */}
        {selectedGroup ? (
          <div>
            {/* Group header */}
            <div style={{ border: '1.5px solid #000', padding: '12px 16px', marginBottom: '-1.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: '28px' }}>{selectedGroup.name.toUpperCase()}</div>
                {selectedGroup.description && <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>{selectedGroup.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', textTransform: 'uppercase' }}>
                <span style={{ border: '1.5px solid #ccc', padding: '2px 10px', color: '#666' }}>{members.length} MIEMBROS</span>
                <span style={{ border: '1.5px solid #ccc', padding: '2px 10px', color: '#666' }}>{assignments.length} ASIGNACIONES</span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1.5px solid #000', borderLeft: '1.5px solid #000', borderRight: '1.5px solid #000' }}>
              {TABS.map((t, i) => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ flex: 1, padding: '8px', border: 'none', borderRight: i < TABS.length - 1 ? '1.5px solid #000' : 'none', borderBottom: tab === t ? '3px solid #000' : '3px solid transparent', background: tab === t ? '#f5f5f5' : '#fff', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: tab === t ? '#000' : '#888', fontWeight: tab === t ? 'bold' : 'normal' }}>
                  {t}
                </button>
              ))}
            </div>

            {/* ── MEMBERS tab ── */}
            {tab === 'MIEMBROS' && (
              <div style={{ border: '1.5px solid #000', borderTop: 'none', padding: '16px' }}>

                {/* Add by email */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={S.label}>// AGREGAR MIEMBROS POR EMAIL</div>
                  <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '6px' }}>
                    SEPARA MÚLTIPLES EMAILS CON COMAS, PUNTO Y COMA O SALTOS DE LÍNEA
                  </div>
                  <textarea className="textarea" rows={3} value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="usuario@ejemplo.com, otro@ejemplo.com..." />
                  <button className="btn btn-primary" style={{ marginTop: '8px', fontSize: '11px' }} onClick={addMembers}>
                    + AGREGAR
                  </button>
                </div>

                {/* Members list */}
                <div style={S.label}>// MIEMBROS ACTUALES ({members.length})</div>
                {members.length === 0 ? (
                  <div style={{ border: '1.5px dashed #ccc', padding: '16px', fontSize: '11px', color: '#aaa', textTransform: 'uppercase', textAlign: 'center' }}>
                    NO HAY MIEMBROS. AGREGA EMAILS ARRIBA.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {members.map((m, i) => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid #ddd', marginTop: i > 0 ? '-1px' : 0, background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <div>
                          <div style={{ fontSize: '12px', textTransform: 'uppercase' }}>{m.name}</div>
                          <div style={{ fontSize: '10px', color: '#888' }}>{m.email}</div>
                        </div>
                        <button onClick={() => removeMember(m.id)}
                          style={{ padding: '2px 8px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: '10px', fontFamily: "'Share Tech Mono', monospace', color: '#888" }}
                          onMouseEnter={e => { e.target.style.background = '#000'; e.target.style.color = '#fff' }}
                          onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#888' }}>
                          QUITAR
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── GRUPOS tab (assign survey) ── */}
            {tab === 'GRUPOS' && (
              <div style={{ border: '1.5px solid #000', borderTop: 'none', padding: '16px' }}>
                <div style={S.label}>// ASIGNAR ENCUESTA AL GRUPO</div>
                <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '12px' }}>
                  SE GENERA UN ENLACE ÚNICO E INTRANSFERIBLE POR CADA MIEMBRO.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={S.label}>ENCUESTA ACTIVA</div>
                    <select className="select" value={assignSurveyId} onChange={e => setAssignSurveyId(e.target.value)}>
                      <option value="">— SELECCIONAR ENCUESTA —</option>
                      {surveys.map(s => (
                        <option key={s.id} value={s.id}>{s.title.toUpperCase()}</option>
                      ))}
                    </select>
                    {surveys.length === 0 && (
                      <div style={{ fontSize: '10px', color: '#e00', textTransform: 'uppercase', marginTop: '4px' }}>
                        ⚠ NO HAY ENCUESTAS ACTIVAS. PUBLICA UNA DESDE EL DASHBOARD.
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={S.label}>FECHA LÍMITE (OPCIONAL)</div>
                    <input className="input" type="datetime-local" value={assignDueDate}
                      onChange={e => setAssignDueDate(e.target.value)} style={{ maxWidth: '240px' }} />
                  </div>

                  <div style={{ border: '1.5px dashed #ccc', padding: '10px 12px', fontSize: '10px', textTransform: 'uppercase', color: '#888' }}>
                    SE ASIGNARÁ A <strong style={{ color: '#000' }}>{members.length} MIEMBRO(S)</strong>.
                    ASIGNACIONES ANTERIORES DE ESTA ENCUESTA SERÁN REEMPLAZADAS.
                  </div>

                  <button className="btn btn-primary" style={{ fontSize: '12px', width: 'fit-content' }} onClick={assignSurvey}>
                    ▶ ASIGNAR A TODO EL GRUPO
                  </button>
                </div>

                {/* Assignment result */}
                {assignResult && (
                  <div style={{ marginTop: '16px', border: '1.5px solid #000', padding: '12px' }}>
                    <div style={S.label}>// RESULTADO: {assignResult.total_assigned} ENLACES GENERADOS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {assignResult.assignments.map((a, i) => (
                        <div key={a.assignment_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', border: '1px solid #ddd', marginTop: i > 0 ? '-1px' : 0, background: i % 2 === 0 ? '#fff' : '#f9f9f9', gap: '8px' }}>
                          <span style={{ fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</span>
                          <button onClick={() => copyLink(a.access_token, a.assignment_id)}
                            style={{ padding: '2px 8px', border: '1px solid #000', background: copied[a.assignment_id] ? '#000' : '#fff', color: copied[a.assignment_id] ? '#fff' : '#000', cursor: 'pointer', fontSize: '10px', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            {copied[a.assignment_id] ? '✓ COPIADO' : '[COPIAR]'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ASSIGNMENTS tab ── */}
            {tab === 'ASIGNACIONES' && (
              <div style={{ border: '1.5px solid #000', borderTop: 'none', padding: '16px' }}>
                <div style={S.label}>// ESTADO DE ASIGNACIONES ({assignments.length})</div>

                {assignments.length === 0 ? (
                  <div style={{ border: '1.5px dashed #ccc', padding: '16px', fontSize: '11px', color: '#aaa', textTransform: 'uppercase', textAlign: 'center' }}>
                    NO HAY ASIGNACIONES. ASIGNA UNA ENCUESTA EN LA PESTAÑA "GRUPOS".
                  </div>
                ) : (
                  <>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '1.5px solid #000', marginBottom: '12px' }}>
                      {[
                        { val: assignments.length, label: 'TOTAL' },
                        { val: assignments.filter(a => a.is_completed).length, label: 'COMPLETADAS' },
                        { val: assignments.filter(a => !a.is_completed && !a.is_expired).length, label: 'PENDIENTES' },
                      ].map((k, i) => (
                        <div key={i} style={{ padding: '12px', textAlign: 'center', borderRight: i < 2 ? '1.5px solid #000' : 'none' }}>
                          <div style={{ fontFamily: "'VT323', monospace", fontSize: '36px', lineHeight: 1 }}>{k.val}</div>
                          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#888' }}>{k.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Table */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {/* Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '8px', padding: '6px 8px', background: '#000', color: '#fff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <span>USUARIO</span><span>ENCUESTA</span><span>ESTADO</span><span>ENLACE</span>
                      </div>

                      {assignments.map((a, i) => {
                        const status = a.is_completed ? 'COMPLETADA' : a.is_expired ? 'EXPIRADA' : 'PENDIENTE'
                        const statusColor = a.is_completed ? '#000' : a.is_expired ? '#aaa' : '#555'
                        const statusBg = a.is_completed ? '#e8f5e9' : a.is_expired ? '#f5f5f5' : '#fff'
                        return (
                          <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '8px', padding: '7px 8px', border: '1px solid #ddd', marginTop: i > 0 ? '-1px' : '0', background: statusBg, alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '11px', textTransform: 'uppercase' }}>{a.name || '—'}</div>
                              <div style={{ fontSize: '9px', color: '#888' }}>{a.email}</div>
                            </div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.survey_title}
                            </div>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: statusColor, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              {a.is_completed ? '✓ ' : a.is_expired ? '✕ ' : '○ '}{status}
                            </span>
                            {!a.is_completed && !a.is_expired ? (
                              <button onClick={() => copyLink(a.survey_link.split('/a/')[1], a.id)}
                                style={{ padding: '2px 8px', border: '1px solid #000', background: copied[a.id] ? '#000' : '#fff', color: copied[a.id] ? '#fff' : '#000', cursor: 'pointer', fontSize: '10px', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                {copied[a.id] ? '✓' : '[↗]'}
                              </button>
                            ) : (
                              <span style={{ fontSize: '10px', color: '#ccc', textAlign: 'center' }}>—</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #ccc', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#aaa', fontSize: '12px', textTransform: 'uppercase' }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: '32px', marginBottom: '8px' }}>SELECT A GROUP</div>
              CREA O SELECCIONA UN GRUPO PARA COMENZAR
            </div>
          </div>
        )}
      </div>
    </div>
  )
}