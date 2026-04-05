/**
 * api.js
 * Camada de comunicação com a API REST do back-end.
 * Todas as chamadas fetch estão centralizadas aqui.
 * Nenhum outro módulo deve usar fetch diretamente.
 */

const API_BASE = 'http://127.0.0.1:5000';

/**
 * Executa um fetch genérico e retorna o JSON da resposta.
 * Lança um Error com a mensagem do back-end em caso de falha HTTP.
 * @param {string} endpoint - Caminho relativo (ex: '/financiamento/')
 * @param {RequestInit} [opcoes={}] - Opções do fetch (method, body, etc.)
 * @returns {Promise<any>} Dados JSON da resposta
 */
async function apiFetch(endpoint, opcoes = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  };

  const resposta = await fetch(url, config);

  // Tenta extrair o corpo como JSON para mensagens de erro descritivas
  let corpo = null;
  const contentType = resposta.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    corpo = await resposta.json();
  }

  if (!resposta.ok) {
    const mensagem =
      (corpo && (corpo.erro || corpo.message || corpo.msg)) ||
      `Erro ${resposta.status}: ${resposta.statusText}`;
    throw new Error(mensagem);
  }

  return corpo;
}

/* ─────────────────────────────────────────────────────────────
   FINANCIAMENTOS
   ───────────────────────────────────────────────────────────── */

/**
 * Cria um novo financiamento via POST /financiamento/
 * @param {{
 *   nome: string,
 *   valor_imovel: number,
 *   entrada: number,
 *   taxa_juros: number,
 *   prazo_meses: number,
 *   data_inicio: string,
 *   modelo: string
 * }} dados
 * @returns {Promise<Object>} Financiamento criado
 */
function criarFinanciamento(dados) {
  return apiFetch('/financiamento/', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

/**
 * Lista todos os financiamentos via GET /financiamento/
 * @returns {Promise<Array>} Array de financiamentos
 */
function listarFinanciamentos() {
  return apiFetch('/financiamento/');
}

/**
 * Busca um financiamento por ID via GET /financiamento/<id>
 * @param {number} id
 * @returns {Promise<Object>} Dados do financiamento
 */
function buscarFinanciamento(id) {
  return apiFetch(`/financiamento/${id}`);
}

/**
 * Deleta um financiamento via DELETE /financiamento/<id>
 * Remove em cascata todas as parcelas e amortizações.
 * @param {number} id
 * @returns {Promise<Object>}
 */
function deletarFinanciamento(id) {
  return apiFetch(`/financiamento/${id}`, { method: 'DELETE' });
}

/* ─────────────────────────────────────────────────────────────
   PARCELAS
   ───────────────────────────────────────────────────────────── */

/**
 * Lista as parcelas de um financiamento via GET /financiamento/<id>/parcelas
 * @param {number} finId
 * @returns {Promise<Array>} Array de parcelas com numero_parcela, data_parcela, valor_parcela
 */
function listarParcelas(finId) {
  return apiFetch(`/financiamento/${finId}/parcelas`);
}

/* ─────────────────────────────────────────────────────────────
   AMORTIZAÇÕES
   ───────────────────────────────────────────────────────────── */

/**
 * Cria uma amortização extra via POST /financiamento/<id>/amortizacoes
 * O back-end recalcula e persiste as parcelas automaticamente.
 * @param {number} finId
 * @param {{
 *   valor_amortizado: number,
 *   data_amortizacao: string,
 *   tipo: 'PARCELA' | 'PRAZO'
 * }} dados
 * @returns {Promise<Object>}
 */
function criarAmortizacao(finId, dados) {
  return apiFetch(`/financiamento/${finId}/amortizacoes`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

/**
 * Lista as amortizações de um financiamento via GET /financiamento/<id>/amortizacoes
 * @param {number} finId
 * @returns {Promise<Array>}
 */
function listarAmortizacoes(finId) {
  return apiFetch(`/financiamento/${finId}/amortizacoes`);
}

/**
 * Deleta uma amortização via DELETE /financiamento/<finId>/amortizacoes/<amorId>
 * O back-end reconstrói o cronograma de parcelas sem a amortização removida.
 * @param {number} finId
 * @param {number} amorId
 * @returns {Promise<Object>}
 */
function deletarAmortizacao(finId, amorId) {
  return apiFetch(`/financiamento/${finId}/amortizacoes/${amorId}`, {
    method: 'DELETE',
  });
}
