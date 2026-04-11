// user.js - Gerenciamento de usuários, login e progresso
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, reload, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import { actionCodeSettings, usuarioVerificado, reenviarEmail } from './auth.js';
import './firebase-init.js';
let usuarioAtivo = null;
let metaDiaria = 5;
let criandoUsuario = false;

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
async function criarUsuario(){
  if (criandoUsuario) {
    console.log("Já existe uma criação de usuário em andamento.");
    return;
  }

  const btnCriar = document.getElementById('btnCriarConta');
  if (btnCriar) {
    btnCriar.disabled = true;
  }
  criandoUsuario = true;

  console.log("Iniciando criação de usuário...");
  console.log("Firebase Auth inicializado:", !!window.auth);
  console.log("Firestore inicializado:", !!window.db);

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

    // Verificar se o email já existe em outra conta
    const emailQuery = query(collection(window.db, 'usernames'), where('email', '==', email));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      document.getElementById("loginMsg").innerText = "Este email já está vinculado a outra conta.";
      return;
    }

    const usernameRef = doc(window.db, 'usernames', displayName);
    console.log("Verificando se nome de usuário já existe...");
    try {
      const usernameSnap = await getDoc(usernameRef);
      if(usernameSnap.exists()){
        document.getElementById("loginMsg").innerText="Este nome de usuário já está em uso.";
        console.log("Nome de usuário já existe:", displayName);
        return;
      }
      console.log("Nome de usuário disponível:", displayName);
    } catch(error) {
      console.error("Erro ao verificar nome de usuário:", error);
      document.getElementById("loginMsg").innerText="Erro ao verificar disponibilidade do nome. Tente novamente.";
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(window.auth, email, senha);
    const user = userCredential.user;
    console.log("Usuário criado no Auth:", user.uid);

    try {
      await sendEmailVerification(user);
      console.log("Email de verificação enviado.");
    } catch(error) {
      console.error("Erro ao enviar email de verificação:", error);
    }

    console.log("Salvando mapeamento nome -> email...");
    try {
      await setDoc(usernameRef, { email: email, uid: user.uid });
      console.log("Mapeamento salvo.");
    } catch(error) {
      console.error("Erro ao salvar mapeamento:", error);
      document.getElementById("loginMsg").innerText="Erro ao salvar dados do usuário. Conta criada, mas tente fazer login.";
      return;
    }

    console.log("Salvando dados do usuário no Firestore...");
    try {
      const userData = {
        email: email,
        nome: displayName,
        xp: 0,
        streak: 0,
        ultimaData: null,
        progresso: {},
        id: user.uid,
        emailVerificado: false
      };
      await setDoc(doc(window.db, 'usuarios', user.uid), userData);
      console.log("Dados do usuário salvos.");
    } catch(error) {
      console.error("Erro ao salvar dados do usuário:", error);
      document.getElementById("loginMsg").innerText="Erro ao salvar dados do usuário. Conta criada, mas tente fazer login.";
      return;
    }

    window.location.href = 'pages/verificar-email.html';
    return;
  } catch(error) {
    console.error("Erro ao criar usuário:", error);
    let msg = "Erro ao criar usuário.";
    if(error.code === 'auth/email-already-in-use') {
      msg = "Este email já está cadastrado.";
    } else if(error.code === 'auth/weak-password') {
      msg = "A senha deve ter pelo menos 6 caracteres.";
    } else if(error.code === 'auth/invalid-email') {
      msg = "Email inválido.";
    } else if(error.code) {
      msg += " Código: " + error.code;
    }
    document.getElementById("loginMsg").innerText = msg;
  } finally {
    criandoUsuario = false;
    if (btnCriar) {
      btnCriar.disabled = false;
    }
  }
}

async function loginUsuario(){
  try {
    console.log("🔐 Iniciando processo de login...");

    // Verificar se o sistema está pronto
    if (!window.sistemaPronto) {
      document.getElementById("loginMsg").innerText="Sistema ainda carregando. Aguarde alguns segundos e tente novamente.";
      console.log("⏳ Sistema ainda não está pronto");
      return;
    }

    let input = document.getElementById("username").value.trim();
    let senha = document.getElementById("password").value.trim();

    if(!input) {
      document.getElementById("loginMsg").innerText="Preencha nome de usuário ou email.";
      return;
    }

    if(!window.auth) {
      document.getElementById("loginMsg").innerText="Erro: Firebase Auth não inicializado.";
      console.error("❌ Firebase Auth não está disponível");
      return;
    }

    if(!window.db) {
      document.getElementById("loginMsg").innerText="Erro: Firestore não inicializado.";
      console.error("❌ Firestore não está disponível");
      return;
    }

    let email = input;
    let isGoogleUser = false;

    console.log("🔍 Verificando se é um username...");

    // Primeiro tentar como username
    const usernameRef = doc(window.db, 'usernames', input);
    const usernameSnap = await getDoc(usernameRef);

    if(usernameSnap.exists()){
      // É um username válido
      email = usernameSnap.data().email;
      isGoogleUser = usernameSnap.data().provider === 'google';
      console.log("✅ Login via username:", input, "-> email:", email, "Google user:", isGoogleUser);
    } else {
      // Não é username, verificar se é email válido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) {
        document.getElementById("loginMsg").innerText="Nome de usuário não encontrado ou email inválido.";
        console.log("❌ Input não é username nem email válido:", input);
        return;
      }

      // Verificar se é um usuário Google pelo email
      const googleUserQuery = query(
        collection(window.db, 'usernames'),
        where('email', '==', input),
        where('provider', '==', 'google')
      );
      const googleUserSnap = await getDocs(googleUserQuery);
      isGoogleUser = !googleUserSnap.empty;

      console.log("📧 Login via email direto:", input, "Google user:", isGoogleUser);
    }

    console.log("📝 Input fornecido:", input ? "presente" : "ausente");
    console.log("🔑 Senha fornecida:", senha ? "presente" : "ausente");

    if(!input) {
      document.getElementById("loginMsg").innerText="Preencha nome de usuário ou email.";
      return;
    }

    if(!window.auth) {
      document.getElementById("loginMsg").innerText="Erro: Firebase Auth não inicializado.";
      console.error("❌ Firebase Auth não está disponível");
      return;
    }

    if(!window.db) {
      document.getElementById("loginMsg").innerText="Erro: Firestore não inicializado.";
      console.error("❌ Firestore não está disponível");
      return;
    }

    // Para usuários Google, não precisa de senha
    if (isGoogleUser) {
      if (senha) {
        document.getElementById("loginMsg").innerText="Usuários do Google não precisam de senha. Clique em 'Entrar com Google' ou use apenas o username/email.";
        return;
      }

      // Fazer sign-in anônimo temporário ou usar uma abordagem diferente
      // Como usuários Google já estão autenticados no Firebase Auth,
      // vamos buscar o usuário atual
      const currentUser = window.auth.currentUser;
      if (!currentUser || currentUser.email !== email) {
        document.getElementById("loginMsg").innerText="Para usuários do Google, clique em 'Entrar com Google' para fazer login.";
        return;
      }

      // Usuário Google já autenticado, carregar dados
      const userRef = doc(window.db, 'usuarios', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if(!userSnap.exists()){
        document.getElementById("loginMsg").innerText="Dados do usuário não encontrados. Tente fazer login com Google novamente.";
        return;
      }

      const userData = userSnap.data();
      definirUsuarioAtivo({id: currentUser.uid, ...userData});
      return;
    }

    // Para usuários tradicionais, senha é obrigatória
    if(!senha) {
      document.getElementById("loginMsg").innerText="Preencha a senha.";
      console.log("❌ Senha não fornecida");
      return;
    }

    console.log("🔐 Fazendo login com Firebase Auth para email:", email);

    // Fazer login com Firebase Auth usando o email encontrado
    const userCredential = await signInWithEmailAndPassword(window.auth, email, senha);
    const user = userCredential.user;

    console.log("✅ Login no Firebase Auth bem-sucedido para:", user.email);
    console.log("📧 Email verificado:", user.emailVerified);

    if (!user.emailVerified) {
      document.getElementById("loginMsg").innerText="Verifique seu email antes de fazer login. Um novo link foi enviado.";
      console.log("⚠️ Email não verificado, enviando novo link de verificação");
      try {
        await sendEmailVerification(user, actionCodeSettings);
        console.log("✅ Link de verificação enviado");
      } catch(error) {
        console.error("❌ Erro ao reenviar email de verificação:", error);
      }
      window.location.href = 'pages/verificar-email.html';
      return;
    }

    // Esconder botão de reenviar se estava visível
    document.getElementById("btnReenviarVerificacao").classList.add("hidden");

    console.log("📊 Carregando dados do usuário do Firestore...");

    // Carregar dados do usuário do Firestore
    const userRef = doc(window.db, 'usuarios', user.uid);
    const userSnap = await getDoc(userRef);

    if(!userSnap.exists()){
      document.getElementById("loginMsg").innerText="Dados do usuário não encontrados. Tente criar uma nova conta.";
      console.error("❌ Dados do usuário não encontrados no Firestore para UID:", user.uid);
      return;
    }

    console.log("✅ Dados do usuário encontrados no Firestore");

    // Atualizar status de verificação no Firestore se necessário
    const userData = userSnap.data();

    console.log("🔍 Status de verificação - Firebase Auth:", user.emailVerified, "Firestore:", userData.emailVerificado);

    // Para usuários existentes, ser mais tolerante - se o Firebase Auth diz que está verificado, aceitar
    if (!userData.emailVerificado && user.emailVerified) {
      console.log("🔄 Atualizando status de verificação no Firestore para usuário existente");
      await updateDoc(userRef, { emailVerificado: true });
      userData.emailVerificado = true;
    }

    console.log("🎯 Definindo usuário ativo e mostrando dashboard");
    definirUsuarioAtivo({id: user.uid, ...userData, emailVerificado: true});
    console.log("🔄 Chamando mostrarDashboard...");
    mostrarDashboard();
    console.log("✅ Login completado com sucesso!");
  } catch(error) {
    console.error("❌ Erro ao fazer login:", error);
    console.error("Código do erro:", error.code);
    console.error("Mensagem do erro:", error.message);

    let msg = "Erro ao fazer login.";
    if(error.code === 'auth/user-not-found') {
      msg = "Usuário não encontrado.";
    } else if(error.code === 'auth/wrong-password') {
      msg = "Senha incorreta.";
    } else if(error.code === 'auth/invalid-email') {
      msg = "Email inválido.";
    } else if(error.code === 'auth/quota-exceeded') {
      msg = "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.";
    } else if(error.code === 'auth/too-many-requests') {
      msg = "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.";
    } else if(error.code === 'auth/user-disabled') {
      msg = "Esta conta foi desativada.";
    } else if(error.code === 'auth/network-request-failed') {
      msg = "Erro de conexão. Verifique sua internet.";
    } else if(error.code === 'auth/invalid-credential') {
      msg = "Credenciais inválidas.";
    } else {
      msg = `Erro: ${error.message}`;
    }
    document.getElementById("loginMsg").innerText = msg;
  }
}

async function loginComGoogle(){
  try {
    if(!window.auth) {
      document.getElementById("loginMsg").innerText = "Erro: Firebase Auth não inicializado.";
      return;
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(window.auth, provider);
    const user = result.user;

    if(!user) {
      document.getElementById("loginMsg").innerText = "Não foi possível autenticar com Google.";
      return;
    }

    const email = user.email || '';
    const existingEmailQuery = query(collection(window.db, 'usernames'), where('email', '==', email));
    const existingEmailSnap = await getDocs(existingEmailQuery);
    if (!existingEmailSnap.empty) {
      const existingData = existingEmailSnap.docs[0].data();
      if (existingData.provider !== 'google' || existingData.uid !== user.uid) {
        document.getElementById("loginMsg").innerText = "Este email já está cadastrado com outro método. Use login por email e senha ou vincule o Google à conta existente.";
        return;
      }
    }

    // Criar username automático baseado no displayName
    const baseUsername = (user.displayName || user.email.split('@')[0] || 'usuario').toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .substring(0, 20); // Limita tamanho

    let username = baseUsername;
    let counter = 1;

    // Verificar se username já existe e criar versão única se necessário
    while (true) {
      const usernameRef = doc(window.db, 'usernames', username);
      const usernameSnap = await getDoc(usernameRef);

      if (!usernameSnap.exists()) {
        break; // Username disponível
      }

      // Se já existe mas é do mesmo usuário, está ok
      if (usernameSnap.data().uid === user.uid) {
        break;
      }

      // Criar novo username com contador
      username = `${baseUsername}${counter}`;
      counter++;

      if (counter > 100) { // Prevenção de loop infinito
        username = `${baseUsername}_${Date.now()}`;
        break;
      }
    }

    // Salvar mapeamento username -> email/uid
    const usernameRef = doc(window.db, 'usernames', username);
    await setDoc(usernameRef, {
      email: user.email,
      uid: user.uid,
      provider: 'google'
    });

    const userRef = doc(window.db, 'usuarios', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = {
      id: user.uid,
      nome: user.displayName || 'Usuário Google',
      email: user.email || '',
      username: username, // Salvar username para referência
      xp: userSnap.exists() ? userSnap.data().xp || 0 : 0,
      streak: userSnap.exists() ? userSnap.data().streak || 0 : 0,
      ultimaData: userSnap.exists() ? userSnap.data().ultimaData || null : null,
      progresso: userSnap.exists() ? userSnap.data().progresso || {} : {},
      emailVerificado: user.emailVerified === true,
      provider: 'google'
    };

    await setDoc(userRef, userData, { merge: true });

    definirUsuarioAtivo(userData);
    document.getElementById("loginMsg").innerText = `Conta criada via Google! Você já está logado e seu usuário aleatório é "${username}".`;
    mostrarDashboard();
  } catch(error) {
    console.error("Erro ao entrar com Google:", error.code, error.message);
    let msg = "Erro ao entrar com Google.";
    if(error.code === 'auth/popup-closed-by-user') {
      msg = "Popup fechado antes de concluir o login.";
    } else if(error.code === 'auth/cancelled-popup-request') {
      msg = "Solicitação de login cancelada. Tente novamente.";
    } else if(error.code === 'auth/popup-blocked') {
      msg = "O popup de login foi bloqueado pelo navegador. Permita popups e tente novamente.";
    } else if(error.code === 'auth/operation-not-allowed') {
      msg = "Login com Google não está habilitado no Firebase. Ative Google Sign-In no console do Firebase.";
    } else if(error.code === 'auth/unauthorized-domain') {
      msg = "Domínio não autorizado. Adicione localhost ao domínio autorizado no console do Firebase.";
    }
    document.getElementById("loginMsg").innerText = `${msg} ${error.message || ''}`.trim();
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
  console.log("🚀 mostrarDashboard chamado");
  console.log("👤 usuarioAtivo:", usuarioAtivo);

  if (!usuarioAtivo) {
    console.error("❌ Tentando mostrar dashboard sem usuário ativo");
    return;
  }

  console.log("✅ Usuário ativo encontrado, mostrando dashboard...");

  // Não fazer redirecionamento automático aqui - deixar para o fluxo normal
  if (!window.auth?.currentUser?.emailVerified) {
    console.log("⚠️ Email não verificado - mostrando mensagem em vez de redirecionar");
    // Não redirecionar automaticamente, deixar o usuário decidir
  }

  console.log("🔄 Ocultando loginCard e mostrando dashboard...");
  document.getElementById("loginCard").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("usuarioAtivo").innerText = usuarioAtivo.nome;

  console.log("📊 Atualizando XP e streak...");
  atualizarXPStreak();

  console.log("🎯 Atualizando meta...");
  atualizarMeta(); // Atualizar meta diária do usuário

  console.log("🏆 Atualizando ranking...");
  await atualizarRanking(); // Ranking completo no login

  // Iniciar sincronização automática da posição
  console.log("🔄 Iniciando sincronização de ranking...");
  iniciarSincronizacaoRanking();

  // Gerar calendário quando o dashboard é mostrado
  console.log("📅 Gerando calendário...");
  gerarCalendario();

  // Carregar disciplinas quando o dashboard é mostrado
  console.log("📚 Carregando disciplinas...");
  if(window.carregarDisciplinas){
    window.carregarDisciplinas();
  }

  console.log("✅ Dashboard mostrado com sucesso!");
}

// Atualiza XP e streak
function atualizarXPStreak(){
  document.getElementById("xpUsuario").innerText = usuarioAtivo.xp;
  document.getElementById("streakUsuario").innerText = usuarioAtivo.streak;
}

// Atualiza ranking histórico
async function atualizarRanking(){
  try {
    if(!window.db || !usuarioAtivo || !usuarioVerificado()) return;

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
  if(!window.db || !usuarioVerificado()) return [];

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
    if(!window.db || !usuarioAtivo || !usuarioVerificado()) return 1;

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
    if(!usuarioAtivo || !usuarioVerificado()) {
      console.log("atualizarPosicaoUsuario: usuário não verificado ou indisponível");
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
  if(!usuarioAtivo || !usuarioAtivo.id || !usuarioVerificado()) return;

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

  if (!usuarioVerificado()) {
    return;
  }

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

export { usuarioAtivo, metaDiaria, criarUsuario, loginUsuario, logout, mostrarDashboard, atualizarXPStreak, atualizarRanking, atualizarStreak, registrarQuestaoDoDia, atualizarMeta, salvarMeta, mostrarMeta, gerarCalendario, definirUsuarioAtivo, obterPosicaoUsuario, atualizarPosicaoUsuario, obterRankingAtual, mostrarCriarConta, reenviarVerificacao };

// === DEBUG FUNCTIONS ===
window.debugLogin = async function() {
  console.log("🔍 === DEBUG LOGIN ===");
  console.log("Firebase Auth:", !!window.auth);
  console.log("Firestore:", !!window.db);
  console.log("Sistema Pronto (local):", sistemaPronto);
  console.log("Sistema Pronto (global):", window.sistemaPronto);
  console.log("Current User:", window.auth?.currentUser);

  if (window.auth?.currentUser) {
    console.log("User Email:", window.auth.currentUser.email);
    console.log("Email Verified:", window.auth.currentUser.emailVerified);
    console.log("User UID:", window.auth.currentUser.uid);
  }

  console.log("Usuario Ativo:", usuarioAtivo);
  console.log("=====================");
};
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
  
  // Preencher displayName com o valor de username se estiver preenchido e o campo estiver vazio
  const usernameValue = document.getElementById("username").value.trim();
  const displayNameField = document.getElementById("displayName");
  if (usernameValue && !displayNameField.value.trim()) {
    displayNameField.value = usernameValue;
  }
  
  // Esconder o botão de login no modo de criação de conta
  const btnEntrar = document.getElementById('btnEntrar');
  if(btnEntrar) {
    btnEntrar.classList.add('hidden');
  }

  // Alterar texto do botão secundário para criar conta
  const btnCriar = document.getElementById('btnCriarConta');
  if(btnCriar) {
    btnCriar.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Criar Conta';
    btnCriar.setAttribute("onclick", "criarUsuario()");
  }
}

function mostrarLogin(mensagem = ""){
  document.getElementById("loginFields").classList.remove("hidden");
  document.getElementById("createFields").classList.add("hidden");
  document.getElementById("confirmPasswordField").classList.add("hidden");
  document.getElementById("btnVoltarLogin").classList.add("hidden");
  document.getElementById("btnReenviarVerificacao").classList.add("hidden");
  document.getElementById("loginMsg").innerText = mensagem;
  
  // Limpar campos
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("displayName").value = "";
  document.getElementById("userEmail").value = "";
  document.getElementById("confirmPassword").value = "";
  
  // Mostrar o botão de login novamente
  const btnEntrar = document.getElementById('btnEntrar');
  if(btnEntrar) {
    btnEntrar.classList.remove('hidden');
  }

  // Resetar botão secundário para mostrar a tela de criar conta
  const btnCriar = document.getElementById('btnCriarConta');
  if(btnCriar) {
    btnCriar.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Criar Usuário';
    btnCriar.setAttribute("onclick", "mostrarCriarConta()");
  }
}

async function reenviarVerificacao(){
  try {
    if(!window.auth?.currentUser) {
      document.getElementById("loginMsg").innerText="Faça login primeiro para reenviar o email de verificação.";
      return;
    }

    await reenviarEmail();
    document.getElementById("loginMsg").innerText="Email de verificação reenviado. Verifique sua caixa de entrada.";
  } catch(error) {
    console.error("Erro ao reenviar verificação:", error);
    document.getElementById("loginMsg").innerText="Não foi possível reenviar o email. Tente novamente.";
  }
}

// Tornar funções globais para onclick no HTML
window.criarUsuario = criarUsuario;
window.loginUsuario = loginUsuario;
window.loginComGoogle = loginComGoogle;
window.logout = logout;
window.salvarMeta = salvarMeta;
window.mostrarCriarConta = mostrarCriarConta;
window.mostrarLogin = mostrarLogin;
window.reenviarVerificacao = reenviarVerificacao;
window.mostrarDashboard = mostrarDashboard;
window.verificarNomeUsuario = verificarNomeUsuario;
