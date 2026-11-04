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

  // planos: sem link do checkout configurado o botão fica "Em breve"
  $$('[data-plano]').forEach(function (a) {
    var url = (C.checkout || {})[a.dataset.plano]
    if (url) { a.href = url; a.rel = 'noopener' }
    else { a.setAttribute('aria-disabled', 'true'); a.removeAttribute('href'); a.textContent = 'Em breve' }
  })
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
    'win-setup': /Instalador.*\.exe$/i, 'win-portable': /Portatil.*\.exe$/i,
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
