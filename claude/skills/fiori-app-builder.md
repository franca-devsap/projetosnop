# Fiori App Builder

Use este guia para continuar a evolucao do aplicativo SAPUI5 freestyle de Montagem de Previsao Irrestrita.

## Contexto do app

- Projeto: `zsd-forecast-unrestricted-ui5`
- View principal: `webapp/view/App.view.xml`
- Controller principal: `webapp/controller/App.controller.js`
- Estilos: `webapp/css/style.css`
- Textos: `webapp/i18n/i18n.properties`
- Dados mockados: `webapp/model/mockData.json` e fontes processadas no controller.

## Padroes aplicados

- O `FilterBar` principal deve ser a fonte global de filtros para todas as abas e tabelas.
- Filtros locais de abas, quando existirem, devem ser refinamentos sobre o filtro global, nunca substitutos.
- Dropdowns de `Un Fabril` e `Eqvs Venda` devem ter opcao `Selecionar tudo`, usando chave `ALL`.
- Ao interpretar selecoes, ignore a chave `ALL` e use os codigos reais selecionados.
- Ao limpar filtros globais, restaure tambem filtros locais para evitar estados escondidos.
- Datas do `FilterBar` devem limitar os meses apresentados e os totais calculados.

## Abas e dados

- Carteira e Cotacao devem partir de `_filteredSources()` e aplicar filtros locais via `_tabFilteredSourceRows`.
- Previsao deve partir de `_filteredForecast()` e aplicar filtros locais via `_matchesForecastTabFilters`.
- Budget deve cruzar filtros globais com filtros locais em `_budgetSourceRows` e `_budgetByFilter`.
- Faturado deve respeitar filtros globais e locais em `_billedRowsByFilter`.
- Detalhamento por mes deve usar somente o `FilterBar` principal.
- A tabela `Faturamento + Carteira + Previsao` deve recalcular linhas e Total conforme filtros globais.

## Grafico

- O grafico principal usa `VizFrame` com `vizType="stacked_column"`.
- A dimensao de cor deve ser `Metric`.
- Manter somente as metricas reais na legenda: `Carteira`, `Cotacoes`, `Faturado`, `Budget`, `Previsao`.
- Evitar `dataPointStyle.rules` com `displayName`, pois isso pode gerar `Semantic Range` duplicado na legenda.
- Cores esperadas:
  - Carteira: azul `#2f80ed`
  - Cotacoes: verde `#2d9d78`
  - Faturado: roxo `#8b5a9f`
  - Budget: laranja `#d85a30`
  - Previsao: amarelo `#f2c230`
- Ao filtrar por data, as barras de `Carteira`, `Cotacoes` e `Faturado` devem continuar empilhadas na coluna base, sem depender da selecao atual das tabelas.
- Ao copiar/adicionar objetos para a previsao, nao altere a coluna base; some somente os objetos copiados na coluna `Previsao`.
- A barra de `Previsao` deve suportar drilldown por clique (`selectData` no `VizFrame`), abrindo os itens de previsao do mes clicado.
- O drilldown da barra de `Previsao` deve ser somente leitura: use `Dialog` + `Table` sem `Input`, sem acoes de edicao e com dados vindos de `_forecastChartRows()` filtrados por `mesKey`.
- Exibir no drilldown, no minimo: Tipo, Numero, Cliente, Produto, Data, Valor Total e Valor Pond.
- Textos novos de dialogo, botoes e mensagens devem ir para `webapp/i18n/i18n.properties`.

## Validacao

Depois de qualquer alteracao relevante:

```powershell
npm run build
```

O warning conhecido de i18n fallback locale `en` pode aparecer e nao bloqueia o build.
