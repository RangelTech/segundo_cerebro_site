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

  // planos: mensal ou anual (anual = 10 meses pagos, 2 de graça, em até 12x no cartão). Sem link do checkout o botão fica "Em breve";
  // com link, o botão abre o modal que oferece a máquina virtual
  var modal = $('#modal-plano')
  var ultimoFoco = null
  var ciclo = 'anual'  // o anual já abre selecionado
  var MESES = C.mesesAnual || 10
  function num(n) {
    var cent = Math.abs(n - Math.round(n)) > 0.004
    return n.toLocaleString('pt-BR', { minimumFractionDigits: cent ? 2 : 0, maximumFractionDigits: cent ? 2 : 0 })
  }
  function brl(n) { return 'R$ ' + num(n) }
  function checkoutDe(id) { return ((ciclo === 'anual' ? C.checkoutAnual : C.checkout) || {})[id] }
  function checkoutVmDe(id) { return ((ciclo === 'anual' ? C.checkoutVmAnual : C.checkoutVm) || {})[id] }
  function precos(mensal) {  // mensal: preço do mês cheio; no anual o cliente paga MESES vezes e o equivalente mensal é anual / 12
    var anual = mensal * MESES
    return { mensal: mensal, anual: anual, equiv: anual / 12, economia: mensal * 12 - anual }
  }
  // preço grande com os centavos pequenos em cima: R$ 205,83 -> "R$ 205" + ",83"
  function precoGrande(n) {
    var inteiro = Math.floor(n + 1e-9)
    var cent = Math.round((n - inteiro) * 100)
    return 'R$ ' + inteiro.toLocaleString('pt-BR') + (cent ? '<sup>,' + String(cent).padStart(2, '0') + '</sup>' : '')
  }
  function descontoPct(mensal) { var q = precos(mensal); return Math.round(100 * q.economia / (q.mensal * 12)) }
  function precoHtml(mensal) {
    var q = precos(mensal)
    if (ciclo === 'anual') {
      return '<span class="rev"><s>' + brl(q.mensal) + '</s><span class="selo">-' + descontoPct(mensal) + '%</span></span>' +
        '<span class="gr">' + precoGrande(q.equiv) + '<small class="eq">/mês</small></span><span class="noanual">no plano anual</span>'
    }
    return '<span class="gr">' + precoGrande(q.mensal) + '<small class="eq">/mês</small></span>'
  }
  function infoHtml(mensal) {
    var q = precos(mensal)
    if (ciclo === 'anual') {
      return '<span class="eco">Economize ' + brl(q.economia) + '</span><br><span class="legal">Cobrado anualmente: ' + brl(q.anual) + ' por ano, em até 12x no cartão.</span>'
    }
    return '<button type="button" class="link-anual" data-ir-anual>Assine o anual e pague menos</button><br><span class="legal">Cobrado todo mês no cartão de crédito.</span>'
  }
  function pintarCard(card) {
    var p = card.querySelector('.p')
    if (!p) return
    if (!card.dataset.mensal) card.dataset.mensal = String(parseInt((p.textContent || '').replace(/\D/g, ''), 10) || 0)
    var mensal = +card.dataset.mensal
    var info = card.querySelector('.anual-info')
    if (!info) { info = document.createElement('p'); info.className = 'anual-info'; p.insertAdjacentElement('afterend', info) }
    p.classList.add('mkt')
    p.innerHTML = precoHtml(mensal)
    info.innerHTML = infoHtml(mensal)
    info.hidden = false
  }
  function aplicarCiclo() {
    $$('[data-plano]').forEach(function (a) {
      var url = checkoutDe(a.dataset.plano)
      if (!url) return
      a.href = url
      pintarCard(a.closest('.plano'))
    })
    $$('.alterna button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.ciclo === ciclo ? 'true' : 'false') })
    var np = $('#nota-planos')
    if (np) np.textContent = ciclo === 'anual'
      ? 'No anual você paga 10 meses e usa 12: são 2 meses de graça, cobrados anualmente, em até 12x no cartão de crédito. Cancele pela Cakto quando quiser; o acesso vale até o fim do período pago.'
      : 'Sem fidelidade: cancele pela Cakto quando quiser, e o acesso vale até o fim do mês pago. Pagamento por cartão de crédito. Assine o anual e leve 2 meses de graça.'
    var nv = $('#nota-vm')
    if (nv) nv.textContent = ciclo === 'anual'
      ? 'Para concessionárias, clínicas, agências e escritórios que não querem instalar nada. No anual são 2 meses de graça, cobrados anualmente, em até 12x no cartão de crédito.'
      : 'Para concessionárias, clínicas, agências e escritórios que não querem instalar nada. Pagamento por cartão de crédito. No anual você ganha 2 meses de graça.'
  }
  function fecharModal() {
    if (!modal || modal.hidden) return
    modal.hidden = true
    document.body.classList.remove('modal-aberto')
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus()
  }
  function pintarModal(botao) {
    var id = botao.dataset.plano
    var card = botao.closest('.plano')
    var mensal = +card.dataset.mensal
    var vm = C.precoVm || 399
    var cheio = mensal + vm
    var q = precos(mensal)
    $('#mp-titulo').textContent = card.querySelector('h3').textContent + (ciclo === 'anual' ? ' anual' : '')
    $('#mp-preco').className = 'p mkt'
    $('#mp-preco').innerHTML = precoHtml(mensal)
    var info = $('#mp-anual')
    if (info) { info.hidden = false; info.innerHTML = infoHtml(mensal) }
    var soma = $('#mp-soma')
    if (ciclo === 'anual') {
      var qc = precos(cheio)
      soma.innerHTML = '<b>+ ' + brl(vm * MESES / 12) + '</b> por mês no anual (de <s>' + brl(vm) + '</s>). Total: <b>' + brl(qc.equiv) + '</b> por mês. <span class="legal">Cobrado anualmente: ' + brl(qc.anual) + ' por ano, em até 12x no cartão. Você economiza ' + brl(qc.economia) + '.</span>'
    } else {
      soma.innerHTML = '<b>+ ' + brl(vm) + '</b> por mês, somados ao plano. Total: <b>' + brl(cheio) + '</b> por mês. <span class="legal">Cobrado todo mês no cartão de crédito.</span>'
    }
    var sim = $('#mp-sim'), nao = $('#mp-nao')
    sim.href = checkoutVmDe(id) || checkoutDe(id)
    nao.href = checkoutDe(id)
    $$('.alterna button', modal).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.ciclo === ciclo ? 'true' : 'false') })
  }
  function abrirModal(botao) {
    var card = botao.closest('.plano')
    var lista = $('#mp-lista')
    $('#mp-lista').innerHTML = ''
    $$('li', card).forEach(function (li) { var n = document.createElement('li'); n.textContent = li.textContent; lista.appendChild(n) })
    ultimoFoco = botao
    modal._botao = botao
    pintarModal(botao)
    modal.hidden = false
    document.body.classList.add('modal-aberto')
    $('#mp-nao').focus({ preventScroll: true })
    var caixa = $('.modal-caixa'); if (caixa) caixa.scrollTop = 0
  }
  $$('[data-plano]').forEach(function (a) {
    var id = a.dataset.plano
    if (!(C.checkout || {})[id]) { a.setAttribute('aria-disabled', 'true'); a.removeAttribute('href'); a.textContent = 'Em breve'; return }
    a.href = C.checkout[id]; a.rel = 'noopener'  // sem o modal o botão ainda leva ao checkout do plano
    if (modal && id !== 'vm' && (C.checkoutVm || {})[id]) a.addEventListener('click', function (e) { e.preventDefault(); abrirModal(a) })
  })
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-ir-anual]')
    if (!t) return
    ciclo = 'anual'
    aplicarCiclo()
    if (modal && !modal.hidden && modal._botao) pintarModal(modal._botao)
  })
  $$('.alterna button').forEach(function (b) {
    b.addEventListener('click', function () {
      ciclo = b.dataset.ciclo
      aplicarCiclo()
      if (modal && !modal.hidden && modal._botao) pintarModal(modal._botao)
    })
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
  aplicarCiclo()
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
  // Versão e links vêm do nosso servidor (que não depende da API do GitHub e guarda a última versão boa). Se falhar, ficam os links fixos do HTML.
  if (C.api && window.fetch) {
    fetch(C.api.replace(/\/+$/, '') + '/v1/app/latest')
      .then(function (r) { return r.ok ? r.json() : Promise.reject() })
      .then(function (rel) {
        $$('[data-asset]').forEach(function (a) { var u = rel.assets && rel.assets[a.dataset.asset]; if (u) a.href = u })
        var v = $('#versao')
        if (v && rel.version) v.innerHTML = 'Versão atual: <b>' + rel.version + '</b>. Todas as versões em <a href="https://github.com/' + C.repo + '/releases">GitHub</a>.'
      })
      .catch(function () {})
  }
})()
