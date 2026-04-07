// user.js - Gerenciamento de usuários, login e progresso
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
let usuarioAtivo = null;
let metaDiaria = 3;

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
      progresso: {}
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

    usuarioAtivo = {id: user.uid, ...userSnap.data()};
    localStorage.setItem("usuarioAtivo", JSON.stringify(usuarioAtivo));
    mostrarDashboard();
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
  usuarioAtivo = null;
  localStorage.removeItem("usuarioAtivo");
  location.reload();
}

// === DASHBOARD ===
async function mostrarDashboard(){
  document.getElementById("loginCard").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("usuarioAtivo").innerText = usuarioAtivo.nome;
  atualizarXPStreak();
  await atualizarRanking();
  
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
    if(!window.db) return;
    const q = query(collection(window.db, 'usuarios'), orderBy('xp', 'desc'));
    const querySnapshot = await getDocs(q);
    let ol = document.getElementById("rankingHistorico");
    ol.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      let data = docSnap.data();
      let li = document.createElement("li");
      li.innerText = `${data.nome} - ${data.xp} XP`;
      ol.appendChild(li);
    });
  } catch(error) {
    console.error("Erro ao atualizar ranking:", error);
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
  let hoje = new Date().toDateString();
  let progressoHoje = JSON.parse(localStorage.getItem("progressoHoje")) || {};
  if(progressoHoje.data !== hoje){
    progressoHoje = { data: hoje, acertos: 0 };
  }
  progressoHoje.acertos += 1;
  localStorage.setItem("progressoHoje", JSON.stringify(progressoHoje));
  atualizarMeta();
}

function atualizarMeta(){
  let progressoHoje = JSON.parse(localStorage.getItem("progressoHoje"));
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
function salvarMeta(){
  metaDiaria = parseInt(document.getElementById("metaDiaria").value)||3;
  atualizarMeta();
}
function mostrarMeta(){ document.getElementById("metaAtual").innerText = ""; }

function definirUsuarioAtivo(usuario) {
  usuarioAtivo = usuario;
  if (usuarioAtivo) {
    localStorage.setItem("usuarioAtivo", JSON.stringify(usuarioAtivo));
  } else {
    localStorage.removeItem("usuarioAtivo");
  }
}

// === CALENDÁRIO 2026 ===
function gerarCalendario(){
  const calendario = document.getElementById("calendario2026");
  calendario.innerHTML = "";
  const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];
  diasSemana.forEach(d=>{
    let el = document.createElement("div");
    el.innerText = d;
    el.className="font-bold";
    calendario.appendChild(el);
  });

  let data = new Date("2026-01-01");
  while(data.getFullYear() === 2026){
    let dia = document.createElement("div");
    dia.innerText = data.getDate();
    dia.className="p-2 rounded";
    calendario.appendChild(dia);
    data.setDate(data.getDate()+1);
  }
}

export { usuarioAtivo, metaDiaria, carregarUsuarios, criarUsuario, loginUsuario, logout, mostrarDashboard, atualizarXPStreak, atualizarRanking, atualizarStreak, registrarQuestaoDoDia, atualizarMeta, salvarMeta, mostrarMeta, gerarCalendario, definirUsuarioAtivo };

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
  
  // Alterar texto do botão principal
  const btnCriar = document.querySelector('button[onclick="mostrarCriarConta()"]');
  btnCriar.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Criar Conta';
  btnCriar.setAttribute("onclick", "criarUsuario()");
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
  
  // Resetar botão
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
window.verificarNomeUsuario = verificarNomeUsuario;
window.logout = logout;
window.salvarMeta = salvarMeta;