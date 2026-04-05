/**
 * financiamentos.js
 * Gerencia o formulário de cadastro, a tabela de financiamentos
 * e a lógica de seleção/deleção de um financiamento.
 */

/* ── Helpers de formatação ──────────────────────────────────── */

/**
 * Formata um número como moeda BRL abreviada para exibição na tabela.
 * @param {number} valor
 * @returns {string}
 */
function formatarMoedaTabela(valor) {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(2).replace('.', ',')}M`;
  if (valor >= 1_000)     return `R$ ${(valor / 1_000).toFixed(0)}k`;
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

/* ── Estado do módulo ───────────────────────────────────────── */

/** ID do financiamento atualmente selecionado no painel. */
let financiamentoSelecionadoId = null;

/* ── Renderização da tabela ─────────────────────────────────── */

/**
 * Renderiza a lista de financiamentos na tabela HTML.
 * Controla visibilidade do estado vazio e do badge de contagem.
 * @param {Array<Object>} financiamentos
 */
function renderizarTabelaFinanciamentos(financiamentos) {
  const tbody       = document.getElementById('tbody-financiamentos');
  const tabelaEl   = document.getElementById('tabela-financiamentos');
  const vazioEl    = document.getElementById('lista-financiamentos-vazia');
  const badgeEl    = document.getElementById('badge-total-fin');

  tbody.innerHTML = '';

  const temDados = financiamentos.length > 0;
  vazioEl.style.display   = temDados ? 'none' : '';
  tabelaEl.style.display  = temDados ? '' : 'none';
  badgeEl.textContent     = financiamentos.length;

  financiamentos.forEach(fin => {
    const tr = document.createElement('tr');
    tr.classList.add('financiamento-row');
    tr.dataset.id = fin.id;

    if (fin.id === financiamentoSelecionadoId) {
      tr.classList.add('selecionado');
    }

    const valorFinanciado = fin.valor_imovel - fin.entrada;

    tr.innerHTML = `
      <td>
        <span class="fw-semibold">${escHtml(fin.nome)}</span><br/>
        <small class="text-muted">${escHtml(fin.data_inicio)}</small>
      </td>
      <td>${formatarMoedaTabela(valorFinanciado)}</td>
      <td>
        <span class="badge modelo-badge" style="font-size:0.7rem">${escHtml(fin.modelo)}</span>
      </td>
      <td class="text-muted">${fin.prazo_meses}x</td>
      <td>
        <button
          class="btn-danger-sm btn-deletar-fin"
          data-id="${fin.id}"
          title="Deletar financiamento"
          aria-label="Deletar ${escHtml(fin.nome)}"
        >
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    `;

    // Clique na linha → seleciona o financiamento
    tr.addEventListener('click', (e) => {
      // Não propaga se clicou no botão de deletar
      if (e.target.closest('.btn-deletar-fin')) return;
      selecionarFinanciamento(fin.id);
    });

    tbody.appendChild(tr);
  });

  // Delegação de evento para botões de deletar
  tbody.querySelectorAll('.btn-deletar-fin').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmarDeletarFinanciamento(Number(btn.dataset.id));
    });
  });
}

/* ── Formulário de cadastro ─────────────────────────────────── */

/**
 * Registra o handler de submit do formulário de novo financiamento.
 * Valida os campos, chama a API e recarrega a tabela em caso de sucesso.
 */
function registrarFormFinanciamento() {
  const form    = document.getElementById('form-financiamento');
  const erroEl  = document.getElementById('fin-erro');
  const btnEl   = document.getElementById('btn-cadastrar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.classList.add('d-none');

    const nome      = document.getElementById('fin-nome').value.trim();
    const valor     = parseFloat(document.getElementById('fin-valor').value);
    const entrada   = parseFloat(document.getElementById('fin-entrada').value);
    const taxa      = parseFloat(document.getElementById('fin-taxa').value);
    const prazo     = parseInt(document.getElementById('fin-prazo').value, 10);
    const dataInicio = document.getElementById('fin-data').value;   // "YYYY-MM"
    const modelo    = document.getElementById('fin-modelo').value;

    // Validações básicas no cliente
    if (!nome) return mostrarErroFin('Informe o nome do financiamento.');
    if (isNaN(valor) || valor <= 0) return mostrarErroFin('Valor do imóvel inválido.');
    if (isNaN(entrada) || entrada < 0) return mostrarErroFin('Entrada inválida.');
    if (entrada >= valor) return mostrarErroFin('A entrada deve ser menor que o valor do imóvel.');
    if (isNaN(taxa) || taxa <= 0) return mostrarErroFin('Taxa de juros inválida.');
    if (isNaN(prazo) || prazo < 1) return mostrarErroFin('Prazo inválido.');
    if (!dataInicio) return mostrarErroFin('Informe a data de início.');

    btnEl.disabled = true;
    btnEl.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Cadastrando…';

    try {
      await criarFinanciamento({
        nome,
        valor_imovel: valor,
        entrada,
        taxa_juros: taxa,
        prazo_meses: prazo,
        data_inicio: dataInicio,
        modelo,
      });

      form.reset();
      mostrarToast('Financiamento cadastrado com sucesso!', 'success');
      await recarregarFinanciamentos();
    } catch (err) {
      mostrarErroFin(err.message);
    } finally {
      btnEl.disabled = false;
      btnEl.innerHTML = '<i class="bi bi-plus-lg me-1"></i>Cadastrar Financiamento';
    }
  });

  function mostrarErroFin(msg) {
    erroEl.textContent = msg;
    erroEl.classList.remove('d-none');
  }
}

/* ── Seleção de financiamento ───────────────────────────────── */

/**
 * Seleciona um financiamento e carrega seu painel completo.
 * Atualiza highlight na tabela, cabeçalho, resumo, gráfico e amortizações.
 * @param {number} id
 */
async function selecionarFinanciamento(id) {
  financiamentoSelecionadoId = id;

  // Atualiza destaque na tabela
  document.querySelectorAll('.financiamento-row').forEach(tr => {
    tr.classList.toggle('selecionado', Number(tr.dataset.id) === id);
  });

  // Mostra painel, oculta estado vazio
  document.getElementById('painel-vazio').classList.add('d-none');
  const painel = document.getElementById('painel-financiamento');
  painel.classList.remove('d-none');
  // Reinicia animação
  painel.classList.remove('painel-ativo');
  void painel.offsetWidth;
  painel.classList.add('painel-ativo');

  // Destrói chart anterior para recriação limpa
  destruirGrafico();

  // Mostra loader do gráfico
  document.getElementById('grafico-loading').classList.remove('d-none');

  try {
    // Busca dados em paralelo
    const [fin, parcelas, amortizacoes] = await Promise.all([
      buscarFinanciamento(id),
      listarParcelas(id),
      listarAmortizacoes(id),
    ]);

    // Atualiza cabeçalho do painel
    document.getElementById('painel-nome').textContent = fin.nome;
    const modeloBadge = document.getElementById('painel-modelo-badge');
    modeloBadge.textContent = fin.modelo;

    // Gráfico + Resumo
    document.getElementById('grafico-loading').classList.add('d-none');
    renderizarGrafico(parcelas);
    atualizarResumo(parcelas, amortizacoes);

    // Tabela de amortizações
    renderizarTabelaAmortizacoes(amortizacoes, id);
  } catch (err) {
    document.getElementById('grafico-loading').classList.add('d-none');
    mostrarToast(`Erro ao carregar financiamento: ${err.message}`, 'danger');
  }
}

/* ── Deleção de financiamento ───────────────────────────────── */

/**
 * Solicita confirmação e deleta o financiamento pelo ID.
 * Se o financiamento deletado estava selecionado, volta ao estado vazio.
 * @param {number} id
 */
async function confirmarDeletarFinanciamento(id) {
  // Busca nome para mensagem de confirmação
  const linha = document.querySelector(`.financiamento-row[data-id="${id}"]`);
  const nome  = linha ? linha.querySelector('.fw-semibold')?.textContent : `#${id}`;

  if (!confirm(`Deseja deletar o financiamento "${nome}"?\nTodas as parcelas e amortizações serão removidas.`)) {
    return;
  }

  try {
    await deletarFinanciamento(id);
    mostrarToast('Financiamento deletado com sucesso.', 'success');

    // Se estava selecionado, limpa o painel
    if (financiamentoSelecionadoId === id) {
      financiamentoSelecionadoId = null;
      destruirGrafico();
      document.getElementById('painel-financiamento').classList.add('d-none');
      document.getElementById('painel-vazio').classList.remove('d-none');
    }

    await recarregarFinanciamentos();
  } catch (err) {
    mostrarToast(`Erro ao deletar: ${err.message}`, 'danger');
  }
}

/* ── Recarga da lista ───────────────────────────────────────── */

/**
 * Busca todos os financiamentos na API e renderiza a tabela.
 * @returns {Promise<void>}
 */
async function recarregarFinanciamentos() {
  try {
    const lista = await listarFinanciamentos();
    renderizarTabelaFinanciamentos(lista);
  } catch (err) {
    mostrarToast(`Erro ao carregar financiamentos: ${err.message}`, 'danger');
  }
}

/* ── Utilitário ─────────────────────────────────────────────── */

/**
 * Escapa caracteres especiais HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
