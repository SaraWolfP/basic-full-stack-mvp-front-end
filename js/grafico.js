/**
 * grafico.js
 * Responsável pela renderização e atualização do gráfico de parcelas
 * usando Chart.js v4. Mantém uma única instância do chart para que
 * as atualizações sejam animadas (sem recriar o canvas a cada mudança).
 */

/** @type {Chart|null} Instância ativa do Chart.js */
let instanciaGrafico = null;

/**
 * Referência mutável ao array ordenado de parcelas.
 * Mantida fora do closure para que o tooltip sempre use os dados atuais.
 * @type {Array}
 */
let parcelasAtuais = [];

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
 * Usa sufixo "k" apenas quando o valor é >= 1000, com uma casa decimal.
 * @param {number} valor
 * @returns {string}
 */
function formatarEixoY(valor) {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`;
  if (valor >= 1_000)    return `R$ ${(valor / 1_000).toFixed(1)}k`;
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
 * Determina a cor de cada barra com base em se a parcela está no passado,
 * presente ou futuro em relação ao mês atual.
 * @param {string} dataParcela - "YYYY-MM"
 * @returns {{ bg: string, border: string }}
 */
function corDaParcela(dataParcela) {
  const hoje = new Date();
  const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  if (dataParcela < anoMesAtual) {
    return { bg: 'rgba(107,122,144,0.45)', border: 'rgba(107,122,144,0.7)' };
  }
  if (dataParcela === anoMesAtual) {
    return { bg: 'rgba(249,168,37,0.8)', border: 'rgba(249,168,37,1)' };
  }
  return { bg: 'rgba(0,180,216,0.65)', border: 'rgba(0,150,183,1)' };
}

/**
 * Renderiza (ou atualiza) o gráfico de barras com o cronograma de parcelas.
 * Na primeira chamada cria o chart; nas seguintes, atualiza os dados e anima.
 * @param {Array<{numero_parcela: number, data_parcela: string, valor_parcela: number}>} parcelas
 */
function renderizarGrafico(parcelas) {
  const canvas = document.getElementById('grafico-parcelas');
  const infoEl = document.getElementById('grafico-info-parcelas');

  if (!canvas) return;

  // Ordena por data para garantir exibição cronológica e atualiza referência global
  parcelasAtuais = [...parcelas].sort((a, b) =>
    a.data_parcela.localeCompare(b.data_parcela)
  );

  const labels      = parcelasAtuais.map(p => formatarMesAno(p.data_parcela));
  const valores     = parcelasAtuais.map(p => p.valor_parcela);
  const cores       = parcelasAtuais.map(p => corDaParcela(p.data_parcela));
  const bgColors    = cores.map(c => c.bg);
  const borderColors = cores.map(c => c.border);

  if (infoEl) {
    infoEl.textContent = `${parcelas.length} parcela${parcelas.length !== 1 ? 's' : ''}`;
  }

  if (instanciaGrafico) {
    // Atualiza dados sem recriar — preserva animação
    instanciaGrafico.data.labels = labels;
    instanciaGrafico.data.datasets[0].data = valores;
    instanciaGrafico.data.datasets[0].backgroundColor = bgColors;
    instanciaGrafico.data.datasets[0].borderColor = borderColors;
    instanciaGrafico.update('active');
    return;
  }

  // Criação inicial
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
            // Usa parcelasAtuais (referência mutável) para sempre refletir o estado atual
            title(items) {
              const p = parcelasAtuais[items[0].dataIndex];
              return p
                ? `Parcela ${p.numero_parcela} — ${formatarMesAno(p.data_parcela)}`
                : '';
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
            // Não limita o número de ticks para que o Chart.js escolha intervalos adequados
            callback: formatarEixoY,
          },
        },
      },
    },
  });
}

/**
 * Destrói a instância do gráfico (chamado ao desselecionar/deletar financiamento).
 */
function destruirGrafico() {
  if (instanciaGrafico) {
    instanciaGrafico.destroy();
    instanciaGrafico = null;
  }
  parcelasAtuais = [];
  const infoEl = document.getElementById('grafico-info-parcelas');
  if (infoEl) infoEl.textContent = '';
}
