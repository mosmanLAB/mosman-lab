/* ═══════════════════════════════════════════════════════
   MosmanLAB · simulados.js
   Lógica compartilhada de todos os simulados
   Prof. Edson Mosman · mosmanlab.com.br

   Cada HTML de simulado deve definir antes deste script:
     const SIMULADO_ID  = 'cinematica-01'   // id no banco
     const TOTAL_Q      = 10                // total de questões
     const TEMPO_MAX    = 20 * 60           // segundos
     const GABARITOS    = {1:'B', 2:'C', ...}
     const ENUNCIADOS   = {1:'Texto breve', ...}  // para revisão
═══════════════════════════════════════════════════════ */

/* ── SUPABASE ── */
const SUPABASE_URL = 'https://debljvblrljehsscbtbo.supabase.co'
const SUPABASE_KEY = 'sb_publishable_CmhW_jV-uSxxcWcYRjGOzQ_1195fdpz'
const { createClient } = supabase
const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

/* ── ESTADO ── */
const respostas = {}
const acertos   = {}
let tempoRestante = TEMPO_MAX
let simuladoAtivo = true
let timerInterval = null

/* ════════════════════════════
   CRONÔMETRO
════════════════════════════ */
function iniciarTimer() {
  renderTimer()
  renderQmap()
  timerInterval = setInterval(() => {
    tempoRestante--
    renderTimer()
    if (tempoRestante <= 0) {
      clearInterval(timerInterval)
      finalizar(true)
    }
  }, 1000)
}

function renderTimer() {
  const m    = Math.floor(tempoRestante / 60).toString().padStart(2, '0')
  const s    = (tempoRestante % 60).toString().padStart(2, '0')
  const el   = document.getElementById('timerDisplay')
  const fill = document.getElementById('progressFill')
  el.textContent    = `${m}:${s}`
  fill.style.width  = (tempoRestante / TEMPO_MAX * 100) + '%'
  const urgent = tempoRestante <= 120
  el.classList.toggle('urgent', urgent)
  fill.classList.toggle('urgent', urgent)
}

/* ════════════════════════════
   MAPA DE QUESTÕES
════════════════════════════ */
function renderQmap() {
  const wrap = document.getElementById('qmap')
  wrap.innerHTML = ''
  for (let i = 1; i <= TOTAL_Q; i++) {
    const d = document.createElement('div')
    d.className  = 'qmap-dot'
    d.textContent = i
    d.id         = `dot${i}`
    d.onclick    = () => document.getElementById(`q${i}`).scrollIntoView({ behavior: 'smooth' })
    wrap.appendChild(d)
  }
}

function atualizarDot(qNum, ok) {
  const dot = document.getElementById(`dot${qNum}`)
  if (!dot) return
  dot.classList.add('answered')
  dot.style.background   = ok ? 'rgba(34,197,94,0.2)'   : 'rgba(248,113,113,0.15)'
  dot.style.color        = ok ? 'var(--green)'           : 'var(--error)'
  dot.style.borderColor  = ok ? 'rgba(34,197,94,0.4)'   : 'rgba(248,113,113,0.3)'
}

/* ════════════════════════════
   SELECIONAR ALTERNATIVA
════════════════════════════ */
function selecionar(qNum, letra) {
  if (!simuladoAtivo || acertos[qNum] !== undefined) return
  respostas[qNum] = letra
  const letras = ['A', 'B', 'C', 'D', 'E']
  document.querySelectorAll(`#opts${qNum} .option`).forEach((o, i) => {
    o.classList.toggle('selected', letras[i] === letra)
  })
  document.getElementById(`btn${qNum}`).disabled = false
}

/* ════════════════════════════
   CONFIRMAR RESPOSTA
════════════════════════════ */
function confirmar(qNum) {
  const resp = respostas[qNum]
  if (!resp) return
  const gab = GABARITOS[qNum]
  const ok  = resp === gab
  acertos[qNum] = ok

  const letras = ['A', 'B', 'C', 'D', 'E']
  document.querySelectorAll(`#opts${qNum} .option`).forEach((o, i) => {
    o.disabled = true
    if (letras[i] === gab)               o.classList.add('correct')
    else if (letras[i] === resp && !ok)  o.classList.add('wrong-pick')
    o.classList.remove('selected')
  })

  const gabEl = document.getElementById(`gab${qNum}`)
  gabEl.classList.add('show')
  if (!ok) {
    gabEl.classList.add('wrong-gab')
    gabEl.querySelector('.gab-title').textContent = `✗ Você marcou ${resp} · Correto: ${gab}`
  }

  document.getElementById(`q${qNum}`).classList.add(ok ? 'answered' : 'wrong')
  document.getElementById(`btn${qNum}`).style.display = 'none'
  atualizarDot(qNum, ok)

  const pendentes = TOTAL_Q - Object.keys(acertos).length
  if (pendentes === 0) {
    document.getElementById('msgPendentes').textContent = 'Todas as questões respondidas. Clique em finalizar!'
  }
}

/* ════════════════════════════
   FINALIZAR
════════════════════════════ */
async function finalizar(tempoEsgotado = false) {
  if (!simuladoAtivo) return

  const pendentes = TOTAL_Q - Object.keys(acertos).length
  if (pendentes > 0 && !tempoEsgotado) {
    const msg = document.getElementById('msgPendentes')
    msg.textContent = `Atenção: ${pendentes} questão(ões) ainda não confirmada(s).`
    msg.style.color = 'var(--amber)'
    if (!confirm(`Você tem ${pendentes} questão(ões) sem resposta. Deseja finalizar mesmo assim?`)) return
  }

  simuladoAtivo = false
  clearInterval(timerInterval)

  const tempoGasto    = TEMPO_MAX - tempoRestante
  const totalAcertos  = Object.values(acertos).filter(Boolean).length
  const score         = Math.round((totalAcertos / TOTAL_Q) * 100)
  const acertosArr    = Array.from({ length: TOTAL_Q }, (_, i) => acertos[i + 1] ?? false)

  // Exibe tela de resultado
  document.getElementById('timerBarWrap').style.display  = 'none'
  document.getElementById('telaSimulado').style.display  = 'none'
  document.getElementById('telaResultado').style.display = 'block'
  window.scrollTo(0, 0)

  // Preenche resultado
  const scoreEl = document.getElementById('resScore')
  scoreEl.textContent = score + '%'
  scoreEl.className   = 'resultado-score' + (score < 70 ? (score < 50 ? ' baixo' : ' medio') : '')

  document.getElementById('resEmoji').textContent   = score >= 80 ? '🏆' : score >= 60 ? '👍' : score >= 40 ? '📚' : '💪'
  document.getElementById('resTitulo').textContent  = score >= 80 ? 'Excelente!' : score >= 60 ? 'Bom trabalho!' : score >= 40 ? 'Continue praticando!' : 'Não desista!'
  document.getElementById('resDetalhe').textContent = `${totalAcertos} de ${TOTAL_Q} questões corretas`
  document.getElementById('resAcertos').textContent = totalAcertos
  document.getElementById('resErros').textContent   = TOTAL_Q - totalAcertos
  document.getElementById('resTempo').textContent   = formatarTempo(tempoGasto)

  await salvarResultado(score, tempoGasto, acertosArr)
  preencherRevisao()
}

/* ════════════════════════════
   SALVAR NO SUPABASE
════════════════════════════ */
async function salvarResultado(score, tempo, acertosArr) {
  const statusEl = document.getElementById('saveStatus')
  const { data: { session } } = await sb.auth.getSession()

  if (!session) {
    statusEl.className   = 'save-status err'
    statusEl.textContent = 'Resultado não salvo — faça login para registrar seu desempenho.'
    return
  }

  const { error } = await sb.from('resultados').insert({
    user_id:  session.user.id,
    simulado: SIMULADO_ID,
    score,
    tempo,
    acertos:  acertosArr
  })

  statusEl.className   = error ? 'save-status err' : 'save-status ok'
  statusEl.textContent = error ? 'Erro ao salvar resultado.' : '✓ Resultado salvo no seu histórico.'
}

/* ════════════════════════════
   REVISÃO POR QUESTÃO
════════════════════════════ */
function preencherRevisao() {
  let html = ''
  for (let i = 1; i <= TOTAL_Q; i++) {
    const ok   = acertos[i]
    const resp = respostas[i] || '—'
    const gab  = GABARITOS[i]
    html += `
      <div class="revisao-item ${ok ? 'certo' : 'errado'}">
        <span class="revisao-icon">${ok ? '✅' : '❌'}</span>
        <div class="revisao-text">
          <strong>Q${i} · ${ENUNCIADOS[i]}</strong><br>
          Sua resposta: <strong>${resp}</strong> · Gabarito: <strong>${gab}</strong>
        </div>
      </div>`
  }
  document.getElementById('revisaoLista').innerHTML = html
}

function mostrarRevisao() {
  const s = document.getElementById('revisaoSection')
  s.style.display = s.style.display === 'none' ? 'block' : 'none'
}

/* ════════════════════════════
   UTILS
════════════════════════════ */
function formatarTempo(seg) {
  return `${Math.floor(seg / 60)}m ${(seg % 60).toString().padStart(2, '0')}s`
}

/* ── INIT ── */
iniciarTimer()
