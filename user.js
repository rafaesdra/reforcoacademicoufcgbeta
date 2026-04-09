// user.js - Gerenciamento de usuários, login e progresso
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
let usuarioAtivo = null;
let metaDiaria = 5;

function normalizarUsuario(usuario = {}){
  let respondidas = usuario.questoesRespondidas;
  if (!Array.isArray(respondidas)) {
    respondidas = respondidas && typeof respondidas === 'object' ? Object.values(respondidas) : [];
  }
  
  // Garantir que id, xp e outros campos críticos sejam preservados
  const normalizado = {
    id: usuario.id, // Preservar ID primeiro
    xp: usuario.xp !== undefined ? usuario.xp : 0,
    streak: usuario.streak !== undefined ? usuario.streak : 0,
    ultimaData: usuario.ultimaData || null,
    progresso: usuario.progresso || {},
    acertos: usuario.acertos !== undefined ? usuario.acertos : 0,
    erros: usuario.erros !== undefined ? usuario.erros : 0,
    questoesRespondidas: respondidas,
    metaDiaria: usuario.metaDiaria || 5,
    nome: usuario.nome || 'Usuário',
    email: usuario.email || '',
    ...usuario // Spread para pegar qualquer campo adicional
  };
  
  return normalizado;
}

// === USUÁRIOS / LOGIN ===
async function carregarUsuarios(){
  // Not needed for Firestore
}

async function criarUsuario(){
  try {
    let displayName = document.getElementById("displayName").value.trim();
    let email = document.getElementById("userEmail").value.trim();
    let senha = document.getElementById("password").value.trim();
    let confirmSenha = document.getElementById("confirmPassword").value.trim();
    
    if(!displayName || !email || !senha || !confirmSenha){ 
      document.getElementById("loginMsg").innerText="Preencha nome, email, senha e confirmação de senha."; 
      return; 
    }
    if(senha !== confirmSenha) {
      document.getElementById("loginMsg").innerText="As senhas não coincidem.";
      return;
    }

    if(displayName.length < 3){
      document.getElementById("loginMsg").innerText="Nome de usuário deve ter pelo menos 3 caracteres.";
      return;
    }

    if(!window.auth) { document.getElementById("loginMsg").innerText="Erro: Firebase Auth não inicializado."; return; }

    // Verificar se nome de usuário já existe (verificação extra)
    const usernameRef = doc(window.db, 'usernames', displayName);
    const usernameSnap = await getDoc(usernameRef);
    if(usernameSnap.exists()){
      document.getElementById("loginMsg").innerText="Este nome de usuário já está em uso.";
      return;
    }

    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(window.auth, email, senha);
    const user = userCredential.user;

    // Salvar mapeamento nome de usuário -> email
    await setDoc(usernameRef, { email: email, uid: user.uid });

    // Criar documento no Firestore com dados adicionais
    const userData = {
      email: email,
      nome: displayName,
      xp: 0,
      streak: 0,
      ultimaData: null,
      progresso: {},
      id: user.uid // Salva o ID no documento também para consistência
    };
    await setDoc(doc(window.db, 'usuarios', user.uid), userData);

    document.getElementById("loginMsg").innerText="Usuário criado! Agora faça login.";
    // Voltar para tela de login após criar conta
    mostrarLogin();
  } catch(error) {
    console.error("Erro ao criar usuário:", error);
    let msg = "Erro ao criar usuário.";
    if(error.code === 'auth/email-already-in-use') {
      msg = "Este email já está cadastrado.";
    } else if(error.code === 'auth/weak-password') {
      msg = "A senha deve ter pelo menos 6 caracteres.";
    } else if(error.code === 'auth/invalid-email') {
      msg = "Email inválido.";
    }
    document.getElementById("loginMsg").innerText = msg;
  }
}

async function loginUsuario(){
  try {
    let username = document.getElementById("username").value.trim();
    let senha = document.getElementById("password").value.trim();

    if(!username || !senha) {
      document.getElementById("loginMsg").innerText="Preencha nome de usuário e senha.";
      return;
    }

    if(!window.auth) { document.getElementById("loginMsg").innerText="Erro: Firebase Auth não inicializado."; return; }

    // Buscar email pelo nome de usuário
    const usernameRef = doc(window.db, 'usernames', username);
    const usernameSnap = await getDoc(usernameRef);

    if(!usernameSnap.exists()){
      document.getElementById("loginMsg").innerText="Nome de usuário não encontrado.";
      return;
    }

    const email = usernameSnap.data().email;

    // Fazer login com Firebase Auth usando o email encontrado
    const userCredential = await signInWithEmailAndPassword(window.auth, email, senha);
    const user = userCredential.user;

    // Carregar dados do usuário do Firestore
    const userRef = doc(window.db, 'usuarios', user.uid);
    const userSnap = await getDoc(userRef);

    if(!userSnap.exists()){
      document.getElementById("loginMsg").innerText="Dados do usuário não encontrados. Tente criar uma nova conta.";
      return;
    }

    definirUsuarioAtivo({id: user.uid, ...userSnap.data()});
    // mostrarDashboard() será chamado pelo onAuthStateChanged no main.js
  } catch(error) {
    console.error("Erro ao fazer login:", error);
    let msg = "Erro ao fazer login.";
    if(error.code === 'auth/user-not-found') {
      msg = "Usuário não encontrado.";
    } else if(error.code === 'auth/wrong-password') {
      msg = "Senha incorreta.";
    } else if(error.code === 'auth/invalid-email') {
      msg = "Email inválido.";
    }
    document.getElementById("loginMsg").innerText = msg;
  }
}

async function logout(){
  try {
    if(window.auth) {
      await signOut(window.auth);
    }
  } catch(e) {
    console.error("Erro ao fazer logout:", e);
  }

  // Parar sincronização antes do logout
  pararSincronizacaoRanking();

  // Limpar listener do Firebase
  if(window.limparAuthListener) {
    window.limparAuthListener();
  }

  usuarioAtivo = null;
  localStorage.removeItem("usuarioAtivo");

  // Resetar interface para tela de login sem recarregar a página
  document.getElementById("loginCard").style.display = "block";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("assuntosCard").style.display = "none";
  document.getElementById("conteudoCard").style.display = "none";
  document.getElementById("exercicioCard").style.display = "none";

  // Limpar campos de login
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("loginMsg").innerText = "";
}

// === DASHBOARD ===
async function mostrarDashboard(){
  if (!usuarioAtivo) {
    console.error("Tentando mostrar dashboard sem usuário ativo");
    return;
  }

  document.getElementById("loginCard").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("usuarioAtivo").innerText = usuarioAtivo.nome;
  atualizarXPStreak();
  atualizarMeta(); // Atualizar meta diária do usuário
  await atualizarRanking(); // Ranking completo no login

  // Iniciar sincronização automática da posição
  iniciarSincronizacaoRanking();

  // Gerar calendário quando o dashboard é mostrado
  gerarCalendario();

  // Carregar disciplinas quando o dashboard é mostrado
  if(window.carregarDisciplinas){
    window.carregarDisciplinas();
  }
}

// Atualiza XP e streak
function atualizarXPStreak(){
  document.getElementById("xpUsuario").innerText = usuarioAtivo.xp;
  document.getElementById("streakUsuario").innerText = usuarioAtivo.streak;
}

// Atualiza ranking histórico
async function atualizarRanking(){
  try {
    if(!window.db || !usuarioAtivo) return;

    const q = query(collection(window.db, 'usuarios'), orderBy('xp', 'desc'));
    const querySnapshot = await getDocs(q);

    let ol = document.getElementById("rankingHistorico");
    if (!ol) return;

    ol.innerHTML = "";

    let usuarios = [];
    let posicaoUsuario = -1;
    let dadosUsuarioAtual = null; // Armazenar dados do usuário atual do Firestore

    // Coletar todos os usuários e encontrar posição do usuário atual
    let contadorRanking = 0;
    querySnapshot.forEach((docSnap) => {
      contadorRanking += 1;
      let data = docSnap.data();
      let xp = typeof data.xp === 'number' ? data.xp : parseInt(data.xp) || 0; // Garantir que XP seja um número

      usuarios.push({
        id: docSnap.id,
        nome: data.nome || 'Usuário',
        xp: xp,
        posicao: contadorRanking
      });

      if (docSnap.id === usuarioAtivo.id) {
        posicaoUsuario = contadorRanking;
        dadosUsuarioAtual = { nome: data.nome, xp: xp }; // Armazenar dados do Firestore
      }
    });

    // Se não há usuários ou usuário não foi encontrado, mostrar apenas ele
    if (usuarios.length === 0 || posicaoUsuario === -1) {
      let li = document.createElement("li");
      li.className = "bg-ufcg p-2 rounded-lg flex items-center justify-between text-white";
      li.innerHTML = `
        <div class="flex items-center">
          <span class="text-xl mr-2">#1</span>
          <span class="font-semibold">Sua posição</span>
        </div>
        <span class="font-bold">${usuarioAtivo.xp || 0} XP</span>
      `;
      ol.appendChild(li);
      return;
    }

    // Mostrar apenas os 3 primeiros com medalhas
    const medalhas = [
      { icone: '🥇', cor: 'text-yellow-500', bg: 'bg-yellow-50' },
      { icone: '🥈', cor: 'text-gray-400', bg: 'bg-gray-50' },
      { icone: '🥉', cor: 'text-amber-600', bg: 'bg-amber-50' }
    ];

    for (let i = 0; i < Math.min(3, usuarios.length); i++) {
      let usuario = usuarios[i];
      let medalha = medalhas[i];

      let li = document.createElement("li");
      li.className = `${medalha.bg} p-2 rounded-lg mb-2 flex items-center justify-between`;
      li.innerHTML = `
        <div class="flex items-center">
          <span class="text-2xl mr-2">${medalha.icone}</span>
          <span class="font-semibold ${medalha.cor}">${usuario.nome}</span>
        </div>
        <span class="font-bold text-gray-700">${usuario.xp} XP</span>
      `;
      ol.appendChild(li);
    }

    // Sempre mostrar a posição do usuário atual
    let posicaoFinal = (typeof posicaoUsuario === 'number' && posicaoUsuario > 0) ? posicaoUsuario : 1;
    let xpUsuario = dadosUsuarioAtual ? dadosUsuarioAtual.xp : (usuarioAtivo.xp || 0);

    let li = document.createElement("li");
    li.className = "bg-ufcg p-2 rounded-lg mt-3 flex items-center justify-between text-white";
    li.innerHTML = `
      <div class="flex items-center">
        <span class="text-xl mr-2">#${posicaoFinal}</span>
        <span class="font-semibold">Sua posição</span>
      </div>
      <span class="font-bold">${xpUsuario} XP</span>
    `;
    ol.appendChild(li);

    // Se usuário estiver no top 3, destacar sua posição
    if (posicaoUsuario <= 3 && posicaoUsuario > 0) {
      let elementosLi = ol.querySelectorAll('li');
      if (elementosLi[posicaoUsuario - 1]) {
        elementosLi[posicaoUsuario - 1].className += ' ring-2 ring-ufcg ring-offset-2';
      }
    }

  } catch(error) {
    console.error("Erro ao atualizar ranking:", error);
    // Em caso de erro, mostrar posição básica
    if (usuarioAtivo) {
      let ol = document.getElementById("rankingHistorico");
      if (ol) {
        ol.innerHTML = `
          <li class="bg-ufcg p-2 rounded-lg flex items-center justify-between text-white">
            <div class="flex items-center">
              <span class="text-xl mr-2">#1</span>
              <span class="font-semibold">Sua posição</span>
            </div>
            <span class="font-bold">${usuarioAtivo.xp || 0} XP</span>
          </li>
        `;
      }
    }
  }
}

// Obter lista atual do ranking diretamente do Firestore
async function obterRankingAtual(){
  if(!window.db) return [];

  const q = query(collection(window.db, 'usuarios'), orderBy('xp', 'desc'));
  const querySnapshot = await getDocs(q);
  const ranking = [];

  let contadorRanking = 0;
  querySnapshot.forEach((docSnap) => {
    contadorRanking += 1;
    let data = docSnap.data();
    let xp = typeof data.xp === 'number' ? data.xp : parseInt(data.xp) || 0;

    ranking.push({
      posicao: contadorRanking,
      id: docSnap.id,
      nome: data.nome || 'Usuário',
      xp: xp
    });
  });

  console.log('Ranking atual:', ranking);
  return ranking;
}

// Sincronização periódica do ranking (a cada 30 segundos quando o usuário está ativo)
let rankingSyncInterval = null;

function iniciarSincronizacaoRanking(){
  if (rankingSyncInterval) {
    clearInterval(rankingSyncInterval);
  }

  rankingSyncInterval = setInterval(async () => {
    if (usuarioAtivo && document.getElementById("dashboard").style.display !== "none") {
      await atualizarPosicaoUsuario(); // Atualização eficiente da posição
    }
  }, 30000); // A cada 30 segundos
}

function pararSincronizacaoRanking(){
  if (rankingSyncInterval) {
    clearInterval(rankingSyncInterval);
    rankingSyncInterval = null;
  }
}

// Função otimizada para obter apenas a posição do usuário atual
async function obterPosicaoUsuario(){
  try {
    if(!window.db || !usuarioAtivo) return 1;

    console.log("obterPosicaoUsuario: usuarioAtivo.id =", usuarioAtivo.id, "xp =", usuarioAtivo.xp);

    // Fazer query ordenada por XP descendente para encontrar a posição correta
    const q = query(collection(window.db, 'usuarios'), orderBy('xp', 'desc'));
    const querySnapshot = await getDocs(q);

    console.log("obterPosicaoUsuario: Total de usuários no ranking:", querySnapshot.size);

    let posicao = 1;
    let encontrouUsuario = false;

    let contadorRanking = 0;
    querySnapshot.forEach((docSnap) => {
      contadorRanking += 1;
      const data = docSnap.data();
      const docId = docSnap.id;
      const docXp = typeof data.xp === 'number' ? data.xp : parseInt(data.xp) || 0;
      
      console.log(`  ${contadorRanking}. ID: ${docId}, Nome: ${data.nome}, XP: ${docXp}`);

      if (docId === usuarioAtivo.id) {
        posicao = contadorRanking;
        encontrouUsuario = true;
        console.log("  ^ Este é o usuário logado! Posição:", posicao);
      }
    });

    // Se não encontrou o usuário, pode ser que ele ainda não foi salvo ou há erro
    if (!encontrouUsuario) {
      console.warn("Usuário não encontrado no ranking com ID:", usuarioAtivo.id);
      return 1;
    }

    console.log("obterPosicaoUsuario: Retornando posição", posicao);
    return posicao;

  } catch(error) {
    console.error("Erro ao obter posição do usuário:", error);
    return 1; // Fallback para posição 1
  }
}

// Função para atualizar apenas a posição do usuário (mais eficiente)
async function atualizarPosicaoUsuario(){
  try {
    if(!usuarioAtivo) {
      console.log("atualizarPosicaoUsuario: usuarioAtivo não disponível");
      return;
    }

    console.log("atualizarPosicaoUsuario: Iniciando... ID =", usuarioAtivo.id, "XP =", usuarioAtivo.xp);

    const posicao = await obterPosicaoUsuario();
    console.log("atualizarPosicaoUsuario: Posição calculada =", posicao);

    // Buscar XP atualizado do Firestore
    let xpAtual = usuarioAtivo.xp || 0;
    try {
      if(window.db && usuarioAtivo.id) {
        const userDoc = await getDoc(doc(window.db, 'usuarios', usuarioAtivo.id));
        if(userDoc.exists()) {
          const data = userDoc.data();
          xpAtual = typeof data.xp === 'number' ? data.xp : parseInt(data.xp) || 0;
        }
      }
    } catch(error) {
      console.error("Erro ao buscar XP atualizado:", error);
    }

    // Atualizar apenas o elemento da posição do usuário se existir
    const rankingContainer = document.getElementById("rankingHistorico");
    if (!rankingContainer) return;

    // Procurar o elemento da posição do usuário (mais específico)
    const elementosPosicao = rankingContainer.querySelectorAll('li');

    for (let elemento of elementosPosicao) {
      // Verificar se é o elemento da posição do usuário (fundo azul)
      if (elemento.classList.contains('bg-ufcg') && elemento.textContent.includes('Sua posição')) {
        // Atualizar apenas o número da posição
        const spanPosicao = elemento.querySelector('span:first-child');
        if (spanPosicao) {
          spanPosicao.textContent = `#${posicao}`;
        }

        // Atualizar XP também
        const spans = elemento.querySelectorAll('span');
        if (spans.length >= 3) { // span da posição, span "Sua posição", span do XP
          const spanXP = spans[2];
          if (spanXP) {
            spanXP.textContent = `${xpAtual} XP`;
          }
        }
        return; // Encontrou e atualizou, pode sair
      }
    }

    // Se não encontrou o elemento, adicionar um novo
    let li = document.createElement("li");
    li.className = "bg-ufcg p-2 rounded-lg mt-3 flex items-center justify-between text-white";
    li.innerHTML = `
      <div class="flex items-center">
        <span class="text-xl mr-2">#${posicao}</span>
        <span class="font-semibold">Sua posição</span>
      </div>
      <span class="font-bold">${xpAtual} XP</span>
    `;
    rankingContainer.appendChild(li);

  } catch(error) {
    console.error("Erro ao atualizar posição do usuário:", error);
  }
}

// === STREAK ===
function atualizarStreak(){
  let hoje = new Date().toDateString();
  if(usuarioAtivo.ultimaData !== hoje){
    let ontem = new Date();
    ontem.setDate(ontem.getDate()-1);
    if(usuarioAtivo.ultimaData === ontem.toDateString()){
      usuarioAtivo.streak += 1;
    } else {
      usuarioAtivo.streak = 1;
    }
    usuarioAtivo.ultimaData = hoje;
  }
}

// === META AUTOMÁTICA ===
function registrarQuestaoDoDia(){
  if(!usuarioAtivo || !usuarioAtivo.id) return;

  let hoje = new Date().toDateString();
  let chaveProgresso = `progressoHoje_${usuarioAtivo.id}`;
  let progressoHoje = JSON.parse(localStorage.getItem(chaveProgresso)) || {};

  if(progressoHoje.data !== hoje){
    progressoHoje = { data: hoje, acertos: 0 };
  }
  progressoHoje.acertos += 1;
  localStorage.setItem(chaveProgresso, JSON.stringify(progressoHoje));
  atualizarMeta();
}

function atualizarMeta(){
  if(!usuarioAtivo || !usuarioAtivo.id) {
    document.getElementById("metaAtual").innerText = `Meta de hoje: 0 / ${metaDiaria} questões`;
    return;
  }

  let chaveProgresso = `progressoHoje_${usuarioAtivo.id}`;
  let progressoHoje = JSON.parse(localStorage.getItem(chaveProgresso));

  if(!progressoHoje){
    document.getElementById("metaAtual").innerText = `Meta de hoje: 0 / ${metaDiaria} questões`;
    return;
  }
  let texto = `Meta de hoje: ${progressoHoje.acertos} / ${metaDiaria} questões`;
  if(progressoHoje.acertos >= metaDiaria){
    texto += " ✅ Meta concluída!";
  }
  document.getElementById("metaAtual").innerText = texto;
}

// === META ===
async function salvarMeta(){
  const novaMeta = parseInt(document.getElementById("metaDiaria").value) || 5;
  const metaAlterada = novaMeta !== metaDiaria;
  metaDiaria = novaMeta;

  // Salvar meta no Firebase se usuário estiver logado
  try {
    if(window.db && usuarioAtivo && usuarioAtivo.id) {
      await updateDoc(doc(window.db, 'usuarios', usuarioAtivo.id), { metaDiaria: metaDiaria });
      // Atualizar também no objeto local
      usuarioAtivo.metaDiaria = metaDiaria;
      localStorage.setItem("usuarioAtivo", JSON.stringify(usuarioAtivo));
    }
  } catch(error) {
    console.error("Erro ao salvar meta:", error);
  }

  atualizarMeta();

  // Feedback visual se a meta foi alterada
  if(metaAlterada) {
    const btn = document.querySelector('button[onclick="salvarMeta()"]');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i>Meta Atualizada!';
    btn.classList.add('bg-green-500', 'hover:bg-green-600');
    btn.classList.remove('bg-ufcg', 'hover:bg-ufcg-dark');

    setTimeout(() => {
      btn.innerHTML = textoOriginal;
      btn.classList.remove('bg-green-500', 'hover:bg-green-600');
      btn.classList.add('bg-ufcg', 'hover:bg-ufcg-dark');
    }, 2000);
  }
}
function mostrarMeta(){ document.getElementById("metaAtual").innerText = ""; }

function definirUsuarioAtivo(usuario) {
  usuarioAtivo = normalizarUsuario(usuario);
  if (usuarioAtivo) {
    console.log("definirUsuarioAtivo: ID =", usuarioAtivo.id, "XP =", usuarioAtivo.xp, "Nome =", usuarioAtivo.nome);
    // Carregar meta diária do usuário
    metaDiaria = usuarioAtivo.metaDiaria || 5;
    localStorage.setItem("usuarioAtivo", JSON.stringify(usuarioAtivo));
  } else {
    localStorage.removeItem("usuarioAtivo");
  }
}

// === CALENDÁRIO 2026 ===
function gerarCalendario(){
  const calendario = document.getElementById("calendario2026");
  if (!calendario) {
    console.error("Elemento calendario2026 não encontrado");
    return;
  }

  calendario.innerHTML = "";

  // Mostrar o mês atual
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  // Cabeçalho com dias da semana
  const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];
  diasSemana.forEach(dia => {
    let el = document.createElement("div");
    el.innerText = dia;
    el.className = "font-bold text-gray-600 text-xs";
    calendario.appendChild(el);
  });

  // Primeiro dia do mês
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diaSemanaInicio = primeiroDia.getDay();

  // Dias vazios do início
  for(let i = 0; i < diaSemanaInicio; i++){
    let vazio = document.createElement("div");
    vazio.className = "p-1";
    calendario.appendChild(vazio);
  }

  // Dias do mês
  for(let dia = 1; dia <= ultimoDia.getDate(); dia++){
    let diaEl = document.createElement("div");
    diaEl.innerText = dia;
    diaEl.className = "p-1 text-center text-sm rounded cursor-pointer transition-colors";

    // Destacar dia atual
    if(dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()){
      diaEl.className += " bg-ufcg text-white font-bold";
    } else {
      diaEl.className += " hover:bg-ufcg hover:text-white";
    }

    calendario.appendChild(diaEl);
  }
}

export { usuarioAtivo, metaDiaria, carregarUsuarios, criarUsuario, loginUsuario, logout, mostrarDashboard, atualizarXPStreak, atualizarRanking, atualizarStreak, registrarQuestaoDoDia, atualizarMeta, salvarMeta, mostrarMeta, gerarCalendario, definirUsuarioAtivo, obterPosicaoUsuario, atualizarPosicaoUsuario, obterRankingAtual, mostrarCriarConta };

// === CONTROLE DE FORMULÁRIO ===
async function verificarNomeUsuario(){
  const displayName = document.getElementById("displayName").value.trim();
  const statusDiv = document.getElementById("usernameStatus");
  
  if(!displayName){
    statusDiv.className = "text-sm mt-1 hidden";
    statusDiv.innerText = "";
    return;
  }

  if(displayName.length < 3){
    statusDiv.className = "text-sm mt-1 text-orange-600";
    statusDiv.innerText = "Nome deve ter pelo menos 3 caracteres";
    return;
  }

  try {
    const usernameRef = doc(window.db, 'usernames', displayName);
    const usernameSnap = await getDoc(usernameRef);
    
    if(usernameSnap.exists()){
      statusDiv.className = "text-sm mt-1 text-red-600";
      statusDiv.innerText = "❌ Este nome já está em uso";
    } else {
      statusDiv.className = "text-sm mt-1 text-green-600";
      statusDiv.innerText = "✅ Nome disponível";
    }
  } catch(error) {
    console.error("Erro ao verificar nome:", error);
    statusDiv.className = "text-sm mt-1 text-gray-500";
    statusDiv.innerText = "Verificando...";
  }
}
function mostrarCriarConta(){
  document.getElementById("loginFields").classList.add("hidden");
  document.getElementById("createFields").classList.remove("hidden");
  document.getElementById("confirmPasswordField").classList.remove("hidden");
  document.getElementById("btnVoltarLogin").classList.remove("hidden");
  document.getElementById("loginMsg").innerText = "";
  
  // Limpar campos
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("displayName").value = "";
  document.getElementById("userEmail").value = "";
  document.getElementById("confirmPassword").value = "";
  
  // Esconder o botão de login no modo de criação de conta
  const btnEntrar = document.querySelector('button[onclick="loginUsuario()"]');
  if(btnEntrar) {
    btnEntrar.classList.add('hidden');
  }

  // Alterar texto do botão secundário para criar conta
  const btnCriar = document.querySelector('button[onclick="mostrarCriarConta()"]');
  if(btnCriar) {
    btnCriar.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Criar Conta';
    btnCriar.setAttribute("onclick", "criarUsuario()");
  }
}

function mostrarLogin(){
  document.getElementById("loginFields").classList.remove("hidden");
  document.getElementById("createFields").classList.add("hidden");
  document.getElementById("confirmPasswordField").classList.add("hidden");
  document.getElementById("btnVoltarLogin").classList.add("hidden");
  document.getElementById("loginMsg").innerText = "";
  
  // Limpar campos
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("displayName").value = "";
  document.getElementById("userEmail").value = "";
  document.getElementById("confirmPassword").value = "";
  
  // Mostrar o botão de login novamente
  const btnEntrar = document.querySelector('button[onclick="loginUsuario()"]');
  if(btnEntrar) {
    btnEntrar.classList.remove('hidden');
  }

  // Resetar botão secundário para mostrar a tela de criar conta
  const btnCriar = document.querySelector('button[onclick="criarUsuario()"]');
  if(btnCriar) {
    btnCriar.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Criar Usuário';
    btnCriar.setAttribute("onclick", "mostrarCriarConta()");
  }
}

// Tornar funções globais para onclick no HTML
window.criarUsuario = criarUsuario;
window.loginUsuario = loginUsuario;
window.logout = logout;
window.salvarMeta = salvarMeta;
window.mostrarCriarConta = mostrarCriarConta;
window.mostrarLogin = mostrarLogin;
window.mostrarDashboard = mostrarDashboard;
window.verificarNomeUsuario = verificarNomeUsuario;
