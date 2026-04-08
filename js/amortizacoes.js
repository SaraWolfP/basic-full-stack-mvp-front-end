/**
 * amortizacoes.js
 * Gerencia o formulário de amortização, a tabela de amortizações,
 * e os cards de resumo (total a pagar + parcelas restantes).
 * Após cada operação (criar/deletar), recarrega parcelas, atualiza
 * o gráfico e recalcula o resumo.
 */

/* ── Resumo ─────────────────────────────────────────────────── */

/**
 * Calcula os quatro valores de resumo combinando parcelas e amortizações extras.
 * As amortizações são pagamentos reais fora do cronograma e entram nos totais pagos/gerais.
 * @param {Array<{data_parcela: string, valor_parcela: number}>} parcelas
 * @param {Array<{data_amortizacao: string, valor_amortizado: number}>} amortizacoes
 * @returns {{
 *   totalAPagar: number,
 *   numeroParcelas: number,
 *   totalGeral: number,
 *   totalPago: number,
 *   numeroPagas: number
 * }}
 */
function calcularResumo(parcelas, amortizacoes = []) {
  const hoje = new Date();
  const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  const futuras = parcelas.filter(p => p.data_parcela >= anoMesAtual);
  const passadas = parcelas.filter(p => p.data_parcela < anoMesAtual);

  // Amortizações cujas datas já passaram (já foram pagas)
  const amortizacoesPagas  = amortizacoes.filter(a => a.data_amortizacao < anoMesAtual);
  const amortizacoesFuturas = amortizacoes.filter(a => a.data_amortizacao >= anoMesAtual);
  const totalAmortizacoesPagas  = amortizacoesPagas.reduce((soma, a) => soma + a.valor_amortizado, 0);
  const totalAmortizacoesFuturas = amortizacoesFuturas.reduce((soma, a) => soma + a.valor_amortizado, 0);
  const totalAmortizacoesGeral  = amortizacoes.reduce((soma, a) => soma + a.valor_amortizado, 0);

  const totalAPagar = futuras.reduce((soma, p) => soma + p.valor_parcela, 0) + totalAmortizacoesFuturas;
  const totalGeral  = parcelas.reduce((soma, p) => soma + p.valor_parcela, 0) + totalAmortizacoesGeral;
  const totalPago   = passadas.reduce((soma, p) => soma + p.valor_parcela, 0) + totalAmortizacoesPagas;

  return {
    totalAPagar,
    numeroParcelas: futuras.length,
    totalGeral,
    totalPago,
    numeroPagas: passadas.length,
  };
}

/**
 * Atualiza os quatro cards de resumo na interface.
 * @param {Array<Object>} parcelas
 * @param {Array<Object>} [amortizacoes=[]]
 */
function atualizarResumo(parcelas, amortizacoes = []) {
  const { totalAPagar, numeroParcelas, totalGeral, totalPago, numeroPagas } = calcularResumo(parcelas, amortizacoes);

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const el = (id) => document.getElementById(id);

  // Total a pagar a partir de hoje
  if (el('resumo-total'))       el('resumo-total').textContent = fmt(totalAPagar);

  // Parcelas restantes
  if (el('resumo-parcelas'))    el('resumo-parcelas').textContent = numeroParcelas;
  if (el('resumo-parcelas-sub')) {
    el('resumo-parcelas-sub').textContent =
      `mese${numeroParcelas !== 1 ? 's' : ''} restante${numeroParcelas !== 1 ? 's' : ''}`;
  }

  // Total geral do financiamento (todas as parcelas)
  if (el('resumo-total-geral')) el('resumo-total-geral').textContent = fmt(totalGeral);

  // Total já pago (parcelas passadas)
  if (el('resumo-total-pago'))  el('resumo-total-pago').textContent = fmt(totalPago);
  if (el('resumo-pago-sub')) {
    el('resumo-pago-sub').textContent =
      `${numeroPagas} parcela${numeroPagas !== 1 ? 's' : ''} paga${numeroPagas !== 1 ? 's' : ''}`;
  }
}

/* ── Tabela de amortizações ─────────────────────────────────── */

/**
 * Renderiza a tabela de amortizações de um financiamento.
 * @param {Array<{id: number, data_amortizacao: string, valor_amortizado: number, tipo: string}>} amortizacoes
 * @param {number} finId - ID do financiamento para referência nos botões de deletar
 */
function renderizarTabelaAmortizacoes(amortizacoes, finId) {
  const tbody  = document.getElementById('tbody-amortizacoes');
  const tabela = document.getElementById('tabela-amortizacoes');
  const vazio  = document.getElementById('lista-amor-vazia');
  const badge  = document.getElementById('badge-total-amor');

  if (!tbody) return;

  tbody.innerHTML = '';

  const temDados = amortizacoes.length > 0;
  vazio.style.display  = temDados ? 'none' : '';
  tabela.style.display = temDados ? '' : 'none';
  badge.textContent    = amortizacoes.length;

  // Ordena por data crescente para exibição coerente
  const ordenadas = [...amortizacoes].sort((a, b) =>
    a.data_amortizacao.localeCompare(b.data_amortizacao)
  );

  ordenadas.forEach(amor => {
    const tr = document.createElement('tr');

    const corTipo = amor.tipo === 'PARCELA'
      ? 'style="background:#e8fff0;color:#25a847;"'
      : 'style="background:#fff3e0;color:#e65100;"';

    tr.innerHTML = `
      <td>${escHtml(amor.data_amortizacao)}</td>
      <td class="fw-semibold">${amor.valor_amortizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      <td>
        <span class="badge" ${corTipo}>
          ${amor.tipo === 'PARCELA' ? '↓ Parcela' : '↓ Prazo'}
        </span>
      </td>
      <td>
        <button
          class="btn-danger-sm btn-deletar-amor"
          data-fin-id="${finId}"
          data-amor-id="${amor.id}"
          title="Deletar amortização"
          aria-label="Deletar amortização de ${escHtml(amor.data_amortizacao)}"
        >
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Event listeners dos botões de deletar
  tbody.querySelectorAll('.btn-deletar-amor').forEach(btn => {
    btn.addEventListener('click', () => {
      const fId = Number(btn.dataset.finId);
      const aId = Number(btn.dataset.amorId);
      confirmarDeletarAmortizacao(fId, aId);
    });
  });
}

/* ── Formulário de amortização ───────────────────────────────── */

/**
 * Registra o handler do formulário de nova amortização.
 * Após criar, recarrega parcelas, atualiza gráfico e resumo.
 */
function registrarFormAmortizacao() {
  const form   = document.getElementById('form-amortizacao');
  const erroEl = document.getElementById('amor-erro');
  const btnEl  = document.getElementById('btn-amortizar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.classList.add('d-none');

    if (!financiamentoSelecionadoId) {
      mostrarErroAmor('Nenhum financiamento selecionado.');
      return;
    }

    const valor = parseFloat(document.getElementById('amor-valor').value);
    const data  = document.getElementById('amor-data').value;
    const tipo  = document.getElementById('amor-tipo').value;

    if (isNaN(valor) || valor <= 0) return mostrarErroAmor('Informe um valor válido.');
    if (!data) return mostrarErroAmor('Informe a data da amortização.');

    btnEl.disabled = true;
    btnEl.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Calculando…';

    try {
      await criarAmortizacao(financiamentoSelecionadoId, {
        valor_amortizado: valor,
        data_amortizacao: data,
        tipo,
      });

      form.reset();
      mostrarToast('Amortização adicionada e parcelas recalculadas!', 'success');
      await recarregarPainelPosAmortizacao(financiamentoSelecionadoId);
    } catch (err) {
      mostrarErroAmor(err.message);
    } finally {
      btnEl.disabled = false;
      btnEl.innerHTML = '<i class="bi bi-plus-lg me-1"></i>Adicionar Amortização';
    }

    function mostrarErroAmor(msg) {
      erroEl.textContent = msg;
      erroEl.classList.remove('d-none');
    }
  });
}

/* ── Deleção de amortização ──────────────────────────────────── */

/**
 * Solicita confirmação e deleta uma amortização.
 * Após deletar, o back-end reconstrói as parcelas; o front recarrega o painel.
 * @param {number} finId
 * @param {number} amorId
 */
async function confirmarDeletarAmortizacao(finId, amorId) {
  if (!confirm('Deseja remover esta amortização?\nAs parcelas serão recalculadas.')) return;

  try {
    await deletarAmortizacao(finId, amorId);
    mostrarToast('Amortização removida e parcelas atualizadas.', 'success');
    await recarregarPainelPosAmortizacao(finId);
  } catch (err) {
    mostrarToast(`Erro ao deletar amortização: ${err.message}`, 'danger');
  }
}

/* ── Recarga do painel após mudança de amortização ───────────── */

/**
 * Recarrega parcelas e amortizações de um financiamento e atualiza
 * o gráfico e o resumo na interface.
 * @param {number} finId
 */
async function recarregarPainelPosAmortizacao(finId) {
  try {
    const [parcelas, amortizacoes] = await Promise.all([
      listarParcelas(finId),
      listarAmortizacoes(finId),
    ]);

    renderizarGrafico(parcelas);
    atualizarResumo(parcelas, amortizacoes);
    renderizarTabelaAmortizacoes(amortizacoes, finId);
  } catch (err) {
    mostrarToast(`Erro ao atualizar painel: ${err.message}`, 'danger');
  }
}
