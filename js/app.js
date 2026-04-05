/**
 * app.js
 * Ponto de entrada da aplicação.
 * Inicializa os módulos, registra os event listeners globais
 * e executa a carga inicial de dados ao abrir a página.
 */

/* ── Toast global ───────────────────────────────────────────── */

/**
 * Exibe um toast de feedback na parte inferior direita da tela.
 * @param {string} mensagem - Texto a exibir
 * @param {'success'|'danger'|'warning'|'info'} [tipo='success']
 */
function mostrarToast(mensagem, tipo = 'success') {
  const toastEl  = document.getElementById('app-toast');
  const msgEl    = document.getElementById('toast-mensagem');

  if (!toastEl || !msgEl) return;

  // Remove classes de cor anteriores
  toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-dark');
  toastEl.classList.add(`bg-${tipo}`);

  if (tipo === 'warning') toastEl.classList.add('text-dark');
  else toastEl.classList.remove('text-dark');

  msgEl.textContent = mensagem;

  const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
  bsToast.show();
}

/* ── Inicialização ──────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  // Garante que tabelas comecem ocultas (estados iniciais)
  const tabelaFin  = document.getElementById('tabela-financiamentos');
  const tabelaAmor = document.getElementById('tabela-amortizacoes');
  if (tabelaFin)  tabelaFin.style.display  = 'none';
  if (tabelaAmor) tabelaAmor.style.display = 'none';

  // Registra handlers dos formulários
  registrarFormFinanciamento();
  registrarFormAmortizacao();

  // Carrega a lista inicial de financiamentos
  await recarregarFinanciamentos();
});
