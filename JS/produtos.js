const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

/*
  Cria o Produto de conexão com o Supabase.

  A variável "supabase" vem da biblioteca que carregamos no HTML:
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
*/
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/*
  ============================================
  PEGANDO ELEMENTOS DO HTML
  ============================================

  Usamos document.getElementById para acessar elementos da tela.
  Assim conseguimos ler valores, alterar textos e criar ações.
*/

const formProduto = document.getElementById("formProduto");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagem = document.getElementById("mensagem");

const ProdutoIdInput = document.getElementById("ProdutoId");
const categoriaProdutoInput = document.getElementById("categoriaProduto");
const descProduto = document.getElementById("descProduto");
const obsProduto = document.getElementById("")
const valorProdutoInput = document.getElementById("valorProduto");
const dataCadastroInput = document.getElementById("dataCadastro")

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

/*
  ============================================
  FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
  ============================================

  Essa função recebe:
  - texto: mensagem que será exibida.
  - tipo: classe CSS aplicada na mensagem.

  Exemplo:
  mostrarMensagem("Produto salvo com sucesso!", "sucesso");
  mostrarMensagem("Erro ao salvar Produto.", "erro");
*/

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

/*
  ============================================
  FUNÇÃO PARA FORMATAR O TIPO DO Produto
  ============================================

  No banco, o tipo é salvo como:
  F = Pessoa Física
  J = Pessoa Jurídica

  Essa função transforma o valor salvo no banco em um texto amigável.
*/

/*
  ============================================
  CARREGAR ProdutoS
  ============================================

  Essa função busca os Produtos no Supabase e monta as linhas da tabela.

  Observação importante:
  A tabela foi criada assim:

  CREATE TABLE Produto (...)

  Como não foram usadas aspas no nome da tabela,
  no PostgreSQL o nome normalmente fica em minúsculo: Produto.

  Por isso usamos:
  .from("Produto")
*/

async function carregarProdutos() {
  /*
    Faz um SELECT na tabela Produto.

    Estamos buscando as colunas:
    - Produtoid
    - tipo_Produto
    - cpf_cnpj_Produto
    - nome_Produto

    E ordenando pelo Produtoid em ordem crescente.
  */
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid, ds_produto, obs_produto, vl_venda_produto, dt_cadastro_produto, status_produto")
    .order("produtoid", { ascending: true });

  /*
    Se der erro na consulta, mostramos uma mensagem na tabela
    e também uma mensagem de erro acima da listagem.
  */
  if (error) {
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="8">Erro ao carregar Produtos.</td>
      </tr>
    `;

    mostrarMensagem("Erro ao buscar Produtos: " + error.message, "erro");
    return;
  }

  /*
    Se a consulta funcionar, mas não houver nenhum Produto,
    mostramos uma mensagem dizendo que não há registros.
  */
  if (data.length === 0) {
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="8">Nenhum Produto cadastrado.</td>
      </tr>
    `;
    return;
  }

  /*
    Limpamos o corpo da tabela antes de preencher.
    Isso evita duplicar linhas quando recarregamos os Produtos.
  */
  tabelaProdutos.innerHTML = "";

  /*
    Percorremos a lista de Produtos retornada pelo Supabase.

    Para cada Produto, criamos uma linha <tr>.
  */
  data.forEach(function(Produto) {
    const linha = document.createElement("tr");

    /*
      Criamos as colunas principais da linha.

      A última coluna recebe a classe "coluna-acoes".
      Nessa coluna colocaremos os botões Editar e Excluir.
    */
    linha.innerHTML = `
      <td>${Produto.produtoid}</td>
      <td>${Produto.ds_produto}</td>
      <td>${Produto.obs_produto}</td>
      <td>${Produto.vl_venda_produto}</td>
      <td>${Produto.dt_cadastro_produto}</td>
      <td>${Produto.status_produto}</td>
      <td class="coluna-acoes"></td>
    `;

    /*
      ============================================
      BOTÃO EDITAR
      ============================================
    */

    const botaoEditar = document.createElement("button");

    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";

    /*
      Quando clicar no botão Editar,
      chamamos a função prepararEdicao
      passando o Produto da linha atual.
    */
    botaoEditar.addEventListener("click", function() {
      prepararEdicao(Produto);
    });

    /*
      ============================================
      BOTÃO EXCLUIR
      ============================================
    */

    const botaoExcluir = document.createElement("button");

    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";

    /*
      Quando clicar no botão Excluir,
      chamamos a função excluirProduto
      passando o Produto da linha atual.
    */
    botaoExcluir.addEventListener("click", function() {
      excluirProduto(Produto);
    });

    /*
      Adicionamos os botões dentro da coluna Ações.
    */
    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    /*
      Adicionamos a linha pronta dentro do tbody da tabela.
    */
    tabelaProdutos.appendChild(linha);
  });
}

/*
  ============================================
  PREPARAR EDIÇÃO
  ============================================

  Essa função é chamada quando o usuário clica no botão Editar.

  Ela pega os dados do Produto selecionado e joga para dentro do formulário.
*/

function prepararEdicao(Produto) {
  /*
    Preenche o campo código.
    Esse campo é importante porque usaremos o ID para saber qual Produto atualizar.
  */
  ProdutoIdInput.value = Produto.produtoid;

  /*
    Preenche os demais campos com os dados do Produto.
  */
  descProduto.value = Produto.ds_produto;
  ob.value = Produto.obs_produto;
  dataCadastroInput.value = Produto.nome_Produto;

  /*
    Neste exemplo, vamos permitir editar apenas o nome.

    Por isso:
    - bloqueamos o tipo;
    - bloqueamos o CPF/CNPJ.
  */
  tipoProdutoInput.disabled = false;
  cpfCnpjProdutoInput.readOnly = false;

  /*
    Mudamos o texto do botão principal para "Atualizar".
  */
  btnSalvar.textContent = "Atualizar";

  /*
    Mostramos o botão Cancelar edição.
  */
  btnCancelarEdicao.style.display = "inline-block";

  /*
    Mostramos uma mensagem informando que o usuário está editando.
  */
  mostrarMensagem("Editando o Produto: " + Produto.nome_Produto, "sucesso");
}

/*
  ============================================
  CANCELAR EDIÇÃO
  ============================================

  Essa função limpa o formulário e volta para o modo de cadastro.
*/

function cancelarEdicao() {
  /*
    Limpa os campos do formulário.
  */
  formProduto.reset();

  /*
    Garante que o ID fique vazio.
    Se o ID estiver vazio, o sistema entende que é um novo cadastro.
  */
  ProdutoIdInput.value = "";

  /*
    Libera os campos que estavam bloqueados durante a edição.
  */
  tipoProdutoInput.disabled = false;
  cpfCnpjProdutoInput.readOnly = false;

  /*
    Volta o botão principal para "Salvar".
  */
  btnSalvar.textContent = "Salvar";

  /*
    Esconde novamente o botão Cancelar edição.
  */
  btnCancelarEdicao.style.display = "none";

  /*
    Limpa a área de mensagem.
  */
  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

/*
  ============================================
  SALVAR Produto
  ============================================

  Essa função cadastra um novo Produto no Supabase.

  Ela será chamada quando o campo ProdutoId estiver vazio.
*/

async function salvarProduto() {
  /*
    Pegamos os valores digitados no formulário.
  */
  const tipoProduto = tipoProdutoInput.value;
  const cpfCnpjProduto = cpfCnpjProdutoInput.value;
  const nomeProduto = nomeProdutoInput.value;

  /*
    Montamos o objeto que será enviado para o Supabase.

    As propriedades precisam ter o mesmo nome das colunas da tabela.
  */
  const novoProduto = {
    tipo_Produto: tipoProduto,
    cpf_cnpj_Produto: cpfCnpjProduto,
    nome_Produto: nomeProduto
  };

  /*
    Insere o novo Produto na tabela Produto.
  */
  const { error } = await supabaseClient
    .from("Produto")
    .insert(novoProduto);

  /*
    Se houver erro, mostramos a mensagem e paramos a função.
  */
  if (error) {
    mostrarMensagem("Erro ao salvar Produto: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Produto salvo com sucesso!", "sucesso");

  /*
    Limpamos o formulário.
  */
  formProduto.reset();

  /*
    Recarregamos a listagem para mostrar o novo Produto na tabela.
  */
  carregarProdutos();
}

/*
  ============================================
  ATUALIZAR NOME DO Produto
  ============================================

  Essa função atualiza apenas o nome do Produto.

  Ela será chamada quando o campo ProdutoId estiver preenchido.
*/

async function atualizarNomeProduto() {
  /*
    Pegamos o ID do Produto que está sendo editado.
  */
  const ProdutoId = ProdutoIdInput.value;

  /*
    Pegamos o novo nome digitado.
  */
  const nomeProduto = nomeProdutoInput.value;

  /*
    Atualizamos somente a coluna nome_Produto.

    O filtro .eq("Produtoid", ProdutoId) é essencial.
    Ele informa qual registro será atualizado.
  */
  const { error } = await supabaseClient
    .from("Produto")
    .update({
      nome_Produto: nomeProduto
    })
    .eq("Produtoid", ProdutoId);

  /*
    Se houver erro, mostramos a mensagem e paramos.
  */
  if (error) {
    mostrarMensagem("Erro ao atualizar Produto: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Nome atualizado com sucesso!", "sucesso");

  /*
    Saímos do modo edição.
  */
  cancelarEdicao();

  /*
    Recarregamos a tabela para mostrar o nome atualizado.
  */
  carregarProdutos();
}

/*
  ============================================
  EXCLUIR Produto
  ============================================

  Essa função exclui um Produto do Supabase.

  Ela recebe o objeto Produto inteiro para poder usar:
  - Produto.Produtoid
  - Produto.nome_Produto
*/

async function excluirProduto(Produto) {
  /*
    Antes de excluir, pedimos confirmação.

    O confirm retorna:
    - true se o usuário clicar em OK;
    - false se o usuário clicar em Cancelar.
  */
  const confirmou = confirm(
    "Tem certeza que deseja excluir o Produto " + Produto.nome_Produto + "?"
  );

  /*
    Se o usuário cancelar, paramos a função.
  */
  if (!confirmou) {
    return;
  }

  /*
    Executa o DELETE na tabela Produto.

    O filtro .eq("Produtoid", Produto.Produtoid) garante que apenas
    o Produto selecionado será excluído.
  */
  const { error } = await supabaseClient
    .from("Produto")
    .delete()
    .eq("Produtoid", Produto.Produtoid);

  /*
    Se houver erro, mostramos uma mensagem.
  */
  if (error) {
    mostrarMensagem("Erro ao excluir Produto: " + error.message, "erro");
    return;
  }

  /*
    Se o Produto excluído era o mesmo que estava sendo editado,
    cancelamos a edição para limpar o formulário.
  */
  if (ProdutoIdInput.value == Produto.Produtoid) {
    cancelarEdicao();
  }

  /*
    Mostra mensagem de sucesso.
  */
  mostrarMensagem("Produto excluído com sucesso!", "sucesso");

  /*
    Recarrega a tabela para remover visualmente o Produto excluído.
  */
  carregarProdutos();
}

/*
  ============================================
  EVENTO DE ENVIO DO FORMULÁRIO
  ============================================

  Este evento acontece quando o usuário clica em Salvar ou Atualizar.
*/

formProduto.addEventListener("submit", async function(evento) {
  /*
    Impede a página de recarregar ao enviar o formulário.
  */
  evento.preventDefault();

  /*
    Verificamos se o campo ProdutoId está preenchido.

    Se estiver vazio:
    - é um cadastro novo.

    Se estiver preenchido:
    - é uma edição.
  */
  const estaEditando = ProdutoIdInput.value !== "";

  if (estaEditando) {
    await atualizarNomeProduto();
  } else {
    await salvarProduto();
  }
});

/*
  ============================================
  EVENTO DO BOTÃO CANCELAR EDIÇÃO
  ============================================

  Quando o usuário clicar em "Cancelar edição",
  chamamos a função cancelarEdicao.
*/

btnCancelarEdicao.addEventListener("click", function() {
  cancelarEdicao();
});

/*
  ============================================
  CARREGAMENTO INICIAL DA PÁGINA
  ============================================

  Assim que o arquivo JavaScript é carregado,
  buscamos os Produtos no Supabase.
*/

carregarProdutos();