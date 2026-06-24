sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/BusyDialog",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/Table",
  "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
  "sap/ui/table/Column",
  "sap/m/Column",
  "sap/m/ColumnListItem",
  "sap/m/Label",
  "sap/m/Text",
  "sap/viz/ui5/api/env/Format",
  "sap/viz/ui5/format/ChartFormatter"
], function (Controller, JSONModel, MessageToast, BusyDialog, Dialog, Button, Table, ValueHelpDialog, UIColumn, MColumn, ColumnListItem, Label, Text, Format, ChartFormatter) {
  "use strict";

  const MONTHS = [
    { key: "jan", labelKey: "jan" },
    { key: "fev", labelKey: "feb" },
    { key: "mar", labelKey: "mar" },
    { key: "abr", labelKey: "apr" },
    { key: "mai", labelKey: "may" },
    { key: "jun", labelKey: "jun" },
    { key: "jul", labelKey: "jul" },
    { key: "ago", labelKey: "aug" },
    { key: "set", labelKey: "sep" },
    { key: "out", labelKey: "oct" },
    { key: "nov", labelKey: "nov" },
    { key: "dez", labelKey: "dec" }
  ];

  const EMPTY_BUDGET = { jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0, jul: 0, ago: 0, set: 0, out: 0, nov: 0, dez: 0 };
  const MOCK_STORAGE_KEY = "zsd.forecast.unrestricted.forecastData.v8";
  const LAUNCH_FILTER_STORAGE_KEY = "zsd.forecast.unrestricted.launchFilters.v1";
  const GROSS_WEIGHT_BRL_PER_KG = 85;
  const CURRENT_YEAR = String(new Date().getFullYear());

  let PREVISAO_IRRESTRITA_2026 = { ...EMPTY_BUDGET };
  let FATURADO_ANO_CORRENTE = { ...EMPTY_BUDGET };
  let MOCK_CARTEIRA_2026 = { ...EMPTY_BUDGET };
  let MOCK_COTACOES_2026 = { ...EMPTY_BUDGET };
  let FABRIL_TEXT = {};
  let EQVS_TEXT = {};
  let BUDGET_ROWS = [];
  let SOURCE_ROWS = [];
  let TECHNICAL_ROUTINGS = [];
  let TECHNICAL_COSTS = [];

  return Controller.extend("zsd.forecast.unrestricted.controller.App", {
    onInit: function () {
      this._forecast = [];
      this._savedForecast = [];
      this._search = "";
      this._resourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      this._registerChartFormatters();
      const openForecastApp = this._isForecastAppIntent();
      this._openForecastApp = openForecastApp;
      this._model = new JSONModel({
        scenario: this._text("scenario"),
        billedCurrentYearTitle: this._text("billedCurrentYear", [CURRENT_YEAR]),
        billedCurrentYearShortTitle: this._text("billedCurrentYearShort", [CURRENT_YEAR]),
        showLaunchListReport: !openForecastApp,
        launchSearch: "",
        launchSelectedYear: CURRENT_YEAR,
        launchSelectedDate: `${CURRENT_YEAR}-01-01`,
        launchSelectedCenters: [],
        launchSelectedTeams: [],
        launchListRows: [],
        launchListStatus: "",
        launchResultTitle: this._text("resultTitleEmpty"),
        selectedYear: CURRENT_YEAR,
        selectedDate: "",
        selectedDateRange: "",
        globalCustomerId: "",
        globalQuoteFrom: "",
        globalPortfolioFrom: "",
        selectedCenters: ["ALL", "1000", "1040", "1030"],
        selectedTeams: ["ALL", "100", "101", "105", "106", "107", "110", "120", "130"],
        weightedQuotes: true,
        weightedForecast: true,
        messageType: "Information",
        carteiraRows: [],
        cotacaoRows: [],
        budgetObjectRows: [],
        billedRows: [],
        forecastRows: [],
        forecastDrilldownRows: [],
        forecastDrilldownTitle: "",
        detailRows: [],
        revenueSummaryRows: [],
        sourceSelections: {
          portfolioTable: {},
          quoteTable: {},
          budgetTable: {}
        },
        valueHelps: {},
        chart: [],
        kpis: {},
        portfolioStatus: "",
        quoteStatus: "",
        forecastStatus: "",
        forecastBadgeCount: "",
        forecastBadgeVisible: false
      });
      this.getView().setModel(this._model, "app");
      this._loadMockData();
    },

    _loadMockData: function () {
      const url = sap.ui.require.toUrl("zsd/forecast/unrestricted/model/mockData.json");
      fetch(url, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error("mockData.json indisponivel");
          }
          return response.json();
        })
        .then((data) => {
          this._applyMockData(data);
          this._initializeMockState();
        })
        .catch((error) => {
          // Only file loading/parsing errors should fall back to an empty mock.
          // Runtime errors after loading are handled in _initializeMockState.
          // eslint-disable-next-line no-console
          console.error("Falha ao carregar mockData.json", error);
          this._applyMockData({});
          this._setMessage(this._text("msgLocalStorageLoaded"), "Information");
          this._initializeMockState();
        });
    },

    _initializeMockState: function () {
      try {
        this._applyStoredForecastData();
        this._decorateSources();
        this._applyLaunchFiltersFromStorage();
        this._refresh();
        this._refreshLaunchListReport();
      } catch (error) {
        // Preserve loaded mock data so the app remains usable and the real
        // runtime error stays visible in the browser console.
        // eslint-disable-next-line no-console
        console.error("Falha ao inicializar dados mockados", error);
        this._setMessage("Falha ao inicializar dados mockados.", "Error");
      }
    },

    _applyMockData: function (data) {
      const monthly = data.monthly || {};
      const texts = data.texts || {};
      PREVISAO_IRRESTRITA_2026 = { ...EMPTY_BUDGET, ...(monthly.previsaoIrrestrita2026 || {}) };
      FATURADO_ANO_CORRENTE = { ...EMPTY_BUDGET, ...(monthly.faturadoAnoCorrente || monthly.faturado2025 || {}) };
      MOCK_CARTEIRA_2026 = { ...EMPTY_BUDGET, ...(monthly.carteira2026 || {}) };
      MOCK_COTACOES_2026 = { ...EMPTY_BUDGET, ...(monthly.cotacoes2026 || {}) };
      FABRIL_TEXT = { ...(texts.fabril || {}) };
      EQVS_TEXT = { ...(texts.eqvs || {}) };
      BUDGET_ROWS = (data.budgetRows || []).map((row) => ({ ...row }));
      SOURCE_ROWS = (data.sourceRows || []).map((row) => ({ ...row }));
      TECHNICAL_ROUTINGS = ((data.technicalMasterData && data.technicalMasterData.routings) || []).map((row) => ({ ...row }));
      TECHNICAL_COSTS = ((data.technicalMasterData && data.technicalMasterData.costs) || []).map((row) => ({ ...row }));
      this._forecast = this._openForecastApp ? [] : this._withoutAprilForecastRows(data.forecastRows).map((row) => ({ ...row }));
      this._savedForecast = this._withoutAprilForecastRows(data.savedForecastRows).map((row) => ({ ...row }));
      this._updateValueHelps();
    },

    _mockDataSnapshot: function () {
      return {
        monthly: {
          previsaoIrrestrita2026: { ...PREVISAO_IRRESTRITA_2026 },
          faturadoAnoCorrente: { ...FATURADO_ANO_CORRENTE },
          carteira2026: { ...MOCK_CARTEIRA_2026 },
          cotacoes2026: { ...MOCK_COTACOES_2026 }
        },
        texts: {
          fabril: { ...FABRIL_TEXT },
          eqvs: { ...EQVS_TEXT }
        },
        technicalMasterData: {
          routings: TECHNICAL_ROUTINGS.map((row) => ({ ...row })),
          costs: TECHNICAL_COSTS.map((row) => ({ ...row }))
        },
        budgetRows: BUDGET_ROWS.map((row) => ({ ...row })),
        sourceRows: SOURCE_ROWS.map((row) => ({ ...row })),
        forecastRows: this._forecast.map((row) => ({ ...row })),
        savedForecastRows: this._savedForecast.map((row) => ({ ...row }))
      };
    },

    _forecastStorageSnapshot: function () {
      return {
        monthly: {
          previsaoIrrestrita2026: { ...PREVISAO_IRRESTRITA_2026, abr: 0 }
        },
        forecastRows: this._withoutAprilForecastRows(this._forecast).map((row) => ({ ...row })),
        savedForecastRows: this._withoutAprilForecastRows(this._savedForecast).map((row) => ({ ...row }))
      };
    },

    _readStoredForecastData: function () {
      try {
        const value = window.localStorage.getItem(MOCK_STORAGE_KEY);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },

    _applyStoredForecastData: function () {
      const stored = this._readStoredForecastData();
      if (!stored) {
        return;
      }
      const monthly = stored.monthly || {};
      PREVISAO_IRRESTRITA_2026 = { ...PREVISAO_IRRESTRITA_2026, ...(monthly.previsaoIrrestrita2026 || {}), abr: 0 };
      this._forecast = this._openForecastApp ? [] : this._withoutAprilForecastRows(stored.forecastRows).map((row) => ({ ...row }));
      this._savedForecast = this._withoutAprilForecastRows(stored.savedForecastRows).map((row) => ({ ...row }));
      try {
        window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(this._forecastStorageSnapshot()));
      } catch {
        // Mantem a simulacao em memoria mesmo se o navegador bloquear localStorage.
      }
    },

    _withoutAprilForecastRows: function (rows) {
      return (rows || []).filter((row) => !this._isAprilForecastRow(row));
    },

    _isAprilForecastRow: function (row) {
      if (!row) {
        return false;
      }
      return row.mesKey === "abr" || row.monthKey === "abr" || this._monthKeyFromDate(row.data || row.date) === "abr";
    },

    _persistMockData: function () {
      const snapshot = this._mockDataSnapshot();
      let storageError = null;
      try {
        window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(this._forecastStorageSnapshot()));
      } catch (error) {
        storageError = error;
      }
      return fetch("/api/mock-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot)
      }).then((response) => {
        if (!response.ok && response.status !== 404) {
          if (!storageError && response.status === 413) {
            return snapshot;
          }
          throw new Error("Falha ao gravar mockData.json");
        }
        if (storageError && response.status === 404) {
          throw storageError;
        }
        return snapshot;
      }).catch((error) => {
        if (storageError) {
          throw storageError;
        }
        // Fiori tools dev server normalmente nao expoe escrita em arquivo; nesse caso localStorage e suficiente.
        if (error && /Failed to fetch|404|Unexpected token/i.test(error.message || "")) {
          return snapshot;
        }
        throw error;
      });
    },

    onAfterRendering: function () {
      const frame = this.byId("forecastChart");
      frame.setVizProperties({
        plotArea: {
          dataLabel: {
            visible: true,
            position: "outside",
            formatString: ["BRL_MILLIONS", "BRL_MILLIONS", "BRL_MILLIONS", "BRL_MILLIONS", "BRL_MILLIONS"],
            showTotal: false,
            hideWhenOverlap: false,
            style: {
              fontSize: "9px",
              fontWeight: "bold"
            }
          },
          drawingEffect: "normal",
          colorPalette: ["#2f80ed", "#2d9d78", "#8b5a9f", "#d85a30", "#f2c230"]
        },
        tooltip: {
          visible: true,
          formatString: ["BRL_MILLIONS", "BRL_MILLIONS", "BRL_MILLIONS", "BRL_MILLIONS", "BRL_MILLIONS"]
        },
        legend: { visible: false },
        title: { visible: false },
        valueAxis: {
            title: { visible: true, text: this._text("chartYAxisTitle") },
          label: { formatString: "0.0" },
          scale: { fixedRange: true, minValue: 0, maxValue: 58, interval: 1 }
        },
        categoryAxis: {
          title: { visible: false },
          label: {
            style: { fontSize: "12px" }
          }
        }
      });
      frame.setVizScales([{
        feed: "color",
        palette: ["#2f80ed", "#2d9d78", "#8b5a9f", "#d85a30", "#f2c230"],
        domain: ["Carteira", "Cotações", "Faturado", "Budget", "Previsão"]
      }]);
    },

    onForecastChartSelectData: function (event) {
      const selection = (event.getParameter("data") || [])[0] || {};
      const data = selection.data || selection;
      const metric = data.Metric || data.metric || "";
      const measure = data.MeasureNamesDimension || data.measureNamesDimension || data["Measure Names"] || data.measure || "";
      const group = data.Comparativo || data.group || "";
      const monthLabel = data.Mes || data.month || "";
      const isForecastBar = this._normalizeSearch(metric) === this._normalizeSearch(this._text("chartGroupForecast"))
        || this._normalizeSearch(group) === this._normalizeSearch(this._text("chartGroupForecast"))
        || this._normalizeSearch(measure) === this._normalizeSearch(this._text("chartGroupForecast"));
      if (!isForecastBar) {
        return;
      }
      const monthKey = this._monthKeyFromChartLabel(monthLabel);
      const rows = this._forecastRowsForDrilldown(monthKey);
      this._model.setProperty("/forecastDrilldownRows", rows);
      this._model.setProperty("/forecastDrilldownTitle", this._text("forecastDrilldownTitle", [monthLabel || this._text("forecast")]));
      this._forecastDrilldownDialog().open();
    },

    _forecastDrilldownDialog: function () {
      if (!this._forecastDrilldownDialogInstance) {
        const table = new Table({
          width: "100%",
          growing: true,
          growingThreshold: 20,
          fixedLayout: false,
          noDataText: this._text("noForecastItemsForMonth"),
          columns: [
            new MColumn({ width: "8rem", header: new Text({ text: this._text("type") }) }),
            new MColumn({ width: "8rem", header: new Text({ text: this._text("number") }) }),
            new MColumn({ width: "13rem", header: new Text({ text: this._text("client") }) }),
            new MColumn({ width: "15rem", header: new Text({ text: this._text("product") }) }),
            new MColumn({ width: "8rem", header: new Text({ text: this._text("date") }) }),
            new MColumn({ width: "9rem", hAlign: "End", header: new Text({ text: this._text("totalValue") }) }),
            new MColumn({ width: "9rem", hAlign: "End", header: new Text({ text: this._text("weightedValue") }) })
          ]
        });
        table.bindItems("app>/forecastDrilldownRows", new ColumnListItem({
          cells: [
            new Text({ text: "{app>tipo}" }),
            new Text({ text: "{app>numero}" }),
            new Text({ text: "{app>cliente}" }),
            new Text({ text: "{app>produto}" }),
            new Text({ text: "{app>dataDisplay}" }),
            new Text({ text: "{app>valorTotalReadOnly}", textAlign: "End" }),
            new Text({ text: "{app>valorPondReadOnly}", textAlign: "End" })
          ]
        }));
        this._forecastDrilldownDialogInstance = new Dialog({
          title: "{app>/forecastDrilldownTitle}",
          contentWidth: "80rem",
          contentHeight: "32rem",
          resizable: true,
          draggable: true,
          content: [table],
          endButton: new Button({
            text: this._text("close"),
            press: function () {
              this._forecastDrilldownDialogInstance.close();
            }.bind(this)
          })
        });
        this.getView().addDependent(this._forecastDrilldownDialogInstance);
      }
      return this._forecastDrilldownDialogInstance;
    },

    _forecastRowsForDrilldown: function (monthKey) {
      return this._forecastChartRows()
        .filter((row) => {
          this._normalizeForecast(row);
          return !monthKey || row.mesKey === monthKey;
        })
        .map((row) => {
          this._normalizeForecast(row);
          return {
            ...row,
            dataDisplay: this._formatDateDisplay(row.data),
            valorTotalReadOnly: `${row.valorTotalDisplay} R$`,
            valorPondReadOnly: `${row.valorPondDisplay} R$`
          };
        });
    },

    _registerChartFormatters: function () {
      const formatter = ChartFormatter.getInstance();
      Format.numericFormatter(formatter);
      formatter.registerCustomFormatter("BRL_MILLIONS", (value) => {
        const rawValue = (Number(value) || 0) * 1000000;
        if (!rawValue) {
          return "";
        }
        return `R$ ${this._formatChartCurrency(rawValue)}`;
      });
    },

    onSearch: function (event) {
      this._search = (event.getParameter("newValue") || "").toLowerCase();
      this._refresh();
    },

    onLaunchSearchChange: function (event) {
      this._model.setProperty("/launchSearch", event.getParameter("newValue") || "");
    },

    onLaunchDateChange: function () {
      this._model.setProperty("/launchSelectedYear", this._yearFromDate(this._model.getProperty("/launchSelectedDate")));
    },

    onLaunchListSearch: function () {
      this._refreshLaunchListReport();
    },

    _refreshLaunchListReport: function () {
      if (!this._model.getProperty("/showLaunchListReport")) {
        return;
      }
      const rows = SOURCE_ROWS
        .filter((row) => this._matchesLaunchFilters(row))
        .map((row) => {
          const weighted = row.tipo === "Cotacao" && this._model.getProperty("/weightedQuotes");
          const decorated = this._decorateRow(row, weighted);
          const monthKey = this._largestMonth(row);
          const approval = this._approvalStatusFor(row);
          decorated.tipoLaunch = this._text("forecast");
          decorated.launchMonth = this._monthLabel(monthKey);
          decorated.launchYear = this._model.getProperty("/launchSelectedYear") || "2026";
          decorated.launchTotalDisplay = row.tipo === "Cotacao" ? decorated.totalWeightedDisplay : decorated.totalDisplay;
          decorated.launchTotalUnit = row.tipo === "Cotacao" ? decorated.totalWeightedUnit : decorated.totalUnit;
          decorated.approvalText = approval.text;
          decorated.approvalState = approval.state;
          decorated.approvalIcon = approval.icon;
          return decorated;
        });

      this._model.setProperty("/launchListRows", rows);
      this._model.setProperty("/launchListStatus", `${rows.length} registro(s) encontrado(s)`);
      this._model.setProperty("/launchResultTitle", this._text("resultTitleCount", [rows.length]));
    },

    onLaunchListClear: function () {
      this._model.setProperty("/launchSearch", "");
      this._model.setProperty("/launchSelectedYear", "2026");
      this._model.setProperty("/launchSelectedDate", "2026-01-01");
      this._model.setProperty("/launchSelectedCenters", []);
      this._model.setProperty("/launchSelectedTeams", []);
      this._model.setProperty("/launchListRows", []);
      this._model.setProperty("/launchListStatus", "");
      this._model.setProperty("/launchResultTitle", this._text("resultTitleEmpty"));
    },

    onOpenForecastApp: function () {
      const filters = this._launchFilters();
      try {
        window.sessionStorage.setItem(LAUNCH_FILTER_STORAGE_KEY, JSON.stringify(filters));
      } catch (error) {
        // Navigation still works without session storage.
      }
      const isGithubPages = window.location.hostname.endsWith("github.io");
      const entryPath = isGithubPages
        ? (window.location.pathname.indexOf("/test/") >= 0 ? "../index.html" : "index.html")
        : (window.location.pathname.indexOf("/test/") >= 0 ? "flpSandbox.html" : "test/flpSandbox.html");
      const shellHash = isGithubPages ? "" : "#app-tile";
      window.location.href = `${entryPath}?sap-ui-xx-viewCache=false&openForecastApp=true${shellHash}`;
    },

    onFilterSearch: function () {
      this._clearSourceSelections();
      this._refresh();
    },

    onCustomerIdValueHelp: function (event) {
      this._openGlobalValueHelp(event.getSource(), "/valueHelps/customerIds", this._text("customerId"));
    },

    onQuoteFromValueHelp: function (event) {
      this._openGlobalValueHelp(event.getSource(), "/valueHelps/quoteIds", this._text("quoteRange"));
    },

    onPortfolioFromValueHelp: function (event) {
      this._openGlobalValueHelp(event.getSource(), "/valueHelps/portfolioDocuments", this._text("portfolioRange"));
    },

    onFilterClear: function () {
      this._search = "";
      this._model.setProperty("/selectedCenters", ["ALL", "1000", "1040", "1030"]);
      this._model.setProperty("/selectedTeams", ["ALL", "100", "101", "105", "106", "107", "110", "120", "130"]);
      this._model.setProperty("/selectedYear", CURRENT_YEAR);
      this._model.setProperty("/selectedDate", "");
      this._model.setProperty("/selectedDateRange", "");
      this._model.setProperty("/globalCustomerId", "");
      this._model.setProperty("/globalQuoteFrom", "");
      this._model.setProperty("/globalPortfolioFrom", "");
      this._refresh();
    },

    onRecalculate: function () {
      this._refresh();
    },

    onFilterDateChange: function () {
      const selectedRange = this._dateRangeFromValue(this._model.getProperty("/selectedDateRange") || "");
      this._model.setProperty("/selectedDate", selectedRange.from);
      this._model.setProperty("/selectedYear", selectedRange.from ? this._yearFromDate(selectedRange.from) : CURRENT_YEAR);
      this._clearSourceSelections();
      this._refresh();
    },

    onToggleQuoteWeight: function () {
      this._refresh();
    },

    onToggleForecastWeight: function () {
      this._refresh();
    },

    onMultiSelectAllChange: function (event) {
      this._applyMultiComboBoxSelectAll(event);
    },

    _applyMultiComboBoxSelectAll: function (event) {
      const source = event.getSource();
      const changedItem = event.getParameter("changedItem");
      const selected = event.getParameter("selected");
      const changedKey = changedItem ? changedItem.getKey() : "";
      const allKeys = source.getItems()
        .map((item) => item.getKey())
        .filter((key) => key && key !== "ALL");
      let keys = source.getSelectedKeys();

      if (changedKey === "ALL" && selected) {
        keys = ["ALL", ...allKeys];
        source.setSelectedKeys(keys);
      } else if (changedKey === "ALL" && !selected) {
        keys = [];
        source.setSelectedKeys(keys);
      } else if (changedKey !== "ALL" && keys.includes("ALL")) {
        keys = keys.filter((key) => key !== "ALL");
        source.setSelectedKeys(keys);
      } else if (changedKey !== "ALL" && allKeys.length && allKeys.every((key) => keys.includes(key))) {
        keys = ["ALL", ...allKeys];
        source.setSelectedKeys(keys);
      }

      this._syncMultiComboBoxSelectedKeys(source, keys);
      return keys;
    },

    _syncMultiComboBoxSelectedKeys: function (source, keys) {
      const bindingInfo = source.getBindingInfo("selectedKeys");
      const part = bindingInfo && bindingInfo.parts && bindingInfo.parts[0];
      if (part && part.model === "app" && part.path) {
        this._model.setProperty(part.path, keys);
      }
    },

    onToggleWeightedQuotes: function (event) {
      this._model.setProperty("/weightedQuotes", event.getParameter("state"));
      this._refresh();
    },

    onToggleWeightedForecast: function (event) {
      this._model.setProperty("/weightedForecast", event.getParameter("state"));
      this._refresh();
    },

    onAddPortfolioSelection: function () {
      this._addSourceSelectionToForecast("portfolioTable", "carteira", this._firstMonthKeyFromRange(this._model.getProperty("/selectedDateRange")));
    },

    onAddQuoteSelection: function () {
      this._addSourceSelectionToForecast("quoteTable", "cotacao", this._firstMonthKeyFromRange(this._model.getProperty("/selectedDateRange")));
    },

    onAddBudgetSelection: function () {
      this._addSourceSelectionToForecast("budgetTable", "budget", "");
    },

    onSourceSelectionChange: function (event) {
      this._rememberSourceSelection(event);
      this._updateChartAndKpis();
    },

    onAddManualForecast: function () {
      const referenceMonthIndex = MONTHS.findIndex((month) => month.key === this._referenceMonthKey()) + 1;
      const row = {
        id: `MAN-${Date.now()}`,
        sourceId: null,
        manual: true,
        tipo: this._text("manual"),
        tipoState: "Indication05",
        numero: `MAN-${this._forecast.length + 1}`,
        cliente: this._text("manual"),
        produto: "",
        mat: "",
        mtsMto: this._text("mto"),
        situacao: this._text("manual"),
        situacaoState: "Information",
        editable: false,
        editableBudgetFields: false,
        qtd: 1,
        valorUnit: 1000000,
        prob: 100,
        data: `2026-${String(referenceMonthIndex || 1).padStart(2, "0")}-15`,
        status: this._text("included"),
        statusState: "Success",
        highlight: "Information"
      };
      this._normalizeForecast(row);
      this._forecast.push(row);
      this._setMessage(this._text("msgManualLineIncluded"), "Success");
      this._persistMockData();
      this._refresh();
    },

    onDeleteForecastItem: function (event) {
      const row = event.getSource().getBindingContext("app").getObject();
      this._forecast = this._forecast.filter((item) => item.id !== row.id);
      this._savedForecast = this._savedForecast.filter((item) => item.id !== row.id);
      this._setMessage(this._text("msgForecastItemRemoved"), "Success");
      this._persistMockData();
      this._refresh();
    },

    onForecastFieldChange: function (event) {
      const source = event.getSource();
      const context = source.getBindingContext("app");
      if (!context) {
        return;
      }
      const row = context.getObject();
      const binding = source.getBinding("value") || source.getBinding("selectedKey");
      const path = binding && binding.getPath();
      if (path) {
        const value = event.getParameter("newValue") || event.getParameter("value") || source.getValue?.() || source.getSelectedKey?.();
        row[path] = value;
      }
      this._normalizeForecast(row);
      this._model.refresh(true);
      this._persistMockData();
      this._updateChartAndKpis();
    },

    onSaveForecast: function () {
      const busy = new BusyDialog({ text: this._text("busySavingForecast") });
      busy.open();

      Promise.resolve().then(() => {
        this._stageSelectedObjectsForForecast();
        const savedAt = new Date().toISOString();
        const saveRunId = `SAVE-${Date.now()}`;
        this._forecast.forEach((row) => {
          row.status = this._text("saved");
          row.statusState = "Success";
          row.editable = false;
          row.savedAt = savedAt;
          row.saveRunId = saveRunId;
          this._normalizeForecast(row);
        });
        const existingById = this._savedForecast.reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
        this._forecast.forEach((row) => {
          existingById[row.id] = { ...row };
        });
        this._savedForecast = Object.keys(existingById).map((id) => existingById[id]);
        return this._persistMockData();
      }).then(() => {
        const savedCount = this._forecast.length;
        this._forecast = [];
        this._setMessage(this._text("msgForecastSaved", [savedCount]), "Success");
        this._clearSourceSelections();
        this._refresh();
        MessageToast.show(this._text("toastForecastSaved"));
      }).catch(() => {
        this._setMessage(this._text("msgForecastSaveError"), "Error");
        MessageToast.show(this._text("msgForecastSaveError"));
      }).finally(() => {
        busy.close();
      });
    },

    _stageSelectedObjectsForForecast: function () {
      [
        { tableId: "portfolioTable", monthKey: this._firstMonthKeyFromRange(this._model.getProperty("/selectedDateRange")) },
        { tableId: "quoteTable", monthKey: this._firstMonthKeyFromRange(this._model.getProperty("/selectedDateRange")) },
        { tableId: "budgetTable", monthKey: this._firstMonthKeyFromRange(this._model.getProperty("/selectedDateRange")) }
      ].forEach((source) => {
        this._selectedSourceObjects(source.tableId).forEach((row) => {
          if (!this._forecast.some((item) => item.sourceId === row.id)) {
            this._forecast.push(this._toForecastItem(row, row.monthKey || source.monthKey));
          }
        });
      });
    },

    onRemoveForecastSelection: function () {
      const selected = this._selectedItems("forecastTable");
      if (!selected.length) {
        this._setMessage(this._text("msgSelectForecastItems"), "Warning");
        return;
      }
      const ids = selected.map((item) => item.getBindingContext("app").getObject().id);
      this._forecast = this._forecast.filter((item) => !ids.includes(item.id));
      this._savedForecast = this._savedForecast.filter((item) => !ids.includes(item.id));
      this._setMessage(this._text("msgForecastItemsRemoved", [ids.length]), "Success");
      this._persistMockData();
      this._refresh();
    },

    _decorateSources: function () {
      SOURCE_ROWS.forEach((row) => {
        row.tipoState = row.tipo === "Pedido" ? "Information" : "Warning";
        row.highlight = row.tipo === "Pedido" ? "Information" : "Warning";
      });
    },

    _openGlobalValueHelp: function (input, path, title) {
      const valueHelpModel = new JSONModel({
        items: this._model.getProperty(path) || []
      });
      const dialog = new ValueHelpDialog({
        title,
        supportMultiselect: false,
        supportRanges: false,
        key: "key",
        descriptionKey: "text",
        ok: (event) => {
          const token = (event.getParameter("tokens") || [])[0];
          if (!token) {
            return;
          }
          const value = token.getText() || token.getKey();
          input.setValue(value);
          const valueBinding = input.getBinding("value");
          if (valueBinding) {
            this._model.setProperty(valueBinding.getPath(), value);
          }
          this.onFilterSearch();
          dialog.close();
        },
        cancel: function () {
          dialog.close();
        },
        afterClose: function (event) {
          event.getSource().destroy();
        }
      });
      dialog.setModel(valueHelpModel, "vh");
      dialog.getTableAsync().then((table) => {
        if (table.bindRows) {
          table.addColumn(new UIColumn({
            label: new Label({ text: "ID" }),
            template: new Text({ text: "{vh>key}" })
          }));
          table.addColumn(new UIColumn({
            label: new Label({ text: "Descrição" }),
            template: new Text({ text: "{vh>text}" })
          }));
          table.setModel(valueHelpModel, "vh");
          table.bindRows("vh>/items");
        } else {
          table.addColumn(new MColumn({ header: new Label({ text: "ID" }) }));
          table.addColumn(new MColumn({ header: new Label({ text: "Descrição" }) }));
          table.setModel(valueHelpModel, "vh");
          table.bindItems({
            path: "vh>/items",
            template: new ColumnListItem({
              cells: [
                new Text({ text: "{vh>key}" }),
                new Text({ text: "{vh>text}" })
              ]
            })
          });
        }
        dialog.update();
      });
      dialog.open();
    },

    _updateValueHelps: function () {
      if (!this._model) {
        return;
      }
      const portfolioRows = SOURCE_ROWS.filter((row) => row.tipo === "Pedido");
      const quoteRows = SOURCE_ROWS.filter((row) => row.tipo === "Cotacao");
      const forecastRows = [...this._forecast, ...this._savedForecast].map((row) => {
        this._normalizeForecast(row);
        return row;
      });
      this._model.setProperty("/valueHelps", {
        customerIds: this._customerSuggestionItems([
          ...SOURCE_ROWS.map((row) => row.cliente),
          ...BUDGET_ROWS.map((row) => row.cliente),
          ...forecastRows.map((row) => row.cliente)
        ]),
        portfolioDocuments: this._toSuggestionItems(portfolioRows.map((row) => this._salesDocumentNumber(row.id))),
        quoteIds: this._toSuggestionItems(quoteRows.map((row) => this._quotationDocumentNumber(row))),
        clients: this._toSuggestionItems([
          ...SOURCE_ROWS.map((row) => row.cliente),
          ...BUDGET_ROWS.map((row) => row.cliente),
          ...forecastRows.map((row) => row.cliente)
        ]),
        products: this._toSuggestionItems([
          ...SOURCE_ROWS.flatMap((row) => [row.mat, row.desc]),
          ...BUDGET_ROWS.flatMap((row) => [row.concatName, row.sourceColumn]),
          ...forecastRows.flatMap((row) => [row.mat, row.produto])
        ]),
        budgetNames: this._toSuggestionItems(BUDGET_ROWS.flatMap((row) => [row.concatName, row.sourceColumn])),
        budgetClients: this._toSuggestionItems(BUDGET_ROWS.map((row) => row.cliente)),
        forecastNumbers: this._toSuggestionItems(forecastRows.flatMap((row) => [row.numero, row.sourceId, row.id])),
        forecastClients: this._toSuggestionItems(forecastRows.map((row) => row.cliente)),
        forecastProducts: this._toSuggestionItems(forecastRows.flatMap((row) => [row.produto, row.mat]))
      });
    },

    _toSuggestionItems: function (values) {
      const seen = {};
      return values
        .map((value) => String(value || "").trim())
        .filter((value) => value && !seen[this._normalizeSearch(value)] && (seen[this._normalizeSearch(value)] = true))
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((value) => ({ key: value, text: value }));
    },

    _customerSuggestionItems: function (names) {
      const seen = {};
      return names
        .map((name) => String(name || "").trim())
        .filter((name) => name && !seen[this._normalizeSearch(name)] && (seen[this._normalizeSearch(name)] = true))
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((name) => {
          const key = this._customerIdForName(name);
          return { key, text: `${key} - ${name}` };
        });
    },

    _filteredSources: function () {
      return SOURCE_ROWS.filter((row) => this._matchesFilters(row));
    },

    _filteredForecast: function () {
      return this._forecast.filter((row) => this._matchesFilters(row));
    },

    _filteredSavedForecast: function () {
      return this._savedForecast.filter((row) => this._matchesFilters(row));
    },

    _tabFilteredSourceRows: function (type) {
      return this._filteredSources().filter((row) => row.tipo === type);
    },

    _matchesAnyDocumentRange: function (values, from, to) {
      return values.some((value) => this._matchesDocumentRange(value, from, to));
    },

    _matchesDocumentRange: function (value, from, to) {
      const fromValue = this._documentComparable(from);
      const toValue = this._documentComparable(to);
      if (fromValue.empty && toValue.empty) {
        return true;
      }
      const docValue = this._documentComparable(value);
      if (docValue.empty) {
        return false;
      }
      const lowerOk = fromValue.empty || this._compareDocumentValues(docValue, fromValue) >= 0;
      const upperOk = toValue.empty || this._compareDocumentValues(docValue, toValue) <= 0;
      return lowerOk && upperOk;
    },

    _documentComparable: function (value) {
      const text = String(value || "").trim();
      const digits = text.match(/\d+/g);
      if (digits && digits.length) {
        return {
          empty: false,
          numeric: true,
          value: Number(digits.join(""))
        };
      }
      return {
        empty: !text,
        numeric: false,
        value: this._normalizeSearch(text)
      };
    },

    _compareDocumentValues: function (left, right) {
      if (left.numeric && right.numeric) {
        return left.value - right.value;
      }
      return String(left.value).localeCompare(String(right.value), "pt-BR");
    },

    _normalizeSearch: function (value) {
      return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    _monthKeysFromRange: function (value) {
      const range = this._dateRangeFromValue(value || "");
      if (!range.from && !range.to) {
        return [];
      }
      const fromMonth = range.from ? Number(range.from.slice(5, 7)) : 1;
      const toMonth = range.to ? Number(range.to.slice(5, 7)) : fromMonth;
      const start = Math.max(1, Math.min(fromMonth, toMonth));
      const end = Math.min(12, Math.max(fromMonth, toMonth));
      return MONTHS.slice(start - 1, end).map((month) => month.key);
    },

    _firstMonthKeyFromRange: function (value) {
      const keys = this._monthKeysFromRange(value);
      return keys[0] || "";
    },

    _rowHasAnyMonth: function (row, monthKeys) {
      const dateMonthKey = this._monthKeyFromDate(row.data || row.date);
      return !monthKeys.length || monthKeys.some((key) => (Number(row[key]) || 0) > 0 || row.monthKey === key || row.mesKey === key || dateMonthKey === key);
    },

    _selectedFilterKeys: function (path, allKeys) {
      const keys = this._model.getProperty(path) || [];
      const selected = keys.filter((key) => key && key !== "ALL");
      return keys.includes("ALL") ? [...allKeys] : selected;
    },

    _globalCenters: function () {
      return this._selectedFilterKeys("/selectedCenters", Object.keys(FABRIL_TEXT));
    },

    _globalTeams: function () {
      return this._selectedFilterKeys("/selectedTeams", Object.keys(EQVS_TEXT));
    },

    _matchesSelectedKeys: function (value, keys) {
      return !keys.length || !value || keys.includes(String(value || ""));
    },

    _combinedFilterKeys: function (primaryKeys, secondaryKeys, allKeys) {
      const primary = primaryKeys.length ? primaryKeys : [...allKeys];
      const secondary = secondaryKeys.length ? secondaryKeys : [...allKeys];
      return allKeys.filter((key) => primary.includes(key) && secondary.includes(key));
    },

    _matchesFilters: function (row) {
      const centers = this._globalCenters();
      const teams = this._globalTeams();
      const monthKeys = this._monthKeysFromRange(this._model.getProperty("/selectedDateRange"));
      const centerOk = this._matchesSelectedKeys(row.centro, centers);
      const teamOk = this._matchesSelectedKeys(row.eqvs, teams);
      const dateOk = this._rowHasAnyMonth(row, monthKeys);
      const customerOk = this._matchesGlobalCustomerFilter(row);
      const documentOk = this._matchesGlobalDocumentFilters(row);
      if (row.manual) {
        const searchOk = !this._search || this._normalizeSearch([row.cliente, row.produto, row.numero].join(" ")).includes(this._normalizeSearch(this._search));
        return centerOk && teamOk && dateOk && customerOk && documentOk && searchOk;
      }
      const searchOk = !this._search || this._normalizeSearch([row.cliente, row.mat, row.desc, row.id].join(" ")).includes(this._normalizeSearch(this._search));
      return centerOk && teamOk && dateOk && customerOk && documentOk && searchOk;
    },

    _matchesGlobalCustomerFilter: function (row) {
      const filter = this._normalizeSearch(this._model.getProperty("/globalCustomerId"));
      if (!filter) {
        return true;
      }
      const customerName = row.cliente || "";
      const customerId = this._customerIdForName(customerName);
      return this._normalizeSearch(`${customerId} ${customerId} - ${customerName} ${customerName}`).includes(filter);
    },

    _matchesGlobalDocumentFilters: function (row) {
      const quoteFrom = this._model.getProperty("/globalQuoteFrom");
      const portfolioFrom = this._model.getProperty("/globalPortfolioFrom");
      const quoteActive = Boolean(String(quoteFrom || "").trim());
      const portfolioActive = Boolean(String(portfolioFrom || "").trim());

      const type = row.sourceTipo || row.tipo || "";
      if (type === "Cotacao") {
        return !quoteActive || this._matchesAnyDocumentRange(this._quoteDocumentValues(row), quoteFrom, "");
      }
      if (type === "Pedido") {
        return !portfolioActive || this._matchesAnyDocumentRange(this._portfolioDocumentValues(row), portfolioFrom, "");
      }
      return true;
    },

    _matchesLaunchFilters: function (row) {
      const filters = this._launchFilters();
      const centerOk = !filters.centers.length || filters.centers.includes(row.centro);
      const teamOk = !filters.teams.length || filters.teams.includes(row.eqvs);
      const searchOk = !filters.search || [row.cliente, row.mat, row.desc, row.id].join(" ").toLowerCase().includes(filters.search);
      return centerOk && teamOk && searchOk;
    },

    _approvalStatusFor: function (row) {
      const total = Math.round(this._rowTotal(row, false) * 10);
      const stage = total % 3;
      if (stage === 0) {
        return {
          text: this._text("statusFinancialApproved"),
          state: "Success",
          icon: "sap-icon://sys-enter-2"
        };
      }
      if (stage === 1) {
        return {
          text: this._text("statusComplianceApproved"),
          state: "Warning",
          icon: "sap-icon://validate"
        };
      }
      return {
        text: this._text("statusSalesApproved"),
        state: "Information",
        icon: "sap-icon://sales-order"
      };
    },

    _launchFilters: function () {
      return {
        search: (this._model.getProperty("/launchSearch") || "").toLowerCase(),
        year: this._yearFromDate(this._model.getProperty("/launchSelectedDate")) || this._model.getProperty("/launchSelectedYear") || "2026",
        date: this._model.getProperty("/launchSelectedDate") || "",
        centers: this._model.getProperty("/launchSelectedCenters") || [],
        teams: this._model.getProperty("/launchSelectedTeams") || []
      };
    },

    _isForecastAppIntent: function () {
      try {
        return new URLSearchParams(window.location.search).get("openForecastApp") === "true";
      } catch (error) {
        return false;
      }
    },

    _applyLaunchFiltersFromStorage: function () {
      if (!this._isForecastAppIntent()) {
        return;
      }
      let filters = {};
      try {
        filters = JSON.parse(window.sessionStorage.getItem(LAUNCH_FILTER_STORAGE_KEY) || "{}");
      } catch (error) {
        filters = {};
      }
      this._model.setProperty("/showLaunchListReport", false);
      this._model.setProperty("/selectedYear", filters.year || CURRENT_YEAR);
      this._model.setProperty("/selectedDate", "");
      this._model.setProperty("/selectedDateRange", "");
      this._model.setProperty("/selectedCenters", filters.centers || []);
      this._model.setProperty("/selectedTeams", filters.teams || []);
      this._search = filters.search || "";
    },

    _refresh: function () {
      this._updateValueHelps();
      const weighted = this._model.getProperty("/weightedQuotes");
      const carteiraRows = this._tabFilteredSourceRows("Pedido", "portfolio")
        .map((row) => this._decorateRow(row, false));
      const cotacaoRows = this._tabFilteredSourceRows("Cotacao", "quote")
        .map((row) => this._decorateRow(row, weighted));
      const budgetObjectRows = this._budgetSourceRows()
        .map((row) => this._decorateRow(row, false));
      const forecastRows = this._filteredForecast().map((row) => {
        this._normalizeForecast(row);
        return row;
      });
      this._model.setProperty("/carteiraRows", carteiraRows);
      this._model.setProperty("/cotacaoRows", cotacaoRows);
      this._model.setProperty("/budgetObjectRows", budgetObjectRows);
      this._model.setProperty("/forecastRows", forecastRows);
      this._model.setProperty("/revenueSummaryRows", this._revenueSummaryRows());
      this._model.setProperty("/portfolioStatus", this._text("statusPortfolioItems", [carteiraRows.length, ""]));
      this._model.setProperty("/quoteStatus", this._text("statusQuotesItems", [cotacaoRows.length, ""]));
      this._model.setProperty("/forecastStatus", this._text("statusForecastItems", [forecastRows.length, this._savedForecast.length]));
      this._model.setProperty("/forecastBadgeCount", this._forecast.length ? String(this._forecast.length) : "");
      this._model.setProperty("/forecastBadgeVisible", this._forecast.length > 0);
      this._updateChartAndKpis();
    },

    _decorateRow: function (row, weighted) {
      const copy = { ...row };
      copy.documentDisplay = this._documentDisplayFor(row);
      copy.centroText = FABRIL_TEXT[row.centro] || row.centro;
      copy.eqvsText = EQVS_TEXT[row.eqvs] || row.eqvs;
      copy.monthLabel = row.monthKey ? this._monthLabel(row.monthKey) : "";
      copy.yearDisplay = row.year || this._model.getProperty("/selectedYear") || CURRENT_YEAR;
      const technicalStatus = this._technicalStatusFor(copy);
      copy.HAS_ROUTING = technicalStatus.hasRouting;
      copy.HAS_COST = technicalStatus.hasCost;
      copy.STATUS_TECNICO = technicalStatus.code;
      copy.technicalStatusText = technicalStatus.text;
      copy.technicalStatusState = technicalStatus.state;
      copy.technicalStatusIcon = technicalStatus.icon;
      MONTHS.forEach(({ key }) => {
        const monthAmount = this._smartFromMi(this._valueFor(row, key, weighted));
        copy[`${key}Display`] = monthAmount.number;
        copy[`${key}Unit`] = monthAmount.unit;
      });
      copy.totalWeighted = MONTHS.reduce((sum, month) => sum + this._valueFor(row, month.key, weighted), 0);
      copy.total = MONTHS.reduce((sum, month) => sum + (Number(row[month.key]) || 0), 0);
      const totalAmount = this._smartFromMi(copy.total);
      const totalWeightedAmount = this._smartFromMi(copy.totalWeighted);
      copy.totalDisplay = totalAmount.number;
      copy.totalUnit = totalAmount.unit;
      if (row.rawValue !== undefined) {
        copy.totalDisplay = this._formatSmartAmount(row.rawValue).number;
        copy.totalUnit = this._formatSmartAmount(row.rawValue).unit;
      }
      copy.totalWeightedDisplay = totalWeightedAmount.number;
      copy.totalWeightedUnit = totalWeightedAmount.unit;
      copy.totalState = copy.totalWeighted > 0 ? "Success" : "None";
      copy.tipoState = this._typeStateFor(copy.tipo);
      copy.highlight = row.forecastOnly ? "Success" : copy.highlight;
      return copy;
    },

    _documentDisplayFor: function (row) {
      if (!row) {
        return "";
      }
      if (row.tipo === "Pedido") {
        return this._salesDocumentNumber(row.id);
      }
      if (row.tipo === "Cotacao") {
        return this._quotationDocumentNumber(row);
      }
      return row.documentDisplay || row.concatName || row.id || "";
    },

    _typeStateFor: function (type) {
      if (type === "Pedido") {
        return "Information";
      }
      if (type === "Budget") {
        return "Success";
      }
      if (type === "Faturado") {
        return "None";
      }
      return "Warning";
    },

    _salesDocumentNumber: function (id) {
      const value = String(id || "");
      const match = value.match(/^SO-([^-]+)/);
      return match ? match[1] : value.replace(/^SO-/, "");
    },

    _quotationDocumentNumber: function (row) {
      const value = String((row && (row.quotationId || row.id)) || "");
      const numberGroups = value.match(/\d+/g);
      return numberGroups && numberGroups.length ? numberGroups[numberGroups.length - 1] : value;
    },

    _billedDocumentNumber: function (row) {
      const seed = [row && row.id, row && row.cliente, row && row.mat, row && row.desc, row && row.centro, row && row.eqvs].join("|");
      let hash = 0;
      String(seed || "").split("").forEach((char) => {
        hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
      });
      return `FAT-${CURRENT_YEAR}-${String(Math.abs(hash) % 1000000).padStart(6, "0")}`;
    },

    _portfolioDocumentValues: function (row) {
      return [row.numero, row.sourceId, row.id].map((value) => this._salesDocumentNumber(value));
    },

    _quoteDocumentValues: function (row) {
      return [
        row.numero,
        row.sourceId,
        row.quotationId,
        row.id,
        this._quotationDocumentNumber(row)
      ];
    },

    _customerIdForName: function (name) {
      const normalized = this._normalizeSearch(name);
      if (!normalized) {
        return "";
      }
      let hash = 0;
      for (let i = 0; i < normalized.length; i += 1) {
        hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
        hash |= 0;
      }
      return String((Math.abs(hash) % 900000) + 100000);
    },

    _updateChartAndKpis: function () {
      const weighted = this._model.getProperty("/weightedQuotes");
      const weightedForecast = this._model.getProperty("/weightedForecast");
      const chartMonthKey = "";
      const budget = this._budgetByFilter(chartMonthKey);
      const globalDateRange = this._model.getProperty("/selectedDateRange");
      const filteredSources = this._filteredSources();
      const billedRows = this._billedRowsByFilter();
      const carteiraTotals = this._filterTotalsByRange(
        this._monthTotals(filteredSources.filter((row) => row.tipo === "Pedido"), false, chartMonthKey),
        globalDateRange
      );
      const quoteTotals = this._filterTotalsByRange(
        this._monthTotals(filteredSources.filter((row) => row.tipo === "Cotacao"), weighted, chartMonthKey),
        globalDateRange
      );
      const billedTotals = this._filterTotalsByRange(
        this._monthTotals(billedRows, false, chartMonthKey),
        globalDateRange
      );
      const forecastPortfolioTotals = this._forecastMonthTotals(weightedForecast, chartMonthKey, (row) => row.sourceTipo === "Pedido");
      const forecastQuoteTotals = this._forecastMonthTotals(weightedForecast, chartMonthKey, (row) => row.sourceTipo === "Cotacao");
      const forecastBilledTotals = this._forecastMonthTotals(weightedForecast, chartMonthKey, (row) => row.sourceTipo === "Faturado");
      const forecastBudgetTotals = this._forecastMonthTotals(weightedForecast, chartMonthKey, (row) => this._isForecastBudgetRow(row));
      const forecastManualTotals = this._forecastMonthTotals(weightedForecast, chartMonthKey, (row) => !["Pedido", "Cotacao", "Budget", "Faturado"].includes(row.sourceTipo));
      const forecastTotals = this._sumTotals([
        forecastPortfolioTotals,
        forecastQuoteTotals,
        forecastBilledTotals,
        forecastBudgetTotals,
        forecastManualTotals
      ]);
      const chart = this._buildComparisonChartRows({
        budget,
        carteiraTotals,
        quoteTotals,
        billedTotals,
        forecastPortfolioTotals,
        forecastQuoteTotals,
        forecastBilledTotals,
        forecastBudgetTotals,
        forecastManualTotals,
        forecastTotals,
        activeMonthKey: chartMonthKey
      });
      const budgetTotal = this._sum(budget);
      const faturadoAnoCorrenteTotal = this._sum(billedTotals);
      const carteira = this._sum(carteiraTotals);
      const cotacoes = this._sum(quoteTotals);
      const previsao = this._forecastChartRows().reduce((sum, row) => {
        this._normalizeForecast(row);
        return (!chartMonthKey || row.mesKey === chartMonthKey)
          ? sum + this._forecastValueMi(row, weightedForecast)
          : sum;
      }, 0);
      const gap = previsao - budgetTotal;

      this._model.setProperty("/chart", chart);
      this._model.setProperty("/kpis", {
        budget: this._smartFromMi(budgetTotal).number,
        budgetUnit: this._smartFromMi(budgetTotal).unit,
        faturadoAnoCorrente: this._smartFromMi(faturadoAnoCorrenteTotal).number,
        faturadoAnoCorrenteUnit: this._smartFromMi(faturadoAnoCorrenteTotal).unit,
        carteira: this._smartFromMi(carteira).number,
        carteiraUnit: this._smartFromMi(carteira).unit,
        cotacoes: this._smartFromMi(cotacoes).number,
        cotacoesUnit: this._smartFromMi(cotacoes).unit,
        cotacoesPesoBruto: this._grossWeightFromMi(cotacoes).number,
        cotacoesPesoBrutoUnit: this._grossWeightFromMi(cotacoes).unit,
        previsao: this._smartFromMi(previsao).number,
        previsaoUnit: this._smartFromMi(previsao).unit,
        previsaoPesoBruto: this._grossWeightFromMi(previsao).number,
        previsaoPesoBrutoUnit: this._grossWeightFromMi(previsao).unit,
        gap: `${gap >= 0 ? "+" : ""}${this._format(gap)}`,
        gapState: gap >= 0 ? "Success" : "Error"
      });
      const detailSources = this._detailFilteredSources();
      const detailBudget = this._budgetByDetailFilter();
      const detailCarteiraTotals = this._monthTotals(detailSources.filter((row) => row.tipo === "Pedido"), false, chartMonthKey);
      const detailQuoteTotals = this._monthTotals(detailSources.filter((row) => row.tipo === "Cotacao"), weighted, chartMonthKey);
      const detailDateRange = this._model.getProperty("/selectedDateRange");
      const detailForecastTotals = this._filterTotalsByRange(forecastTotals, detailDateRange);
      this._model.setProperty("/detailRows", this._buildDetailRows({
        billedTotals,
        budget: detailBudget,
        carteiraTotals: detailCarteiraTotals,
        quoteTotals: detailQuoteTotals,
        forecastTotals: detailForecastTotals,
        weighted,
        weightedForecast,
        dateRange: detailDateRange
      }));
      this._model.setProperty("/budgetRows", [
        this._detailRow(this._text("budget2026"), budget, "Information", "None")
      ]);
      this._model.setProperty("/billedRows", billedRows);
    },

    _buildComparisonChartRows: function ({
      budget,
      carteiraTotals,
      quoteTotals,
      billedTotals,
      forecastTotals,
      activeMonthKey
    }) {
      return MONTHS.filter(({ key }) => !activeMonthKey || key === activeMonthKey).flatMap(({ key }) => {
        const month = this._monthLabel(key);
        return [
          this._chartComparisonRow(month, this._text("chartGroupPortfolioQuotes"), {
            carteira: carteiraTotals[key],
            cotacoes: quoteTotals[key],
            faturado: billedTotals[key]
          }),
          this._chartComparisonRow(month, this._text("chartGroupBudget"), {
            budget: budget[key]
          }),
          this._chartComparisonRow(month, this._text("chartGroupForecast"), {
            previsao: forecastTotals[key]
          })
        ];
      });
    },

    _chartComparisonRow: function (month, group, values) {
      return {
        month,
        group,
        carteira: +(Number(values.carteira || 0)).toFixed(2),
        cotacoes: +(Number(values.cotacoes || 0)).toFixed(2),
        faturado: +(Number(values.faturado || 0)).toFixed(2),
        budget: +(Number(values.budget || 0)).toFixed(2),
        previsao: +(Number(values.previsao || 0)).toFixed(2)
      };
    },

    _detailFilteredSources: function () {
      return this._filteredSources();
    },

    _budgetByDetailFilter: function () {
      const centers = this._globalCenters();
      const teams = this._globalTeams();
      const monthKeys = this._monthKeysFromRange(this._model.getProperty("/selectedDateRange"));
      const budget = { ...EMPTY_BUDGET };
      BUDGET_ROWS.forEach((row) => {
        const monthKey = MONTHS[row.month - 1] && MONTHS[row.month - 1].key;
        const centerOk = this._matchesSelectedKeys(row.fabril, centers);
        const teamOk = this._matchesSelectedKeys(row.eqvs, teams);
        const monthOk = !monthKeys.length || monthKeys.includes(monthKey);
        if (centerOk && teamOk && monthOk) {
          budget[monthKey] += Number(row.valueMi) || 0;
        }
      });
      MONTHS.forEach(({ key }) => {
        budget[key] = +budget[key].toFixed(3);
      });
      return budget;
    },

    _filterTotalsByRange: function (values, rangeValue) {
      const monthKeys = this._monthKeysFromRange(rangeValue);
      if (!monthKeys.length) {
        return { ...values };
      }
      return MONTHS.reduce((acc, { key }) => {
        acc[key] = monthKeys.includes(key) ? Number(values[key]) || 0 : 0;
        return acc;
      }, {});
    },

    _billedRowsByFilter: function () {
      const allCenters = Object.keys(FABRIL_TEXT);
      const allTeams = Object.keys(EQVS_TEXT);
      const activeCenters = this._globalCenters().length ? this._globalCenters() : allCenters;
      const activeTeams = this._globalTeams().length ? this._globalTeams() : allTeams;
      const totals = this._filterTotalsByRange(FATURADO_ANO_CORRENTE, this._model.getProperty("/selectedDateRange"));
      const billedItems = this._billedItemRows(activeCenters, activeTeams, totals);

      return billedItems.map((item) => {
        const values = MONTHS.reduce((acc, { key }) => {
          acc[key] = 0;
          return acc;
        }, {});
        MONTHS.forEach(({ key }) => {
          values[key] = item.values[key] || 0;
        });
        const component = item.component;
        const row = this._detailRow(component, values, "Information", "None");
        return {
          ...row,
          id: `BIL-${item.id}`,
          tipo: "Faturado",
          cliente: item.cliente,
          mat: item.mat,
          desc: item.desc,
          centro: item.centro,
          eqvs: item.eqvs,
          prob: 100
        };
      }).filter((row) => MONTHS.some(({ key }) => Number(row[key]) !== 0));
    },

    _billedItemRows: function (activeCenters, activeTeams, totals) {
      const itemMap = {};
      MONTHS.forEach(({ key }) => {
        const monthItems = this._billedSourceItems(activeCenters, activeTeams, key, itemMap);
        const distributedValues = this._distributeBilledMonth(totals[key], monthItems, key);
        monthItems.forEach((item, index) => {
          item.values[key] = distributedValues[index] || 0;
        });
      });
      return Object.keys(itemMap).map((key) => itemMap[key]);
    },

    _billedSourceItems: function (activeCenters, activeTeams, monthKey, itemMap) {
      const monthRows = SOURCE_ROWS.filter((row) => {
        const centerOk = !activeCenters.length || activeCenters.includes(row.centro);
        const teamOk = !activeTeams.length || activeTeams.includes(row.eqvs);
        const monthOk = row.monthKey === monthKey || Number(row[monthKey]) > 0;
        const searchOk = !this._search || this._normalizeSearch([row.cliente, row.mat, row.desc, row.id].join(" ")).includes(this._normalizeSearch(this._search));
        return row.cliente && centerOk && teamOk && monthOk && searchOk;
      });
      return monthRows.reduce((items, row) => {
        const key = this._normalizeSearch([row.cliente, row.mat, row.desc, row.centro, row.eqvs].join("|"));
        if (!itemMap[key]) {
          itemMap[key] = {
            id: key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            component: this._billedDocumentNumber(row),
            cliente: row.cliente,
            mat: row.mat || this._text("billedCurrentYearShort", [CURRENT_YEAR]),
            desc: row.desc || row.mat || row.cliente,
            centro: row.centro,
            eqvs: row.eqvs,
            values: { ...EMPTY_BUDGET }
          };
        }
        if (!items.some((item) => item.id === itemMap[key].id)) {
          items.push(itemMap[key]);
        }
        return items;
      }, []);
    },

    _distributeBilledMonth: function (totalMi, items, monthKey) {
      const totalUnits = Math.round((Number(totalMi) || 0) * 1000);
      if (!totalUnits || !items.length) {
        return items.map(() => 0);
      }
      const weights = items.map((item) => this._stableRandomWeight(`${monthKey}-${item.id}-${item.component}`));
      const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
      const minimumUnit = totalUnits >= items.length ? 1 : 0;
      let remainingUnits = totalUnits - (minimumUnit * items.length);
      const allocations = weights.map((weight) => {
        const exact = remainingUnits > 0 ? (remainingUnits * weight) / weightTotal : 0;
        return {
          units: minimumUnit + Math.floor(exact),
          fraction: exact - Math.floor(exact)
        };
      });
      let allocatedUnits = allocations.reduce((sum, item) => sum + item.units, 0);
      allocations
        .slice()
        .sort((a, b) => b.fraction - a.fraction)
        .some((item) => {
          if (allocatedUnits >= totalUnits) {
            return true;
          }
          item.units += 1;
          allocatedUnits += 1;
          return false;
        });
      return allocations.map((item) => +(item.units / 1000).toFixed(3));
    },

    _stableRandomWeight: function (value) {
      let hash = 0;
      String(value || "").split("").forEach((char) => {
        hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
      });
      return 0.35 + (Math.abs(hash) % 1000) / 1000;
    },

    _buildDetailRows: function ({ billedTotals, budget, carteiraTotals, quoteTotals, forecastTotals, weighted, weightedForecast, dateRange }) {
      const displayBilled = this._filterTotalsByRange(billedTotals || FATURADO_ANO_CORRENTE, dateRange);
      const displayBudget = this._filterTotalsByRange(budget, dateRange);
      const displayCarteira = this._filterTotalsByRange(carteiraTotals, dateRange);
      const displayQuotes = this._filterTotalsByRange(quoteTotals, dateRange);
      const displayForecast = this._filterTotalsByRange(forecastTotals, dateRange);
      const gapTotals = MONTHS.reduce((acc, { key }) => {
        acc[key] = displayForecast[key] - displayBudget[key];
        return acc;
      }, {});
      return [
        this._detailRow(this._text("billedCurrentYearShort", [CURRENT_YEAR]), displayBilled, "Information", "None"),
        this._detailRow(this._text("portfolio"), displayCarteira, "Information", "Information"),
        this._detailRow(this._text("detailQuotes", [weighted ? this._text("weighted") : this._text("fullPercent")]), displayQuotes, "Success", "Success"),
        this._detailRow(this._text("detailForecast", [weightedForecast ? this._text("weighted") : this._text("fullPercent")]), displayForecast, "Warning", "Warning"),
        this._detailRow(this._text("budget2026"), displayBudget, "Information", "None"),
        this._detailRow(this._text("detailGap"), gapTotals, "Error", "Error")
      ];
    },

    _detailRow: function (component, values, state, highlight) {
      const row = { component, state, highlight };
      const referenceMonthKey = this._referenceMonthKey();
      MONTHS.forEach(({ key }) => {
        row[key] = Number(values[key]) || 0;
        const amount = this._smartFromMi(values[key] || 0);
        row[`${key}Display`] = amount.number;
        row[`${key}Unit`] = amount.unit;
        row[`${key}Text`] = `${amount.number}\u00a0${amount.unit}`;
        row[`${key}State`] = key === referenceMonthKey ? "Information" : "None";
      });
      return row;
    },

    _revenueSummaryRows: function () {
      const teamKeys = this._globalTeams();
      const monthKeys = this._monthKeysFromRange(this._model.getProperty("/selectedDateRange"));
      const search = this._normalizeSearch(this._search);
      const rows = this._baseRevenueSummaryRows()
        .filter((row) => row.component !== "Total")
        .filter((row) => this._matchesSelectedKeys(row.teamCode, teamKeys))
        .filter((row) => !search || this._normalizeSearch(`${row.component} ${row.code || ""} ${row.teamCode || ""}`).includes(search))
        .map((row) => {
          const copy = { ...row };
          let total = 0;
          MONTHS.forEach(({ key }) => {
            const value = monthKeys.length && !monthKeys.includes(key) ? 0 : this._parseRevenueSummaryAmount(copy[key]);
            copy[key] = value;
            total += value;
          });
          copy.total = total;
          return copy;
        });
      const totalRow = MONTHS.reduce((acc, { key }) => {
        acc[key] = rows.reduce((sum, row) => sum + this._parseRevenueSummaryAmount(row[key]), 0);
        return acc;
      }, { code: "", component: "Total", rowClass: "revenueSummaryTotalRow" });
      totalRow.total = MONTHS.reduce((sum, { key }) => sum + Number(totalRow[key] || 0), 0);
      return [...rows, totalRow]
        .map((row) => this._decorateRevenueSummaryRow(row));
    },

    _decorateRevenueSummaryRow: function (row) {
      const copy = { ...row };
      [...MONTHS.map((month) => month.key), "total"].forEach((key) => {
        const amount = this._formatSmartAmount(this._parseRevenueSummaryAmount(copy[key]));
        copy[`${key}Display`] = amount.number;
        copy[`${key}Unit`] = amount.unit;
      });
      return copy;
    },

    _parseRevenueSummaryAmount: function (value) {
      if (typeof value === "number") {
        return value;
      }
      return Number(String(value || "0").replace(/\./g, "").replace(",", ".")) || 0;
    },

    _baseRevenueSummaryRows: function () {
      return [
        { code: "AND", teamCode: "120", component: "Andina", jan: "122.806", fev: "72.439", mar: "116.613", abr: "368.094", mai: "50.841", jun: "255.087", jul: "456.023", ago: "409.651", set: "555.426", out: "551.784", nov: "611.486", dez: "592.028", total: "4.162.278" },
        { code: "EXP", teamCode: "105", component: "Exportação", jan: "18.694", fev: "262.462", mar: "107.039", abr: "329.650", mai: "47.126", jun: "319.452", jul: "599.681", ago: "303.381", set: "161.517", out: "149.388", nov: "390.235", dez: "359.984", total: "3.048.609" },
        { code: "FAB", teamCode: "106", component: "Fabricantes", jan: "175.955", fev: "72.028", mar: "27.447", abr: "89.304", mai: "1.631", jun: "40.963", jul: "230.683", ago: "667.128", set: "251.160", out: "251.936", nov: "1.532", dez: "0", total: "1.809.767" },
        { code: "MIN", teamCode: "101", component: "Mineração", jan: "1.562.472", fev: "772.538", mar: "949.079", abr: "459.069", mai: "98.241", jun: "132.367", jul: "597.877", ago: "1.111.437", set: "1.157.655", out: "1.059.704", nov: "1.097.525", dez: "405.986", total: "9.403.959" },
        { code: "MRR", teamCode: "110", component: "MRR", jan: "1.207.408", fev: "1.406.512", mar: "1.942.179", abr: "1.138.677", mai: "778.060", jun: "767.596", jul: "1.428.405", ago: "1.664.680", set: "1.720.852", out: "1.785.338", nov: "1.652.184", dez: "1.539.068", total: "17.030.960" },
        { code: "SID", teamCode: "107", component: "Siderurgia", jan: "764.750", fev: "651.018", mar: "418.028", abr: "350.770", mai: "63.227", jun: "610.787", jul: "600.110", ago: "656.492", set: "745.129", out: "339.481", nov: "1.236.390", dez: "515.691", total: "6.951.872" },
        { code: "VAL", teamCode: "100", component: "Vale", jan: "1.055.070", fev: "1.606.789", mar: "1.831.700", abr: "627.430", mai: "105.356", jun: "337.534", jul: "118.683", ago: "846.653", set: "918.405", out: "954.979", nov: "940.626", dez: "993.904", total: "10.337.129" },
        { code: "SRV", teamCode: "130", component: "Serviços", jan: "2.776", fev: "0", mar: "0", abr: "0", mai: "0", jun: "0", jul: "0", ago: "0", set: "0", out: "0", nov: "12.688", dez: "8.000", total: "23.463" },
        { code: "", component: "Total", rowClass: "revenueSummaryTotalRow", jan: "4.909.932", fev: "4.843.786", mar: "5.248.085", abr: "3.362.995", mai: "1.144.481", jun: "2.463.785", jul: "4.031.462", ago: "5.659.422", set: "5.510.154", out: "5.092.610", nov: "5.942.665", dez: "4.414.660", total: "52.624.038" }
      ];
    },

    _addSourceSelectionToForecast: function (tableId, label, monthKey) {
      const selected = this._selectedSourceObjects(tableId);
      if (!selected.length) {
        this._setMessage(this._text("msgSelectItemFromSource", [label]), "Warning");
        return;
      }
      let added = 0;
      selected.forEach((row) => {
        if (!this._forecast.some((forecastItem) => forecastItem.sourceId === row.id)) {
          this._forecast.push(this._toForecastItem(row, row.monthKey || monthKey));
          added += 1;
        }
      });
      this._setMessage(this._text("msgItemsAddedToForecast", [added]), added ? "Success" : "Information");
      this._clearTrackedSourceSelection(tableId);
      const table = this.byId(tableId);
      if (table) {
        table.removeSelections(true);
      }
      this._persistMockData();
      this._refresh();
    },

    _toForecastItem: function (row, monthKey) {
      const key = monthKey || this._largestMonth(row);
      const rawMi = Number(row[key]) || this._rowTotal(row, false);
      const exactValueSource = row.tipo === "Budget" || row.tipo === "Faturado";
      const item = {
        id: `PREV-${row.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sourceId: row.id,
        sourceTipo: row.tipo,
        manual: false,
        tipo: row.tipo === "Pedido" ? this._text("portfolio") : row.tipo === "Budget" ? this._text("budget") : row.tipo === "Faturado" ? this._text("billedCurrentYearShort", [CURRENT_YEAR]) : this._text("quote"),
        tipoState: row.tipo === "Pedido" || row.tipo === "Faturado" ? "Information" : row.tipo === "Budget" ? "Success" : "Warning",
        numero: row.tipo === "Pedido" ? this._salesDocumentNumber(row.id) : row.tipo === "Cotacao" ? this._quotationDocumentNumber(row) : row.id,
        cliente: row.cliente,
        desc: row.desc || row.produto || row.mat || row.concatName || "",
        produto: row.desc || row.mat,
        mat: row.mat,
        centro: row.centro,
        eqvs: row.eqvs,
        mtsMto: row.tipo === "Pedido" ? this._text("mto") : this._text("mts"),
        situacao: row.tipo === "Pedido" ? this._text("portfolioSituation") : row.tipo === "Budget" ? this._text("budgetSituation") : row.tipo === "Faturado" ? this._text("billedSituation") : this._text("quoteSituation"),
        situacaoState: row.tipo === "Pedido" || row.tipo === "Budget" || row.tipo === "Faturado" ? "Success" : "Warning",
        editable: false,
        qtd: 1,
        valorUnit: +(rawMi * 1000000 / (exactValueSource ? 1.05 : 1)).toFixed(2),
        prob: row.tipo === "Pedido" || row.tipo === "Budget" || row.tipo === "Faturado" ? 100 : row.prob,
        data: `2026-${String(MONTHS.findIndex((month) => month.key === key) + 1).padStart(2, "0")}-15`,
        status: this._text("included"),
        statusState: "Success",
        highlight: row.tipo === "Pedido" || row.tipo === "Faturado" ? "Information" : row.tipo === "Budget" ? "Success" : "Warning"
      };
      this._normalizeForecast(item);
      return item;
    },

    _largestMonth: function (row) {
      return MONTHS.reduce((best, month) => (Number(row[month.key]) || 0) > (Number(row[best]) || 0) ? month.key : best, "jan");
    },

    _normalizeForecast: function (row) {
      row.qtd = Number(row.qtd) || 0;
      row.valorUnit = Number(row.valorUnit) || 0;
      row.prob = Math.max(0, Math.min(100, Number(row.prob) || 0));
      row.valorTotal = row.qtd * row.valorUnit;
      row.frete = row.valorTotal * 0.05;
      row.valorPond = (row.valorTotal + row.frete) * row.prob / 100;
      row.valorUnitDisplay = this._formatCurrency(row.valorUnit);
      row.valorTotalDisplay = this._formatCurrency(row.valorTotal);
      row.freteDisplay = this._formatCurrency(row.frete);
      row.valorPondDisplay = this._formatCurrency(row.valorPond);
      row.mesKey = this._monthKeyFromDate(row.data);
      row.mes = this._monthLabel(row.mesKey);
      row.isBudgetForecast = this._isForecastBudgetRow(row);
      const technicalStatus = this._technicalStatusFor(row);
      row.HAS_ROUTING = technicalStatus.hasRouting;
      row.HAS_COST = technicalStatus.hasCost;
      row.STATUS_TECNICO = technicalStatus.code;
      row.technicalStatusText = technicalStatus.text;
      row.technicalStatusState = technicalStatus.state;
      row.technicalStatusIcon = technicalStatus.icon;
      row.editable = !!row.editable;
      row.editableBudgetFields = !!row.editableBudgetFields || row.isBudgetForecast;
      row.qtdEditable = row.editable || row.editableBudgetFields;
      row.valorUnitEditable = row.editable || row.editableBudgetFields;
      row.dataEditable = row.editable || row.editableBudgetFields;
      row.status = row.status || this._text("included");
      row.statusState = row.statusState || "Success";
      row.situacaoState = row.situacaoState || "Information";
      return row;
    },

    _technicalStatusFor: function (row) {
      const hasRouting = this._hasValidRouting(row);
      const hasCost = this._hasValidCost(row);
      if (hasRouting && hasCost) {
        return {
          hasRouting,
          hasCost,
          code: "ROTEIRO_E_CUSTO",
          text: this._text("technicalRoutingAndCost"),
          state: "Success",
          icon: "sap-icon://sys-enter-2"
        };
      }
      if (hasRouting && !hasCost) {
        return {
          hasRouting,
          hasCost,
          code: "SOMENTE_ROTEIRO",
          text: this._text("technicalRoutingOnly"),
          state: "Warning",
          icon: "sap-icon://process"
        };
      }
      if (!hasRouting && hasCost) {
        return {
          hasRouting,
          hasCost,
          code: "SOMENTE_CUSTO",
          text: this._text("technicalCostOnly"),
          state: "Warning",
          icon: "sap-icon://money-bills"
        };
      }
      return {
        hasRouting,
        hasCost,
        code: "SEM_DADOS",
        text: this._text("technicalNoData"),
        state: "Error",
        icon: "sap-icon://alert"
      };
    },

    _hasValidRouting: function (row) {
      const material = String(row.mat || "").trim();
      const centro = String(row.centro || "").trim();
      const forecastDate = this._forecastDateFor(row);
      if (!material || !centro || !forecastDate) {
        return false;
      }
      return TECHNICAL_ROUTINGS.some((routing) => {
        const validFrom = this._normalizeDateValue(routing.validFrom || routing.valid_from || routing.dataInicio);
        const validTo = this._normalizeDateValue(routing.validTo || routing.valid_to || routing.dataFim);
        return String(routing.material || "").trim() === material &&
          String(routing.centro || "").trim() === centro &&
          (!validFrom || validFrom <= forecastDate) &&
          (!validTo || validTo >= forecastDate);
      });
    },

    _hasValidCost: function (row) {
      const material = String(row.mat || "").trim();
      const centro = String(row.centro || "").trim();
      const period = this._periodFromDate(this._forecastDateFor(row));
      if (!material || !centro || !period) {
        return false;
      }
      return TECHNICAL_COSTS.some((cost) =>
        String(cost.material || "").trim() === material &&
        String(cost.centro || "").trim() === centro &&
        String(cost.period || cost.periodo || "").trim() === period
      );
    },

    _periodFromDate: function (value) {
      const normalizedDate = this._normalizeDateValue(value);
      return normalizedDate ? normalizedDate.slice(0, 7) : "";
    },

    _forecastDateFor: function (row) {
      const explicitDate = this._normalizeDateValue(row.data || row.date);
      if (explicitDate) {
        return explicitDate;
      }
      const monthIndex = MONTHS.findIndex((month) => month.key === (row.monthKey || row.mesKey));
      if (monthIndex < 0) {
        return "";
      }
      const year = row.year || this._model.getProperty("/selectedYear") || CURRENT_YEAR;
      return `${year}-${String(monthIndex + 1).padStart(2, "0")}-15`;
    },

    _forecastMonthTotals: function (weightedForecast, onlyMonthKey, rowFilter) {
      const totals = MONTHS.reduce((acc, { key }) => {
        acc[key] = 0;
        return acc;
      }, {});
      const forecastRows = this._forecastChartRows();
      if (!forecastRows.length) {
        return rowFilter ? totals : this._mockTotals(PREVISAO_IRRESTRITA_2026, onlyMonthKey);
      }
      return forecastRows.reduce((acc, row) => {
        this._normalizeForecast(row);
        if ((!rowFilter || rowFilter(row)) && (!onlyMonthKey || row.mesKey === onlyMonthKey)) {
          acc[row.mesKey] = (acc[row.mesKey] || 0) + this._forecastValueMi(row, weightedForecast);
        }
        return acc;
      }, totals);
    },

    _isForecastBudgetRow: function (row) {
      return row.sourceTipo === "Budget" || row.tipo === this._text("budget");
    },

    _forecastValueMi: function (row, weightedForecast) {
      this._normalizeForecast(row);
      const value = weightedForecast ? row.valorPond : row.valorTotal + row.frete;
      return value / 1000000;
    },

    _forecastChartRows: function () {
      const savedById = this._filteredSavedForecast().reduce((acc, row) => {
        acc[row.id] = row;
        return acc;
      }, {});
      this._filteredForecast().forEach((row) => {
        savedById[row.id] = row;
      });
      return Object.keys(savedById).map((id) => savedById[id]);
    },

    _selectedItems: function (tableId) {
      const table = this.byId(tableId);
      return table ? table.getSelectedItems() : [];
    },

    _selectedObjects: function (tableId) {
      return this._selectedItems(tableId)
        .map((item) => item.getBindingContext("app"))
        .filter(Boolean)
        .map((context) => context.getObject());
    },

    _sourceSelectionPath: function (tableId) {
      return `/sourceSelections/${tableId}`;
    },

    _sourceRowsPathForTable: function (tableId) {
      return {
        portfolioTable: "/carteiraRows",
        quoteTable: "/cotacaoRows",
        budgetTable: "/budgetObjectRows"
      }[tableId] || "";
    },

    _rememberSourceSelection: function (event) {
      const source = event && event.getSource && event.getSource();
      const runtimeId = source && source.getId && source.getId();
      const tableId = runtimeId ? runtimeId.split("--").pop() : "";
      const item = event && event.getParameter && event.getParameter("listItem");
      const context = item && item.getBindingContext("app");
      const row = context && context.getObject();
      if (!tableId || !row || !row.id) {
        return;
      }
      const path = this._sourceSelectionPath(tableId);
      const selections = { ...(this._model.getProperty(path) || {}) };
      if (event.getParameter("selected")) {
        selections[row.id] = true;
      } else {
        delete selections[row.id];
      }
      this._model.setProperty(path, selections);
    },

    _selectedSourceObjects: function (tableId) {
      const byId = {};
      this._selectedObjects(tableId).forEach((row) => {
        if (row && row.id) {
          byId[row.id] = row;
        }
      });

      const selections = this._model.getProperty(this._sourceSelectionPath(tableId)) || {};
      const rowsPath = this._sourceRowsPathForTable(tableId);
      const rows = rowsPath ? this._model.getProperty(rowsPath) || [] : [];
      rows.forEach((row) => {
        if (row && row.id && selections[row.id] && !byId[row.id]) {
          byId[row.id] = row;
        }
      });

      return Object.keys(byId).map((id) => byId[id]);
    },

    _clearTrackedSourceSelection: function (tableId) {
      this._model.setProperty(this._sourceSelectionPath(tableId), {});
    },

    _clearSourceSelections: function () {
      ["portfolioTable", "quoteTable", "budgetTable"].forEach((tableId) => {
        const table = this.byId(tableId);
        if (table) {
          table.removeSelections(true);
        }
        this._clearTrackedSourceSelection(tableId);
      });
    },

    _budgetByFilter: function (onlyMonthKey) {
      const centers = this._globalCenters();
      const teams = this._globalTeams();
      const monthKeys = this._monthKeysFromRange(this._model.getProperty("/selectedDateRange"));
      const budget = { ...EMPTY_BUDGET };
      BUDGET_ROWS.forEach((row) => {
        const monthKey = MONTHS[row.month - 1].key;
        const centerOk = this._matchesSelectedKeys(row.fabril, centers);
        const teamOk = this._matchesSelectedKeys(row.eqvs, teams);
        const monthOk = !monthKeys.length || monthKeys.includes(monthKey);
        if (centerOk && teamOk && monthOk && (!onlyMonthKey || monthKey === onlyMonthKey)) {
          budget[monthKey] += row.valueMi;
        }
      });
      MONTHS.forEach(({ key }) => {
        budget[key] = +budget[key].toFixed(3);
      });
      return budget;
    },

    _budgetSourceRows: function (onlyMonthKey) {
      const allCenters = Object.keys(FABRIL_TEXT);
      const allTeams = Object.keys(EQVS_TEXT);
      const centers = this._globalCenters().length ? this._globalCenters() : allCenters;
      const teams = this._globalTeams().length ? this._globalTeams() : allTeams;
      const globalMonthKeys = this._monthKeysFromRange(this._model.getProperty("/selectedDateRange"));
      return BUDGET_ROWS
        .filter((row) => {
          const monthKey = MONTHS[row.month - 1] && MONTHS[row.month - 1].key;
          const centerOk = this._matchesSelectedKeys(row.fabril, centers);
          const teamOk = this._matchesSelectedKeys(row.eqvs, teams);
          const globalMonthOk = !globalMonthKeys.length || globalMonthKeys.includes(monthKey);
          const monthOk = !onlyMonthKey || monthKey === onlyMonthKey;
          return centerOk && teamOk && globalMonthOk && monthOk;
        })
        .map((row, index) => {
          const monthKey = MONTHS[row.month - 1].key;
          const source = {
            id: row.id || `BUD-${row.fabril}-${row.eqvs}-${row.month}-${index}`,
            tipo: "Budget",
            cliente: row.cliente || EQVS_TEXT[row.eqvs] || row.eqvs,
            mat: row.concatName || `Budget ${row.year || this._model.getProperty("/selectedYear") || "2026"}`,
            desc: row.concatName || row.sourceColumn || this._text("budgetForecastObject"),
            centro: row.fabril,
            eqvs: row.eqvs,
            prob: 100,
            monthKey,
            year: row.year || Number(this._model.getProperty("/selectedYear")) || 2026,
            day: row.day || 1,
            date: row.date,
            concatName: row.concatName,
            rawValue: Number(row.rawValue) || (Number(row.valueMi) || 0) * 1000000
          };
          MONTHS.forEach(({ key }) => {
            source[key] = key === monthKey ? Number(row.valueMi) || 0 : 0;
          });
          return source;
        });
    },

    _monthTotals: function (rows, weighted, onlyMonthKey) {
      return MONTHS.reduce((acc, { key }) => {
        acc[key] = onlyMonthKey && key !== onlyMonthKey
          ? 0
          : rows.reduce((sum, row) => sum + this._valueFor(row, key, weighted), 0);
        return acc;
      }, {});
    },

    _mockTotals: function (values, onlyMonthKey) {
      return MONTHS.reduce((acc, { key }) => {
        acc[key] = onlyMonthKey && key !== onlyMonthKey ? 0 : Number(values[key]) || 0;
        return acc;
      }, {});
    },

    _valueFor: function (row, month, weighted) {
      const rawValue = Number(row[month]) || 0;
      if (row.tipo === "Cotacao" && weighted) {
        return rawValue * (Number(row.prob) || 0) / 100;
      }
      return rawValue;
    },

    _rowTotal: function (row, weighted) {
      return MONTHS.reduce((sum, month) => sum + this._valueFor(row, month.key, weighted), 0);
    },

    _sum: function (object) {
      return Object.keys(object).reduce((sum, key) => sum + Number(object[key] || 0), 0);
    },

    _sumTotals: function (totalsList) {
      return MONTHS.reduce((acc, { key }) => {
        acc[key] = totalsList.reduce((sum, totals) => sum + Number((totals || {})[key] || 0), 0);
        return acc;
      }, {});
    },

    _format: function (value) {
      return Number(value || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
    },

    _formatCurrency: function (value) {
      return Number(value || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    _formatChartCurrency: function (value) {
      const absValue = Math.abs(Number(value) || 0);
      if (absValue >= 1000000) {
        return `${(Number(value) / 1000000).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} Mi`;
      }
      return Number(value || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    },

    _formatSmartAmount: function (rawValue) {
      const value = Number(rawValue) || 0;
      if (Math.abs(value) >= 1000000) {
        return {
          number: (value / 1000000).toLocaleString("pt-BR", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
          }),
          unit: "Mi"
        };
      }
      return {
        number: value.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        unit: "R$"
      };
    },

    _smartFromMi: function (valueMi) {
      return this._formatSmartAmount((Number(valueMi) || 0) * 1000000);
    },

    _grossWeightFromMi: function (valueMi) {
      const rawValue = (Number(valueMi) || 0) * 1000000;
      const tons = rawValue / GROSS_WEIGHT_BRL_PER_KG / 1000;
      if (Math.abs(tons) >= 1000) {
        return {
          number: (tons / 1000).toLocaleString("pt-BR", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
          }),
          unit: "kt"
        };
      }
      return {
        number: tons.toLocaleString("pt-BR", {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3
        }),
        unit: "t"
      };
    },

    _monthKeyFromDate: function (date) {
      const normalizedDate = this._normalizeDateValue(date);
      if (!normalizedDate) {
        return "";
      }
      const monthIndex = Math.max(0, Math.min(11, Number(normalizedDate.slice(5, 7)) - 1));
      return MONTHS[monthIndex].key;
    },

    _monthKeyFromChartLabel: function (label) {
      const normalizedLabel = this._normalizeSearch(label).replace(/\s+/g, "");
      const month = MONTHS.find((item) => {
        return this._normalizeSearch(this._monthLabel(item.key)).replace(/\s+/g, "") === normalizedLabel
          || this._normalizeSearch(item.key) === normalizedLabel;
      });
      return month ? month.key : "";
    },

    _referenceMonthKey: function () {
      const selectedRange = this._dateRangeFromValue(this._model.getProperty("/selectedDateRange") || "");
      const selectedDate = selectedRange.from || this._model.getProperty("/selectedDate") || "";
      if (selectedDate) {
        return this._monthKeyFromDate(selectedDate);
      }
      return MONTHS[new Date().getMonth()].key;
    },

    _dateRangeFromValue: function (value) {
      const rawValue = String(value || "");
      const isoDates = rawValue.match(/\d{4}-\d{2}-\d{2}/g) || [];
      const localDates = rawValue.match(/\d{2}\/\d{2}\/\d{4}/g) || [];
      const dates = isoDates.length ? isoDates : localDates.map((date) => this._normalizeDateValue(date));
      return {
        from: dates[0] || "",
        to: dates[1] || dates[0] || ""
      };
    },

    _normalizeDateValue: function (date) {
      const value = String(date || "").trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }
      const localMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (localMatch) {
        return `${localMatch[3]}-${localMatch[2]}-${localMatch[1]}`;
      }
      return "";
    },

    _formatDateDisplay: function (date) {
      const normalizedDate = this._normalizeDateValue(date);
      if (!normalizedDate) {
        return "";
      }
      return `${normalizedDate.slice(8, 10)}/${normalizedDate.slice(5, 7)}/${normalizedDate.slice(0, 4)}`;
    },

    _yearFromDate: function (date) {
      const normalizedDate = this._normalizeDateValue(date);
      return normalizedDate ? normalizedDate.slice(0, 4) : CURRENT_YEAR;
    },

    _monthLabel: function (monthKey) {
      const month = MONTHS.find((item) => item.key === monthKey);
      return month ? this._text(month.labelKey) : this._text("jan");
    },

    _setMessage: function (text, type) {
      this._model.setProperty("/message", text);
      this._model.setProperty("/messageType", type || "Information");
    },

    _text: function (key, args) {
      return this._resourceBundle.getText(key, args);
    }
  });
});
