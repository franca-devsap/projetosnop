# Agent Guide - ZSD Forecast Unrestricted UI5

Este arquivo deve ser lido antes de qualquer alteracao no projeto. Ele existe para manter o contexto do prototipo, respeitar os padroes ja criados e evitar que novas implementacoes sejam feitas fora da arquitetura SAP Fiori UI5 Freestyle validada.

## Contexto do Projeto

- Aplicacao: `zsd.forecast.unrestricted`
- Tipo: SAP UI5 Freestyle, sem SAP Fiori Elements.
- Objetivo: montar previsao irrestrita para LTP 2026 a partir de Carteira, Cotacoes, Budget e Faturado, permitindo salvar previsoes em ambiente localhost.
- Entrada principal: `webapp/view/App.view.xml`
- Controller principal: `webapp/controller/App.controller.js`
- Dados mock e persistencia local: `webapp/model/mockData.json`
- Textos traduziveis: `webapp/i18n/i18n.properties`
- Descriptor UI5: `webapp/manifest.json`
- Estilos existentes: `webapp/css/style.css`

## Ordem Obrigatoria de Leitura

Antes de implementar qualquer alteracao relevante, leia nesta ordem:

1. `claude/agents/agent.md`
2. `claude/skills/SKILL.md`
3. `claude/skills/fiori-ui5-demokit-lookup.md`
4. `claude/skills/fiori-local-json-persistence.md`
5. Arquivos em `claude/agents/` relacionados ao tipo de mudanca:
   - `fiori-architect.md` para arquitetura e regras gerais.
   - `fiori-frontend.md` para layout, UX, CSS e comportamento visual.
   - `fiori-data-modeler.md` para modelagem de dados, value helps e estrutura de mocks.
   - `fiori-rap-architect.md` quando houver preparacao para backend SAP/RAP.
6. Nao utilizar `_claude/` como referencia ativa. Essa pasta e legado e deve ser ignorada em novas analises, implementacoes e revisoes.

## Regras de Implementacao

- Use SAPUI5 Freestyle e componentes padrao SAP Fiori UI5 sempre que possivel.
- Antes de criar ou alterar controles UI5, consulte o padrao descrito em `claude/skills/fiori-ui5-demokit-lookup.md`.
- Priorize a versao UI5 `1.147.2` no Demo Kit quando houver necessidade de validacao de controle, propriedade, agregacao ou exemplo.
- Nao usar SAP Fiori Elements neste prototipo.
- Nao criar CSS novo para resolver layout quando houver componente, propriedade ou classe padrao UI5/Fiori que resolva o problema.
- Nao remover CSS existente sem pedido explicito, pois o layout atual ja passou por validacoes visuais.
- Manter textos de tela em `webapp/i18n/i18n.properties` e consumir via modelo `i18n`.
- Evitar textos hardcoded em XML, controller e JSON quando forem rotulos de UI.
- Preservar a estrutura de primeira tela List Report e o fluxo para o app de montagem de previsao.

## Regras de Dados e Persistencia

- Nao recriar arrays grandes hardcoded no controller.
- Dados de negocio devem ficar em `webapp/model/mockData.json`.
- O controller pode manter cache runtime, mas a origem dos mocks deve permanecer no JSON.
- Ao alterar dados mock, preservar a organizacao por finalidade:
  - `monthly` para series mensais.
  - `texts` para textos de centros, equipes e value helps.
  - `sourceRows` para Carteira e Cotacoes.
  - `budgetRows` para Budget.
  - `forecastRows` e `savedForecastRows` para Previsao Irrestrita.
- Para persistencia localhost, seguir `claude/skills/fiori-local-json-persistence.md`.
- A aplicacao deve continuar funcionando com fallback em `localStorage`.
- Quando mudar estrutura de dados, considerar atualizar a chave de storage para evitar cache antigo do navegador.

## Regras de UX do Prototipo

- O grafico central deve servir para comparacao mensal.
- Filtros por mes nas abas devem filtrar a tabela, sem descaracterizar a comparacao mensal do grafico.
- Carteira, Cotacoes, Budget e Previsao Irrestrita devem ser tratados como composicao de previsao quando selecionados/salvos.
- Itens enviados para Previsao Irrestrita devem permanecer somente leitura, salvo se o usuario pedir explicitamente campos editaveis.
- Budget selecionado deve compor a mesma coluna/barra de previsao quando o objetivo for completar Carteira + Cotacoes + Budget + Faturado.
- O faturado do ano corrente deve aparecer na tabela inferior quando solicitado, sem poluir o grafico principal se o usuario pedir para retirar.
- Valores devem usar formatacao dinamica:
  - Exibir em milhoes apenas quando o total atingir a casa de milhoes.
  - Caso contrario, manter o valor base em reais.

## Arquivos que Exigem Cuidado

- `webapp/view/App.view.xml`
  - Concentrar controles XML, bindings, tabelas, abas, FilterBar, cards e VizFrame.
  - Conferir namespaces e agregacoes antes de editar.
- `webapp/controller/App.controller.js`
  - Concentrar orquestracao, filtros, selecoes, calculos mensais, persistencia e decoracao de linhas.
  - Evitar aumentar indefinidamente o controller com grandes blocos de dados.
- `webapp/model/mockData.json`
  - Fonte dos dados mock.
  - Validar JSON depois de qualquer alteracao.
- `webapp/i18n/i18n.properties`
  - Fonte dos textos de UI.
  - Nao duplicar rotulos em XML/controller.
- `webapp/css/style.css`
  - Preservar estilos validados.
  - Alterar somente quando necessario e com escopo pequeno.
- `server.mjs`
  - Usado para persistencia JSON local.
  - Validar quando endpoint ou escrita de arquivo mudar.

## Validacao Antes de Entregar

Quando alterar JavaScript:

```powershell
node --check webapp/controller/App.controller.js
```

Quando alterar servidor local:

```powershell
node --check server.mjs
```

Quando alterar JSON:

```powershell
node -e "JSON.parse(require('fs').readFileSync('webapp/model/mockData.json','utf8')); console.log('mockData.json OK')"
```

Quando alterar XML:

- Conferir se os namespaces estao corretos.
- Conferir se os bindings existem no modelo `app` ou `i18n`.
- Evitar controles fora das bibliotecas declaradas em `manifest.json`.

## Scripts do Projeto

Comandos principais em `package.json`:

```powershell
npm start
npm run start-local
npm run start-noflp
npm run start-json
npm run build
```

- `npm start`: fluxo principal com Fiori tools e FLP sandbox.
- `npm run start-json`: servidor local com capacidade de persistir `mockData.json`.
- `npm run start-noflp`: abre a aplicacao sem FLP.

## Padrao de Resposta ao Usuario

- Responder em portugues quando o usuario pedir em portugues.
- Ser direto sobre quais arquivos foram alterados.
- Informar validacoes executadas.
- Quando nao for possivel validar, explicar o motivo.
- Nao sugerir refatoracoes grandes se a tarefa for pontual.
- Manter o foco no prototipo SAP Fiori UI5 Freestyle e no fluxo de montagem de Previsao Irrestrita.
