# Simulador de Financiamento Imobiliário — Front-end

Interface web para simulação do impacto de amortizações extraordinárias no cronograma de parcelas de um financiamento imobiliário pelo sistema SAC ou PRICE.

## Problema resolvido

Ao realizar um pagamento antecipado em um financiamento, o mutuário pode optar por reduzir o valor das parcelas ou o prazo total. Esta interface permite cadastrar financiamentos, visualizar graficamente todas as parcelas e simular em tempo real o efeito de uma ou mais amortizações extras — atualizando o gráfico, o total a pagar e o número de parcelas restantes.

## Tecnologias

- HTML5, CSS3, JavaScript (ES2021+)
- [Bootstrap 5.3](https://getbootstrap.com/) — grid e componentes visuais
- [Bootstrap Icons 1.11](https://icons.getbootstrap.com/) — ícones
- [Chart.js 4.4](https://www.chartjs.org/) — gráfico de parcelas
- API REST Flask (back-end separado em `basic-full-stack-mvp-back-end`)

## Estrutura do projeto

```
basic-full-stack-mvp-front-end/
├── index.html          # SPA — única página da aplicação
├── css/
│   └── style.css       # Estilos customizados
└── js/
    ├── api.js          # Todas as chamadas fetch à API
    ├── grafico.js      # Renderização do Chart.js
    ├── financiamentos.js  # Lógica de financiamentos
    ├── amortizacoes.js    # Lógica de amortizações e resumo
    └── app.js          # Inicialização e orquestração
```

## Pré-requisitos

1. **Back-end em execução** — o servidor Flask deve estar rodando em `http://127.0.0.1:5000`.  
   Consulte as instruções de instalação do repositório `basic-full-stack-mvp-back-end`.

## Instalação

### 1. Clone o repositório

Abra um terminal e navegue até a pasta onde deseja salvar o projeto (por exemplo, `Documentos`):

```bash
cd Documentos
```

Em seguida, execute:

```bash
git clone https://github.com/<seu-usuario>/basic-full-stack-mvp-front-end.git
```

### 2. Acesse a pasta do projeto

```bash
cd basic-full-stack-mvp-front-end
```

Não é necessário instalar dependências — todas as bibliotecas são carregadas via CDN.

## Execução

1. Certifique-se de que o back-end está rodando em `http://127.0.0.1:5000` (veja os pré-requisitos acima).
2. Abra o arquivo `index.html` diretamente no Chrome (ou qualquer navegador moderno).

```
Abrir com Chrome: Arquivo > Abrir arquivo... > index.html
```

## Funcionalidades

| Funcionalidade | Rota da API usada |
|---|---|
| Cadastrar financiamento | `POST /financiamento/` |
| Listar financiamentos ao abrir a página | `GET /financiamento/` |
| Exibir detalhes ao selecionar | `GET /financiamento/<id>` |
| Visualizar gráfico de parcelas | `GET /financiamento/<id>/parcelas` |
| Adicionar amortização | `POST /financiamento/<id>/amortizacoes` |
| Listar amortizações cadastradas | `GET /financiamento/<id>/amortizacoes` |
| Deletar amortização | `DELETE /financiamento/<id>/amortizacoes/<id>` |
| Deletar financiamento | `DELETE /financiamento/<id>` |

## Observações

- O gráfico é colorido por período: **cinza** = parcelas passadas, **âmbar** = parcela do mês atual, **azul** = parcelas futuras.
- O **total a pagar** e as **parcelas restantes** são calculados a partir do mês atual com base nas parcelas retornadas pelo back-end.
- A deleção de um financiamento remove em cascata todas as parcelas e amortizações (comportamento implementado no back-end).
