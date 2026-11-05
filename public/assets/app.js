// Comportamento do site: tema, menu no celular, plano -> checkout da Cakto, download por sistema (links reais da última release).
(function () {
  var C = window.BRAIN || {}
  var $ = function (s, r) { return (r || document).querySelector(s) }
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) }

  // tema: claro, escuro ou o do sistema; lembra a escolha (sem quebrar se o navegador bloquear o armazenamento)
  var tema = $('#tema')
  if (tema) tema.addEventListener('click', function () {
    var atual = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    var prox = atual === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = prox
    try { localStorage.setItem('tema', prox) } catch (e) {}
  })

  var burger = $('#burger'), menu = $('#menu')
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var aberto = menu.classList.toggle('aberto')
      burger.setAttribute('aria-expanded', aberto ? 'true' : 'false')
    })
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('aberto'); burger.setAttribute('aria-expanded', 'false') }) })
  }

  // planos: sem link do checkout configurado o botão fica "Em breve"; com link, o botão abre o modal que oferece a máquina virtual
  var modal = $('#modal-plano')
  var ultimoFoco = null
  function brl(n) { return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
  function fecharModal() {
    if (!modal || modal.hidden) return
    modal.hidden = true
    document.body.classList.remove('modal-aberto')
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus()
  }
  function abrirModal(botao) {
    var id = botao.dataset.plano
    var card = botao.closest('.plano')
    var preco = parseInt(((card.querySelector('.p') || {}).textContent || '').replace(/\D/g, ''), 10) || 0
    $('#mp-titulo').textContent = card.querySelector('h3').textContent
    $('#mp-preco').innerHTML = brl(preco) + '<small> /mês</small>'
    var lista = $('#mp-lista')
    lista.innerHTML = ''
    $$('li', card).forEach(function (li) { var n = document.createElement('li'); n.textContent = li.textContent; lista.appendChild(n) })
    $('#mp-total').textContent = brl(preco + (C.precoVm || 399))
    var sim = $('#mp-sim'), nao = $('#mp-nao')
    sim.href = (C.checkoutVm || {})[id] || C.checkout[id]
    nao.href = C.checkout[id]
    ultimoFoco = botao
    modal.hidden = false
    document.body.classList.add('modal-aberto')
    nao.focus({ preventScroll: true })
    var caixa = $('.modal-caixa'); if (caixa) caixa.scrollTop = 0
  }
  $$('[data-plano]').forEach(function (a) {
    var id = a.dataset.plano
    var url = (C.checkout || {})[id]
    if (!url) { a.setAttribute('aria-disabled', 'true'); a.removeAttribute('href'); a.textContent = 'Em breve'; return }
    a.href = url; a.rel = 'noopener'  // sem o modal o botão ainda leva ao checkout do plano
    if (modal && id !== 'vm' && (C.checkoutVm || {})[id]) a.addEventListener('click', function (e) { e.preventDefault(); abrirModal(a) })
  })
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.hasAttribute('data-fechar')) fecharModal() })
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return
      if (e.key === 'Escape') fecharModal()
      if (e.key === 'Tab') {  // mantém o foco dentro do modal
        var f = $$('a[href], button', modal).filter(function (x) { return x.offsetParent !== null })
        if (!f.length) return
        var ini = f[0], fim = f[f.length - 1]
        if (e.shiftKey && document.activeElement === ini) { e.preventDefault(); fim.focus() }
        else if (!e.shiftKey && document.activeElement === fim) { e.preventDefault(); ini.focus() }
      }
    })
  }
  var web = $('[data-web]')
  if (web && C.web) web.href = C.web

  // sistema do visitante
  var ua = (navigator.userAgentData && navigator.userAgentData.platform || navigator.platform || '') + ' ' + navigator.userAgent
  var os = /Win/i.test(ua) ? 'win' : /Mac/i.test(ua) && !/iPhone|iPad/i.test(ua) ? 'mac' : /Linux|X11/i.test(ua) && !/Android/i.test(ua) ? 'linux' : ''
  var nomes = { win: 'Windows', mac: 'macOS', linux: 'Linux' }
  if (os) {
    var card = $('.down[data-os="' + os + '"]')
    if (card) card.classList.add('sug')
    var g = $('[data-baixar-grande]')
    if (g) g.textContent = 'Baixar para ' + nomes[os]
  }

  // links diretos da última release (a API do GitHub aceita chamada do navegador); se falhar, ficam na página de releases
  var casar = {
    'win-setup': /Windows\.exe$/i, 'win-portable': /Portatil\.exe$/i,
    'mac-arm': /mac-arm64\.dmg$/i, 'mac-intel': /mac-x64\.dmg$/i,
    'linux-appimage': /\.AppImage$/i, 'linux-deb': /\.deb$/i,
  }
  if (C.repo && window.fetch) {
    fetch('https://api.github.com/repos/' + C.repo + '/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject() })
      .then(function (rel) {
        var ativos = rel.assets || []
        $$('[data-asset]').forEach(function (a) {
          var re = casar[a.dataset.asset]
          var f = ativos.filter(function (x) { return re && re.test(x.name) })[0]
          if (f) { a.href = f.browser_download_url; a.title = f.name + ' · ' + Math.round(f.size / 1048576) + ' MB' }
        })
        var v = $('#versao')
        if (v && rel.tag_name) v.innerHTML = 'Versão atual: <b>' + rel.tag_name.replace(/^v/, '') + '</b>. Todas as versões em <a href="https://github.com/' + C.repo + '/releases">GitHub</a>.'
      })
      .catch(function () {})
  }
})()
