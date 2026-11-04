# segundo_cerebro_site

Site de vendas do Segundo Cérebro (https://brain.rangeltech.net). HTML, CSS e JS estáticos servidos por nginx; sem build.

- `public/` o site. `public/assets/config.js`: links de checkout da Cakto (`checkout.pro|max|ultra`); enquanto vazios, os botões mostram "Em breve".
- Download: o JS lê a última release de `RangelTech/second-brain` (API do GitHub) e aponta cada botão para o instalador certo.
- `public/definir-senha/`: página do link de definir senha (chama `/v1/auth/set-password` do llm-access).
- Release: tag `v*` gera a imagem e o manifesto; o deploy é só pelo `vps_rt_infra` (stack `brain-site`).
- Preview local: `python -m http.server 9710 --directory public`.
