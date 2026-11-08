// Copia o bloco de planos de public/index.html para o paywall de public/testar/index.html (mesmos cards, preços e botões de checkout).
// Rode depois de mudar os planos no site: node sincronizar-testar.js
const fs = require('fs')
const idx = fs.readFileSync('public/index.html', 'utf8')
const ini = idx.indexOf('<section id="planos"')
const fim = idx.indexOf('</section>', ini) + '</section>'.length
if (ini < 0) throw new Error('bloco de planos nao encontrado em public/index.html')
const bloco = idx.slice(ini, fim).replace('<section id="planos" class="alt">', '<section id="planos-testar" class="alt">').replace('<h2>Planos</h2>', '<h2>Escolha o seu plano</h2>')
let t = fs.readFileSync('public/testar/index.html', 'utf8')
const marca = /<!--PLANOS-->|<!--PLANOS-INI-->[\s\S]*?<!--PLANOS-FIM-->/
if (!marca.test(t)) throw new Error('marca <!--PLANOS--> nao encontrada em public/testar/index.html')
t = t.replace(marca, () => '<!--PLANOS-INI-->\n' + bloco + '\n    <!--PLANOS-FIM-->')
fs.writeFileSync('public/testar/index.html', t)
console.log('planos sincronizados:', bloco.length, 'caracteres')
