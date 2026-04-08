/**
 * grafico.js
 * Responsável pela renderização, atualização e filtragem do gráfico de parcelas
 * usando Chart.js v4. Mantém uma única instância do chart para que
 * as atualizações sejam animadas (sem recriar o canvas a cada mudança).
 */

/** @type {Chart|null} Instância ativa do Chart.js */
let instanciaGrafico = null;

/**
 * Lista completa de parcelas ordenadas por data.
 * Usada para gerar os filtros de ano e como fonte de verdade.
 * @type {Array}
 */
let parcelasTodas = [];

/**
 * Subconjunto de parcelasTodas atualmente exibido no gráfico.
 * Também usado pelo tooltip para exibir dados corretos.
 * @type {Array}
 */
let parcelasAtuais = [];

/** @type {string|null} Ano selecionado no filtro, ou null para "Todos" */
let anoSelecionado = null;

/* ── Formatadores ────────────────────────────────────────────── */

/**
 * Formata um número como moeda brasileira (R$ 1.234,56).
 * @param {number} valor
 * @returns {string}
 */
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata um valor numérico para o eixo Y do gráfico de forma legível.
 * @param {number} valor
 * @returns {string}
 */
function formatarEixoY(valor) {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`;
  if (valor >= 1_000)     return `R$ ${(valor / 1_000).toFixed(1)}k`;
  return `R$ ${valor.toFixed(0)}`;
}

/**
 * Formata uma string "YYYY-MM" para exibição abreviada "MMM/YY".
 * @param {string} anoMes - Ex: "2025-03"
 * @returns {string} Ex: "Mar/25"
 */
function formatarMesAno(anoMes) {
  const [ano, mes] = anoMes.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[parseInt(mes, 10) - 1]}/${ano.slice(2)}`;
}

/**
 * Determina a cor de cada barra com base em passado, presente ou futuro.
 * @param {string} dataParcela - "YYYY-MM"
 * @returns {{ bg: string, border: string }}
 */
function corDaParcela(dataParcela) {
  const hoje = new Date();
  const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  if (dataParcela < anoMesAtual)  return { bg: 'rgba(107,122,144,0.45)', border: 'rgba(107,122,144,0.7)' };
  if (dataParcela === anoMesAtual) return { bg: 'rgba(249,168,37,0.8)',   border: 'rgba(249,168,37,1)' };
  return { bg: 'rgba(0,180,216,0.65)', border: 'rgba(0,150,183,1)' };
}

/* ── Filtros por ano ─────────────────────────────────────────── */

/**
 * Renderiza o filtro de ano como um <select> acima do gráfico.
 * Extrai os anos únicos de parcelasTodas e cria uma opção por ano + "Todos".
 */
function renderizarFiltrosAno() {
  const container = document.getElementById('filtros-ano');
  const wrapper   = document.getElementById('filtros-ano-wrapper');
  if (!container) return;

  container.innerHTML = '';

  const anos = [...new Set(parcelasTodas.map(p => p.data_parcela.slice(0, 4)))].sort();

  // Oculta o filtro se houver apenas um ano
  if (anos.length <= 1) {
    wrapper.style.display = 'none';
    return;
  }
  wrapper.style.display = '';

  const label = document.createElement('label');
  label.htmlFor   = 'select-filtro-ano';
  label.textContent = 'Filtrar por ano:';
  label.className = 'filtro-ano-label';

  const select = document.createElement('select');
  select.id        = 'select-filtro-ano';
  select.className = 'form-select form-select-sm filtro-ano-select';

  // Opção "Todos"
  const optTodos = document.createElement('option');
  optTodos.value       = '';
  optTodos.textContent = 'Todos os anos';
  select.appendChild(optTodos);

  anos.forEach(ano => {
    const opt = document.createElement('option');
    opt.value       = ano;
    opt.textContent = ano;
    if (ano === anoSelecionado) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    anoSelecionado = select.value || null;
    aplicarFiltroAno();
  });

  container.appendChild(label);
  container.appendChild(select);
}

/**
 * Aplica o filtro de ano selecionado e atualiza o gráfico.
 */
function aplicarFiltroAno() {
  const lista = anoSelecionado
    ? parcelasTodas.filter(p => p.data_parcela.startsWith(anoSelecionado))
    : parcelasTodas;

  atualizarDadosGrafico(lista);
}

/* ── Renderização do gráfico ─────────────────────────────────── */

/**
 * Atualiza parcelasAtuais e os dados do chart com um subconjunto de parcelas.
 * @param {Array} lista - Parcelas a exibir (já deve estar ordenada)
 */
function atualizarDadosGrafico(lista) {
  parcelasAtuais = lista;

  const labels       = lista.map(p => formatarMesAno(p.data_parcela));
  const valores      = lista.map(p => p.valor_parcela);
  const cores        = lista.map(p => corDaParcela(p.data_parcela));
  const bgColors     = cores.map(c => c.bg);
  const borderColors = cores.map(c => c.border);

  const infoEl = document.getElementById('grafico-info-parcelas');
  if (infoEl) {
    const total = parcelasTodas.length;
    const exibindo = lista.length;
    infoEl.textContent = anoSelecionado
      ? `${exibindo} parcela${exibindo !== 1 ? 's' : ''} de ${total}`
      : `${total} parcela${total !== 1 ? 's' : ''}`;
  }

  if (!instanciaGrafico) return;

  instanciaGrafico.data.labels = labels;
  instanciaGrafico.data.datasets[0].data = valores;
  instanciaGrafico.data.datasets[0].backgroundColor = bgColors;
  instanciaGrafico.data.datasets[0].borderColor = borderColors;
  instanciaGrafico.update('active');
}

/**
 * Renderiza (ou atualiza) o gráfico de barras com o cronograma de parcelas.
 * Na primeira chamada cria o chart; nas seguintes, atualiza os dados e anima.
 * Também (re)gera os botões de filtro por ano.
 * @param {Array<{numero_parcela: number, data_parcela: string, valor_parcela: number}>} parcelas
 */
function renderizarGrafico(parcelas) {
  const canvas = document.getElementById('grafico-parcelas');
  if (!canvas) return;

  // Atualiza lista completa ordenada
  parcelasTodas = [...parcelas].sort((a, b) =>
    a.data_parcela.localeCompare(b.data_parcela)
  );

  // Reseta filtro ao recarregar parcelas (ex: após amortização)
  anoSelecionado = null;

  renderizarFiltrosAno();

  // Define os dados visíveis (todos, pois filtro foi resetado)
  parcelasAtuais = parcelasTodas;

  const labels       = parcelasAtuais.map(p => formatarMesAno(p.data_parcela));
  const valores      = parcelasAtuais.map(p => p.valor_parcela);
  const cores        = parcelasAtuais.map(p => corDaParcela(p.data_parcela));
  const bgColors     = cores.map(c => c.bg);
  const borderColors = cores.map(c => c.border);

  const infoEl = document.getElementById('grafico-info-parcelas');
  if (infoEl) {
    infoEl.textContent = `${parcelas.length} parcela${parcelas.length !== 1 ? 's' : ''}`;
  }

  if (instanciaGrafico) {
    instanciaGrafico.data.labels = labels;
    instanciaGrafico.data.datasets[0].data = valores;
    instanciaGrafico.data.datasets[0].backgroundColor = bgColors;
    instanciaGrafico.data.datasets[0].borderColor = borderColors;
    instanciaGrafico.update('active');
    return;
  }

  // Criação inicial do chart
  const ctx = canvas.getContext('2d');

  instanciaGrafico = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valor da Parcela',
        data: valores,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: 'easeInOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1b2a',
          titleColor: '#00b4d8',
          bodyColor: '#fff',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            // Usa parcelasAtuais (referência mutável) — sempre reflete o filtro atual
            title(items) {
              const p = parcelasAtuais[items[0].dataIndex];
              return p ? `Parcela ${p.numero_parcela} — ${formatarMesAno(p.data_parcela)}` : '';
            },
            label(item) {
              return ` ${formatarMoeda(item.raw)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b7a90',
            font: { size: 10 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 24,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(214,224,238,0.6)' },
          ticks: {
            color: '#6b7a90',
            font: { size: 10 },
            callback: formatarEixoY,
          },
        },
      },
    },
  });
}

/**
 * Destrói a instância do gráfico e limpa o estado de filtro.
 */
function destruirGrafico() {
  if (instanciaGrafico) {
    instanciaGrafico.destroy();
    instanciaGrafico = null;
  }
  parcelasTodas  = [];
  parcelasAtuais = [];
  anoSelecionado = null;

  const infoEl    = document.getElementById('grafico-info-parcelas');
  const filtrosEl = document.getElementById('filtros-ano');
  const wrapperEl = document.getElementById('filtros-ano-wrapper');

  if (infoEl)    infoEl.textContent   = '';
  if (filtrosEl) filtrosEl.innerHTML  = '';
  if (wrapperEl) wrapperEl.style.display = 'none';
}
