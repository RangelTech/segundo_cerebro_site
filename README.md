# segundo_cerebro_site

Site de venda do Segundo Cérebro (`https://brain.rangeltech.net`). HTML, CSS e JS estáticos servidos por nginx, sem etapa de build.

- `public/assets/config.js`: `checkout.pro|max|ultra|infinity|vm` (links `https://pay.cakto.com.br/<oferta>`), `web` (acesso pelo navegador) e `api` (llm-access). Link vazio faz o botão mostrar "Em breve".
- Download: o JS lê a última release de `RangelTech/second-brain` e aponta cada botão para o instalador do sistema do visitante.
- `public/definir-senha/`: página do link de definir senha (chama `/v1/auth/set-password` do `llm-access`).
- Seção "Máquina virtual": plano com computador dedicado na nuvem, acessado pelo navegador.

## Rodar e lançar

Prévia local: `python -m http.server 9710 --directory public`.

Versão: tag `v*` gera a imagem e o manifesto. O deploy é só pelo `vps_rt_infra`: `gh workflow run release-intake.yml` e depois `gh workflow run deploy.yml -f service=brain-site`.

Para trocar um link de checkout, edite `config.js` e lance uma versão nova. Os produtos e ofertas ficam na Cakto (ids em `personal-skills/secrets/cakto.env`).

Mapa geral do ecossistema: skill `ecossistema_rt` (repositório `personal-skills`).
