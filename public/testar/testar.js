// Teste grátis do Segundo Cérebro: cadastro, código por e-mail, chat de 5 perguntas e, quando acabam, os planos.
// Fala só com a API pública /v1/free/* (sem chave de API): o servidor conta as perguntas e recusa a sexta com 402.
(function () {
  var API = ((window.BRAIN && window.BRAIN.api) || 'https://qwen.rangeltech.net').replace(/\/+$/, '')
  var $ = function (id) { return document.getElementById(id) }
  var CH = 'sbfree'
  var sessao = null // { token, email }
  var historico = [] // { role, content }
  var ocupado = false
  var modo = 'criar'

  function guardar() { try { if (sessao) localStorage.setItem(CH, JSON.stringify(sessao)); else localStorage.removeItem(CH) } catch (e) {} }
  function ler() { try { return JSON.parse(localStorage.getItem(CH) || 'null') } catch (e) { return null } }
  function tela(qual) { ['t-auth', 't-cod', 't-chat'].forEach(function (id) { $(id).hidden = id !== qual }) }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) }

  function api(rota, corpo, token) {
    var h = { 'Content-Type': 'application/json' }
    if (token) h.Authorization = 'Bearer ' + token
    return fetch(API + rota, { method: corpo === undefined ? 'GET' : 'POST', headers: h, body: corpo === undefined ? undefined : JSON.stringify(corpo) })
  }
  function msgErro(j, padrao) { return (j && j.error && j.error.message) || padrao || 'Algo deu errado. Tente de novo.' }
  function codErro(j) { return j && j.error && j.error.code }

  // ---------- cadastro / entrar ----------
  function aba(m) {
    modo = m
    $('aba-criar').setAttribute('aria-selected', m === 'criar')
    $('aba-entrar').setAttribute('aria-selected', m === 'entrar')
    $('c-nome').hidden = m !== 'criar'
    $('dica-senha').hidden = m !== 'criar'
    $('senha').autocomplete = m === 'criar' ? 'new-password' : 'current-password'
    $('b-auth').textContent = m === 'criar' ? 'Criar conta e testar' : 'Entrar'
    $('e-auth').textContent = ''
  }
  $('aba-criar').onclick = function () { aba('criar') }
  $('aba-entrar').onclick = function () { aba('entrar') }

  $('f-auth').addEventListener('submit', function (e) {
    e.preventDefault()
    var email = $('email').value.trim(), senha = $('senha').value
    var erro = $('e-auth'); erro.textContent = ''
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return (erro.textContent = 'Informe um e-mail válido.')
    if (senha.length < 8) return (erro.textContent = 'A senha precisa de pelo menos 8 caracteres.')
    var b = $('b-auth'); b.disabled = true
    var req = modo === 'criar'
      ? api('/v1/free/signup', { email: email, password: senha, name: $('nome').value.trim(), website: $('website').value })
      : api('/v1/free/login', { email: email, password: senha })
    req.then(function (r) { return r.json().catch(function () { return {} }).then(function (j) { return { s: r.status, j: j } }) })
      .then(function (r) {
        b.disabled = false
        if (modo === 'criar' && r.s === 200) return pedirCodigo(email)
        if (modo === 'criar' && r.s === 409) { aba('entrar'); return ($('e-auth').textContent = 'Este e-mail já tem cadastro. Entre com a sua senha.') }
        if (modo === 'entrar' && r.s === 403 && codErro(r.j) === 'need_code') return pedirCodigo(email)
        if (r.s === 200 && r.j.paid) return ($('e-auth').textContent = r.j.message)
        if (r.s === 200 && r.j.token) return entrou({ token: r.j.token, email: email }, r.j)
        $('e-auth').textContent = msgErro(r.j)
      })
      .catch(function () { b.disabled = false; $('e-auth').textContent = 'Sem conexão com o servidor. Tente de novo.' })
  })

  // ---------- código ----------
  function pedirCodigo(email) { $('cod-email').textContent = email; $('codigo').value = ''; $('e-cod').textContent = ''; tela('t-cod'); $('codigo').focus() }
  $('f-cod').addEventListener('submit', function (e) {
    e.preventDefault()
    var email = $('cod-email').textContent, code = $('codigo').value.replace(/\D/g, '')
    if (code.length !== 6) return ($('e-cod').textContent = 'Digite os 6 números do código.')
    api('/v1/free/verify', { email: email, code: code }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j } }) })
      .then(function (r) { if (r.s === 200) entrou({ token: r.j.token, email: email }, r.j); else $('e-cod').textContent = msgErro(r.j) })
      .catch(function () { $('e-cod').textContent = 'Sem conexão com o servidor. Tente de novo.' })
  })
  $('b-reenviar').onclick = function () { api('/v1/free/resend', { email: $('cod-email').textContent }); $('e-cod').textContent = 'Enviamos um novo código.' }
  $('b-voltar').onclick = function () { tela('t-auth') }

  // ---------- chat ----------
  function contador(restam, limite) {
    $('cont').innerHTML = restam > 0
      ? 'Perguntas grátis: <b>' + restam + '</b> de ' + limite + ' restantes'
      : 'Suas perguntas grátis acabaram'
  }
  function entrou(s, estado) {
    sessao = s; guardar()
    historico = []; $('msgs').innerHTML = ''
    tela('t-chat')
    contador(estado.remaining, estado.limit)
    boasVindas()
    if (estado.remaining <= 0) acabou()
    else $('pergunta').focus()
  }
  function boasVindas() { add('sis', 'Pergunte o que quiser. Aqui não tem filtro de conteúdo.') }
  function add(tipo, texto) {
    var d = document.createElement('div'); d.className = 't-msg ' + tipo
    if (tipo === 'ia') d.innerHTML = fmt(texto); else d.textContent = texto
    $('msgs').appendChild(d); $('msgs').scrollTop = $('msgs').scrollHeight
    return d
  }
  function fmt(t) { // markdown mínimo: blocos de código, negrito e código em linha (tudo escapado antes)
    var s = esc(t)
    s = s.replace(/```[a-z]*\n?([\s\S]*?)```/g, function (_m, c) { return '<pre><code>' + c + '</code></pre>' })
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
    return s
  }
  function acabou() {
    contador(0, 5)
    $('pergunta').disabled = true; $('b-env').disabled = true; $('sug').hidden = true
    $('pw-email').textContent = sessao ? sessao.email : ''
    $('paywall').hidden = false
    setTimeout(function () { $('paywall').scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 300)
  }

  function enviar(texto) {
    if (ocupado || !texto.trim()) return
    ocupado = true; $('e-chat').textContent = ''; $('sug').hidden = true
    $('b-env').disabled = true
    historico.push({ role: 'user', content: texto })
    add('eu', texto)
    var bolha = add('ia', ''); bolha.innerHTML = '<span class="t-dig"></span><span class="t-dig"></span><span class="t-dig"></span>'
    var resp = '', fim = null
    fetch(API + '/v1/free/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sessao.token }, body: JSON.stringify({ messages: historico }) })
      .then(function (r) {
        if (r.status === 402) { bolha.remove(); historico.pop(); acabou(); return null }
        if (r.status === 401) { bolha.remove(); historico.pop(); sair(); $('e-auth').textContent = 'Sua sessão expirou. Entre de novo.'; return null }
        if (!r.ok) return r.json().catch(function () { return {} }).then(function (j) { throw new Error(msgErro(j, 'A IA está ocupada. Tente de novo.')) })
        var leitor = r.body.getReader(), dec = new TextDecoder(), buf = ''
        function ler() {
          return leitor.read().then(function (x) {
            if (x.done) return
            buf += dec.decode(x.value, { stream: true })
            var i
            while ((i = buf.indexOf('\n')) >= 0) {
              var l = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
              if (l.indexOf('data:') !== 0 || l.indexOf('[DONE]') >= 0) continue
              try {
                var j = JSON.parse(l.slice(5))
                var c = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content
                if (c) { resp += c; bolha.innerHTML = fmt(resp); $('msgs').scrollTop = $('msgs').scrollHeight }
                if (j.free) fim = j.free
                if (j.error) throw new Error(j.error.message)
              } catch (er) { if (er.message && er.message.indexOf('JSON') < 0 && er.name !== 'SyntaxError') throw er }
            }
            return ler()
          })
        }
        return ler()
      })
      .then(function () {
        if (resp) historico.push({ role: 'assistant', content: resp })
        else if (!bolha.isConnected) return
        else { bolha.remove(); historico.pop() }
        if (fim) { contador(fim.remaining, fim.limit); if (fim.limit_reached) acabou() }
      })
      .catch(function (er) {
        if (bolha.isConnected && !resp) bolha.remove()
        historico.pop()
        $('e-chat').textContent = (er && er.message) || 'Sem conexão. Tente de novo (sua pergunta não foi descontada).'
      })
      .then(function () { ocupado = false; if (!$('pergunta').disabled) { $('b-env').disabled = false; $('pergunta').focus() } })
  }

  $('f-chat').addEventListener('submit', function (e) { e.preventDefault(); var t = $('pergunta').value; $('pergunta').value = ''; $('pergunta').style.height = 'auto'; enviar(t) })
  $('pergunta').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('f-chat').requestSubmit() } })
  $('pergunta').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(160, this.scrollHeight) + 'px' })
  Array.prototype.forEach.call($('sug').querySelectorAll('button'), function (b) { b.onclick = function () { enviar(b.textContent) } })

  function sair() { sessao = null; guardar(); historico = []; $('paywall').hidden = true; $('pergunta').disabled = false; $('b-env').disabled = false; $('sug').hidden = false; tela('t-auth') }
  $('b-sair').onclick = sair

  // ---------- partida: já tem sessão? ----------
  aba('criar')
  sessao = ler()
  if (!sessao) return tela('t-auth')
  api('/v1/free/me', undefined, sessao.token).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j } }) })
    .then(function (r) {
      if (r.s !== 200) return sair()
      if (r.j.paid) { sair(); return ($('e-auth').textContent = 'Você já é assinante: entre pelo aplicativo ou em remoto.rangeltech.net.') }
      entrou(sessao, r.j)
    })
    .catch(function () { tela('t-auth') })
})()
