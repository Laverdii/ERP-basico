const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Main page elements ───────────────────────────────────────────
const mensagemPrincipal = document.getElementById("mensagemPrincipal");
const tabelaListaOrcamentos = document.getElementById("tabelaListaOrcamentos");
const pesquisaOrcamentosInput = document.getElementById("pesquisaOrcamentos");
const btnNovoOrcamento = document.getElementById("btnNovoOrcamento");

// ─── Modal: Atribuir Orçamento ────────────────────────────────────
const modalAtribuirOrcamento = document.getElementById("modalAtribuirOrcamento");
const btnFecharModalAtribuir = document.getElementById("btnFecharModalAtribuir");

// ─── Modal: Ver Itens ─────────────────────────────────────────────
const modalVerItens = document.getElementById("modalVerItens");
const btnFecharModalVerItens = document.getElementById("btnFecharModalVerItens");
const modalVerItensNumero = document.getElementById("modalVerItensNumero");
const tabelaVerItens = document.getElementById("tabelaVerItens");

// ─── Form elements ────────────────────────────────────────────────
const formOrcamento = document.getElementById("formOrcamento");
const tabelaOrcamentos = document.getElementById("tabelaOrcamento");
const mensagem = document.getElementById("mensagem");

const orcamentoIdInput = document.getElementById("OrcamentoId");
const clienteOrcamentoInput = document.getElementById("OrcamentoCliente");
const dataOrcamentoInput = document.getElementById("dt_orcamento");
const validadeOrcamentoInput = document.getElementById("dt_validade_orcamento");
const valorTotalOrcamentoInput = document.getElementById("vl_total_orcamento");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const btnEditarItens = document.getElementById("btnEditarItens");
const btnExcluirOrcamento = document.getElementById("btnExcluirOrcamento");

const formItemOrcamento = document.getElementById("formItemOrcamento");
const produtoItemOrcamentoInput = document.getElementById("produtoItemOrcamento");
const quantidadeItemOrcamentoInput = document.getElementById("quantidadeItemOrcamento");
const produtoOriginalItemInput = document.getElementById("produtoOriginalItem");
const btnCancelarItem = document.getElementById("btnCancelarItem");
const btnSalvarItem = document.getElementById("btnSalvarItem");
const thAcoes = document.getElementById("thAcoes");
const pesquisaItemOrcamentoInput = document.getElementById("pesquisaItemOrcamento");

const DIAS_VALIDADE_ORCAMENTO = 7;

let produtos = [];
let editandoItens = false;
let itensOrcamentoCarregados = [];
let listaOrcamentosCarregados = [];

// ─── Utilities ───────────────────────────────────────────────────

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function mostrarMensagemPrincipal(texto, tipo) {
  mensagemPrincipal.textContent = texto;
  mensagemPrincipal.className = "mensagem " + tipo;
}

function formatarDataParaInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarDataParaExibicao(dataStr) {
  if (!dataStr) return "-";
  const partes = dataStr.slice(0, 10).split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function preencherDatasAutomaticas() {
  const hoje = new Date();
  const validade = new Date(hoje);
  validade.setDate(hoje.getDate() + DIAS_VALIDADE_ORCAMENTO);
  dataOrcamentoInput.value = formatarDataParaInput(hoje);
  validadeOrcamentoInput.value = formatarDataParaInput(validade);
}

function limparTabelaItens(texto) {
  const colspan = thAcoes.parentElement ? 6 : 5;
  tabelaOrcamentos.innerHTML = `<tr><td colspan="${colspan}">${texto}</td></tr>`;
}

// ─── Main table ───────────────────────────────────────────────────

async function carregarTodosOrcamentos() {
  tabelaListaOrcamentos.innerHTML = `<tr><td colspan="6">Carregando orçamentos...</td></tr>`;

  const { data, error } = await supabaseClient
    .from("orcamento")
    .select(
      "orcamentoid, dt_orcamento, dt_validade_orcamento, vl_total_orcamento, cliente(clienteid, nome_cliente)",
    )
    .order("orcamentoid", { ascending: true });

  if (error) {
    tabelaListaOrcamentos.innerHTML = `<tr><td colspan="6">Erro ao carregar orçamentos.</td></tr>`;
    mostrarMensagemPrincipal(
      "Erro ao carregar orçamentos: " + error.message,
      "erro",
    );
    return;
  }

  listaOrcamentosCarregados = data || [];
  filtrarListaOrcamentos();
}

function renderizarListaOrcamentos(lista) {
  if (lista.length === 0) {
    tabelaListaOrcamentos.innerHTML = `<tr><td colspan="6">Nenhum orçamento encontrado.</td></tr>`;
    return;
  }

  tabelaListaOrcamentos.innerHTML = "";

  lista.forEach(function (orcamento) {
    const nomeCliente =
      orcamento.cliente ? orcamento.cliente.nome_cliente : "-";
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${orcamento.orcamentoid}</td>
      <td>${nomeCliente}</td>
      <td>${formatarDataParaExibicao(orcamento.dt_orcamento)}</td>
      <td>${formatarDataParaExibicao(orcamento.dt_validade_orcamento)}</td>
      <td>${formatarMoeda(orcamento.vl_total_orcamento)}</td>
      <td></td>
    `;

    const tdAcoes = linha.querySelector("td:last-child");
    const btnVerItens = document.createElement("button");
    btnVerItens.textContent = "Ver itens";
    btnVerItens.className = "btn-editar";
    btnVerItens.type = "button";
    btnVerItens.addEventListener("click", function () {
      abrirModalVerItens(orcamento.orcamentoid);
    });
    tdAcoes.appendChild(btnVerItens);

    tabelaListaOrcamentos.appendChild(linha);
  });
}

function filtrarListaOrcamentos() {
  const termo = pesquisaOrcamentosInput.value.toLowerCase().trim();

  if (!termo) {
    renderizarListaOrcamentos(listaOrcamentosCarregados);
    return;
  }

  const filtrados = listaOrcamentosCarregados.filter(function (orcamento) {
    const nomeCliente = orcamento.cliente
      ? orcamento.cliente.nome_cliente.toLowerCase()
      : "";
    return (
      String(orcamento.orcamentoid).includes(termo) ||
      nomeCliente.includes(termo)
    );
  });

  renderizarListaOrcamentos(filtrados);
}

// ─── Modal: Atribuir Orçamento ────────────────────────────────────

function abrirModalAtribuir() {
  formOrcamento.reset();
  limparModoEdicao();
  preencherDatasAutomaticas();
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  limparTabelaItens("Selecione um cliente para ver os itens do orçamento.");
  modalAtribuirOrcamento.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharModalAtribuir() {
  modalAtribuirOrcamento.style.display = "none";
  document.body.style.overflow = "";
  carregarTodosOrcamentos();
}

// ─── Modal: Ver Itens ─────────────────────────────────────────────

function abrirModalVerItens(orcamentoId) {
  modalVerItensNumero.textContent = `#${orcamentoId}`;
  tabelaVerItens.innerHTML = `<tr><td colspan="6">Carregando itens...</td></tr>`;
  modalVerItens.style.display = "flex";
  document.body.style.overflow = "hidden";
  carregarItensParaModal(orcamentoId);
}

function fecharModalVerItens() {
  modalVerItens.style.display = "none";
  document.body.style.overflow = "";
}

async function carregarItensParaModal(orcamentoId) {
  let { data, error } = await supabaseClient
    .from("orcamento_item")
    .select(
      "produtoid, produtodesc, obs_produto, qt_produto, vl_unitario, vl_total",
    )
    .eq("orcamentoid", orcamentoId)
    .order("produtoid", { ascending: true });

  if (error) {
    const resultado = await supabaseClient
      .from("orcamento_item")
      .select("produtoid, produtodesc, qt_produto, vl_unitario, vl_total")
      .eq("orcamentoid", orcamentoId)
      .order("produtoid", { ascending: true });

    if (resultado.error) {
      tabelaVerItens.innerHTML = `<tr><td colspan="6">Erro ao carregar itens.</td></tr>`;
      return;
    }

    data = resultado.data;
  }

  if (!data || data.length === 0) {
    tabelaVerItens.innerHTML = `<tr><td colspan="6">Nenhum item cadastrado para este orçamento.</td></tr>`;
    return;
  }

  tabelaVerItens.innerHTML = "";

  data.forEach(function (item) {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${item.produtoid}</td>
      <td>${item.produtodesc || "-"}</td>
      <td>${item.obs_produto || "-"}</td>
      <td>${item.qt_produto}</td>
      <td>${formatarMoeda(item.vl_unitario)}</td>
      <td>${formatarMoeda(item.vl_total)}</td>
    `;
    tabelaVerItens.appendChild(linha);
  });
}

// ─── Form state helpers ───────────────────────────────────────────

function atualizarEstadoBotaoAtribuir() {
  if (orcamentoIdInput.value) {
    btnSalvar.textContent = "Orçamento atribuído";
    btnSalvar.disabled = true;
    return;
  }
  btnSalvar.textContent = "Atribuir orçamento";
  btnSalvar.disabled = !clienteOrcamentoInput.value;
}

function atualizarEstadoEdicaoItens() {
  const temOrcamento = Boolean(orcamentoIdInput.value);

  btnEditarItens.style.display = temOrcamento ? "inline-block" : "none";
  btnExcluirOrcamento.style.display = temOrcamento ? "inline-block" : "none";

  if (!temOrcamento) {
    editandoItens = false;
  }

  formItemOrcamento.style.display =
    editandoItens && temOrcamento ? "grid" : "none";
  btnEditarItens.textContent = editandoItens ? "Fechar edição" : "Editar itens";

  const modoEdicaoAtivo = editandoItens && temOrcamento;
  if (modoEdicaoAtivo && !thAcoes.parentElement) {
    tabelaOrcamentos.closest("table").tHead.rows[0].appendChild(thAcoes);
  } else if (!modoEdicaoAtivo) {
    thAcoes.remove();
  }
}

function preencherFormularioComOrcamento(orcamento) {
  orcamentoIdInput.value = orcamento.orcamentoid;
  clienteOrcamentoInput.value = orcamento.clienteid;
  dataOrcamentoInput.value = orcamento.dt_orcamento
    ? orcamento.dt_orcamento.slice(0, 10)
    : "";
  validadeOrcamentoInput.value = orcamento.dt_validade_orcamento
    ? orcamento.dt_validade_orcamento.slice(0, 10)
    : "";
  valorTotalOrcamentoInput.value = orcamento.vl_total_orcamento || "";
  btnCancelarEdicao.style.display = "none";
  atualizarEstadoBotaoAtribuir();
  atualizarEstadoEdicaoItens();
}

function limparFormularioItem() {
  produtoOriginalItemInput.value = "";
  produtoItemOrcamentoInput.value = "";
  quantidadeItemOrcamentoInput.value = "";
  btnSalvarItem.textContent = "Adicionar item";
}

function limparModoEdicao() {
  orcamentoIdInput.value = "";
  valorTotalOrcamentoInput.value = "";
  btnCancelarEdicao.style.display = "none";
  limparFormularioItem();
  atualizarEstadoBotaoAtribuir();
  atualizarEstadoEdicaoItens();
}

function buscarProduto(produtoId) {
  return produtos.find(function (produto) {
    return String(produto.produtoid) === String(produtoId);
  });
}

// ─── Data loading ─────────────────────────────────────────────────

async function carregarClientesDoSelect() {
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("clienteid, nome_cliente")
    .order("nome_cliente", { ascending: true });

  if (error) {
    mostrarMensagemPrincipal(
      "Erro ao carregar clientes: " + error.message,
      "erro",
    );
    return;
  }

  clienteOrcamentoInput.innerHTML = `<option value="">Selecione</option>`;
  data.forEach(function (cliente) {
    const option = document.createElement("option");
    option.value = cliente.clienteid;
    option.textContent = cliente.nome_cliente;
    clienteOrcamentoInput.appendChild(option);
  });
}

async function carregarProdutosDoSelect() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid, ds_produto, vl_venda_produto")
    .order("ds_produto", { ascending: true });

  if (error) {
    mostrarMensagemPrincipal(
      "Erro ao carregar produtos: " + error.message,
      "erro",
    );
    return;
  }

  produtos = data;
  produtoItemOrcamentoInput.innerHTML = `<option value="">Selecione</option>`;
  produtos.forEach(function (produto) {
    const option = document.createElement("option");
    option.value = produto.produtoid;
    option.textContent = produto.ds_produto;
    produtoItemOrcamentoInput.appendChild(option);
  });
}

async function buscarOrcamentoPorCliente(clienteId) {
  const { data, error } = await supabaseClient
    .from("orcamento")
    .select(
      "orcamentoid, clienteid, dt_orcamento, dt_validade_orcamento, vl_total_orcamento",
    )
    .eq("clienteid", clienteId)
    .order("orcamentoid", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    mostrarMensagem(
      "Erro ao buscar orçamento do cliente: " + error.message,
      "erro",
    );
    return null;
  }

  return data;
}

async function buscarItemOrcamento(produtoId) {
  const { data, error } = await supabaseClient
    .from("orcamento_item")
    .select(
      "orcamentoid, produtoid, produtodesc, qt_produto, vl_unitario, vl_total",
    )
    .eq("orcamentoid", orcamentoIdInput.value)
    .eq("produtoid", produtoId)
    .maybeSingle();

  if (error) {
    mostrarMensagem(
      "Erro ao buscar item do orçamento: " + error.message,
      "erro",
    );
    return null;
  }

  return data;
}

async function buscarProximoOrcamentoIdDisponivel() {
  const { data, error } = await supabaseClient
    .from("orcamento")
    .select("orcamentoid")
    .order("orcamentoid", { ascending: true });

  if (error) {
    throw error;
  }

  let proximoId = 1;
  for (const orcamento of data) {
    if (orcamento.orcamentoid === proximoId) {
      proximoId++;
    }
    if (orcamento.orcamentoid > proximoId) {
      break;
    }
  }

  return proximoId;
}

async function gerarProximoOrcamentoItemId() {
  const { data, error } = await supabaseClient
    .from("orcamento_item")
    .select("orcamentoitemid")
    .order("orcamentoitemid", { ascending: true });

  if (error) {
    mostrarMensagem("Erro ao gerar codigo do item: " + error.message, "erro");
    return null;
  }

  let proximoId = 1;
  for (const item of data) {
    if (item.orcamentoitemid === proximoId) {
      proximoId++;
    }
    if (item.orcamentoitemid > proximoId) {
      break;
    }
  }

  return proximoId;
}

async function atualizarTotalOrcamento(total) {
  valorTotalOrcamentoInput.value = total.toFixed(2);

  if (!orcamentoIdInput.value) {
    return;
  }

  const { error } = await supabaseClient
    .from("orcamento")
    .update({ vl_total_orcamento: total })
    .eq("orcamentoid", orcamentoIdInput.value);

  if (error) {
    mostrarMensagem(
      "Erro ao atualizar total do orçamento: " + error.message,
      "erro",
    );
  }
}

// ─── Items table (inside modal) ───────────────────────────────────

function renderizarItensOrcamento(itens) {
  if (itens.length === 0) {
    limparTabelaItens("Nenhum item encontrado para este orçamento.");
    return;
  }

  tabelaOrcamentos.innerHTML = "";

  itens.forEach(function (item) {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${item.produtoid}</td>
      <td>${item.produtodesc}</td>
      <td>${item.qt_produto}</td>
      <td>${Number(item.vl_unitario || 0).toFixed(2)}</td>
      <td>${Number(item.vl_total || 0).toFixed(2)}</td>
    `;

    if (editandoItens) {
      const tdAcoes = document.createElement("td");

      const botaoEditar = document.createElement("button");
      botaoEditar.textContent = "Editar";
      botaoEditar.className = "btn-editar";
      botaoEditar.type = "button";
      botaoEditar.addEventListener("click", function () {
        prepararEdicaoItem(item);
      });

      const botaoExcluir = document.createElement("button");
      botaoExcluir.textContent = "Excluir";
      botaoExcluir.className = "btn-excluir";
      botaoExcluir.type = "button";
      botaoExcluir.addEventListener("click", function () {
        excluirItemOrcamento(item);
      });

      tdAcoes.appendChild(botaoEditar);
      tdAcoes.appendChild(botaoExcluir);
      linha.appendChild(tdAcoes);
    }

    tabelaOrcamentos.appendChild(linha);
  });
}

function filtrarItensOrcamento() {
  const termo = pesquisaItemOrcamentoInput.value.toLowerCase().trim();

  if (!termo) {
    renderizarItensOrcamento(itensOrcamentoCarregados);
    return;
  }

  const filtrados = itensOrcamentoCarregados.filter(function (item) {
    return (
      String(item.produtoid).includes(termo) ||
      item.produtodesc.toLowerCase().includes(termo)
    );
  });

  renderizarItensOrcamento(filtrados);
}

async function carregarItensOrcamento() {
  const clienteId = clienteOrcamentoInput.value;
  const orcamentoId = orcamentoIdInput.value;

  if (!clienteId) {
    itensOrcamentoCarregados = [];
    limparTabelaItens("Selecione um cliente para ver os itens do orçamento.");
    return;
  }

  if (!orcamentoId) {
    itensOrcamentoCarregados = [];
    limparTabelaItens(
      "Clique em Atribuir orçamento para criar o orçamento deste cliente.",
    );
    return;
  }

  const { data, error } = await supabaseClient
    .from("orcamento_item")
    .select(
      "orcamentoid, produtoid, produtodesc, qt_produto, vl_unitario, vl_total",
    )
    .eq("orcamentoid", orcamentoId)
    .order("produtoid", { ascending: true });

  if (error) {
    itensOrcamentoCarregados = [];
    limparTabelaItens("Erro ao carregar itens do orçamento.");
    mostrarMensagem(
      "Erro ao buscar itens do orçamento: " + error.message,
      "erro",
    );
    return;
  }

  if (data.length === 0) {
    itensOrcamentoCarregados = [];
    await atualizarTotalOrcamento(0);
    limparTabelaItens("Nenhum item cadastrado para este orçamento.");
    return;
  }

  const totalOrcamento = data.reduce(function (total, item) {
    return total + Number(item.vl_total || 0);
  }, 0);

  await atualizarTotalOrcamento(totalOrcamento);

  itensOrcamentoCarregados = data;
  filtrarItensOrcamento();
}

function prepararEdicaoItem(item) {
  produtoOriginalItemInput.value = item.produtoid;
  produtoItemOrcamentoInput.value = item.produtoid;
  quantidadeItemOrcamentoInput.value = item.qt_produto;
  btnSalvarItem.textContent = "Atualizar item";
}

async function salvarItemOrcamento(evento) {
  evento.preventDefault();

  if (!orcamentoIdInput.value) {
    mostrarMensagem(
      "Atribua um orçamento ao cliente antes de adicionar itens.",
      "erro",
    );
    return;
  }

  const produtoId = produtoItemOrcamentoInput.value;
  const quantidade = Number(quantidadeItemOrcamentoInput.value);
  const produto = buscarProduto(produtoId);

  if (!produto || quantidade <= 0) {
    mostrarMensagem(
      "Selecione um produto e informe uma quantidade valida.",
      "erro",
    );
    return;
  }

  const valorUnitario = Number(produto.vl_venda_produto || 0);
  const item = {
    orcamentoid: orcamentoIdInput.value,
    produtoid: produto.produtoid,
    produtodesc: produto.ds_produto,
    qt_produto: quantidade,
    vl_unitario: valorUnitario,
    vl_total: quantidade * valorUnitario,
  };

  const produtoOriginalId = produtoOriginalItemInput.value;

  if (produtoOriginalId && String(produtoOriginalId) !== String(produtoId)) {
    await supabaseClient
      .from("orcamento_item")
      .delete()
      .eq("orcamentoid", orcamentoIdInput.value)
      .eq("produtoid", produtoOriginalId);
  }

  const itemExistente = await buscarItemOrcamento(produtoId);
  let resultado;

  if (itemExistente) {
    resultado = await supabaseClient
      .from("orcamento_item")
      .update({
        produtodesc: item.produtodesc,
        qt_produto: item.qt_produto,
        vl_unitario: item.vl_unitario,
        vl_total: item.vl_total,
      })
      .eq("orcamentoid", item.orcamentoid)
      .eq("produtoid", item.produtoid);
  } else {
    const proximoOrcamentoItemId = await gerarProximoOrcamentoItemId();
    if (!proximoOrcamentoItemId) {
      return;
    }
    resultado = await supabaseClient.from("orcamento_item").insert({
      orcamentoitemid: proximoOrcamentoItemId,
      ...item,
    });
  }

  if (resultado.error) {
    mostrarMensagem(
      "Erro ao salvar item do orçamento: " + resultado.error.message,
      "erro",
    );
    return;
  }

  limparFormularioItem();
  mostrarMensagem("Item salvo com sucesso!", "sucesso");
  carregarItensOrcamento();
}

async function excluirItemOrcamento(item) {
  const confirmou = confirm(
    "Tem certeza que deseja remover este item do orçamento?",
  );
  if (!confirmou) {
    return;
  }

  const { error } = await supabaseClient
    .from("orcamento_item")
    .delete()
    .eq("orcamentoid", item.orcamentoid)
    .eq("produtoid", item.produtoid);

  if (error) {
    mostrarMensagem(
      "Erro ao excluir item do orçamento: " + error.message,
      "erro",
    );
    return;
  }

  limparFormularioItem();
  mostrarMensagem("Item removido com sucesso!", "sucesso");
  carregarItensOrcamento();
}

async function excluirOrcamento() {
  const orcamentoId = orcamentoIdInput.value;
  const clienteSelecionado = clienteOrcamentoInput.value;

  if (!orcamentoId) {
    mostrarMensagem(
      "Selecione um cliente com orçamento para excluir.",
      "erro",
    );
    return;
  }

  const confirmou = confirm(
    "Tem certeza que deseja excluir este orçamento e todos os seus itens?",
  );
  if (!confirmou) {
    return;
  }

  btnExcluirOrcamento.disabled = true;
  btnEditarItens.disabled = true;

  const exclusaoItens = await supabaseClient
    .from("orcamento_item")
    .delete()
    .eq("orcamentoid", orcamentoId);

  if (exclusaoItens.error) {
    btnExcluirOrcamento.disabled = false;
    btnEditarItens.disabled = false;
    mostrarMensagem(
      "Erro ao excluir itens do orçamento: " + exclusaoItens.error.message,
      "erro",
    );
    return;
  }

  const exclusaoOrcamento = await supabaseClient
    .from("orcamento")
    .delete()
    .eq("orcamentoid", orcamentoId)
    .eq("clienteid", clienteSelecionado);

  btnExcluirOrcamento.disabled = false;
  btnEditarItens.disabled = false;

  if (exclusaoOrcamento.error) {
    mostrarMensagem(
      "Erro ao excluir orçamento: " + exclusaoOrcamento.error.message,
      "erro",
    );
    return;
  }

  limparModoEdicao();
  preencherDatasAutomaticas();
  clienteOrcamentoInput.value = clienteSelecionado;
  limparTabelaItens(
    "Clique em Atribuir orçamento para criar o orçamento deste cliente.",
  );
  mostrarMensagem("Orçamento excluido com sucesso!", "sucesso");
}

async function atribuirOrcamentoAoCliente() {
  const clienteId = clienteOrcamentoInput.value;

  if (!clienteId) {
    mostrarMensagem(
      "Selecione um cliente para atribuir o orçamento.",
      "erro",
    );
    return;
  }

  const orcamentoExistente = await buscarOrcamentoPorCliente(clienteId);

  if (orcamentoExistente) {
    preencherFormularioComOrcamento(orcamentoExistente);
    mostrarMensagem(
      "Este cliente ja possui um orçamento atríbuido.",
      "sucesso",
    );
    carregarItensOrcamento();
    return;
  }

  let proximoOrcamentoId;
  try {
    proximoOrcamentoId = await buscarProximoOrcamentoIdDisponivel();
  } catch (error) {
    mostrarMensagem(
      "Erro ao calcular o próximo código: " + error.message,
      "erro",
    );
    return;
  }

  const novoOrcamento = {
    orcamentoid: proximoOrcamentoId,
    clienteid: clienteId,
    dt_orcamento: dataOrcamentoInput.value,
    dt_validade_orcamento: validadeOrcamentoInput.value,
    vl_total_orcamento: valorTotalOrcamentoInput.value || 0,
  };

  const { data, error } = await supabaseClient
    .from("orcamento")
    .insert(novoOrcamento)
    .select(
      "orcamentoid, clienteid, dt_orcamento, dt_validade_orcamento, vl_total_orcamento",
    )
    .single();

  if (error) {
    mostrarMensagem("Erro ao atribuir orçamento: " + error.message, "erro");
    return;
  }

  preencherFormularioComOrcamento(data);
  mostrarMensagem("Orçamento atribuído ao cliente com sucesso!", "sucesso");
  carregarItensOrcamento();
}

async function selecionarCliente() {
  const clienteId = clienteOrcamentoInput.value;
  pesquisaItemOrcamentoInput.value = "";
  limparModoEdicao();
  preencherDatasAutomaticas();

  if (!clienteId) {
    carregarItensOrcamento();
    return;
  }

  const orcamento = await buscarOrcamentoPorCliente(clienteId);

  if (orcamento) {
    preencherFormularioComOrcamento(orcamento);
  } else {
    atualizarEstadoBotaoAtribuir();
    atualizarEstadoEdicaoItens();
  }

  carregarItensOrcamento();
}

function cancelarEdicao() {
  const clienteSelecionado = clienteOrcamentoInput.value;
  formOrcamento.reset();
  limparModoEdicao();
  preencherDatasAutomaticas();
  clienteOrcamentoInput.value = clienteSelecionado;
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  selecionarCliente();
}

function alternarEdicaoItens() {
  editandoItens = !editandoItens;
  limparFormularioItem();
  atualizarEstadoEdicaoItens();
  carregarItensOrcamento();
}

// ─── Event listeners ──────────────────────────────────────────────

btnNovoOrcamento.addEventListener("click", abrirModalAtribuir);
btnFecharModalAtribuir.addEventListener("click", fecharModalAtribuir);
btnFecharModalVerItens.addEventListener("click", fecharModalVerItens);

modalAtribuirOrcamento.addEventListener("click", function (e) {
  if (e.target === modalAtribuirOrcamento) {
    fecharModalAtribuir();
  }
});

modalVerItens.addEventListener("click", function (e) {
  if (e.target === modalVerItens) {
    fecharModalVerItens();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (modalVerItens.style.display !== "none") {
      fecharModalVerItens();
    } else if (modalAtribuirOrcamento.style.display !== "none") {
      fecharModalAtribuir();
    }
  }
});

pesquisaOrcamentosInput.addEventListener("input", filtrarListaOrcamentos);
pesquisaItemOrcamentoInput.addEventListener("input", filtrarItensOrcamento);

formOrcamento.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  await atribuirOrcamentoAoCliente();
});

formOrcamento.addEventListener("reset", function () {
  setTimeout(function () {
    limparModoEdicao();
    preencherDatasAutomaticas();
    carregarItensOrcamento();
  });
});

formItemOrcamento.addEventListener("submit", salvarItemOrcamento);
btnCancelarItem.addEventListener("click", limparFormularioItem);
btnCancelarEdicao.addEventListener("click", cancelarEdicao);
btnEditarItens.addEventListener("click", alternarEdicaoItens);
btnExcluirOrcamento.addEventListener("click", excluirOrcamento);
clienteOrcamentoInput.addEventListener("change", selecionarCliente);

// ─── Init ─────────────────────────────────────────────────────────

carregarClientesDoSelect();
carregarProdutosDoSelect();
carregarTodosOrcamentos();
