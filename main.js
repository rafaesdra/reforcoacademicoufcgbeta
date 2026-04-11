// main.js - Inicialização da aplicação
import './firebase-init.js';
import { mostrarDashboard, gerarCalendario, mostrarMeta, atualizarMeta, definirUsuarioAtivo, atualizarRanking, loginUsuario, criarUsuario, logout, mostrarCriarConta, obterRankingAtual, reenviarVerificacao } from './user.js';
import { onAuthStateChanged, applyActionCode } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import { verificarAcessoUsuario } from './auth.js';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';
import './disciplinas.js';
import './exercicios.js';

// === INICIALIZAÇÃO ===
console.log("📦 main.js carregado");
let authStateUnsubscribe = null;
let sistemaPronto = false;

// Definir funções globais imediatamente
window.loginUsuario = () => sistemaPronto ? loginUsuario() : alert('Sistema ainda carregando...');
window.criarUsuario = () => sistemaPronto ? criarUsuario() : alert('Sistema ainda carregando...');
window.logout = () => sistemaPronto ? logout() : alert('Sistema ainda carregando...');
window.mostrarCriarConta = () => sistemaPronto ? mostrarCriarConta() : alert('Sistema ainda carregando...');
window.reenviarVerificacao = () => sistemaPronto ? reenviarVerificacao() : alert('Sistema ainda carregando...');
window.atualizarRanking = () => sistemaPronto ? atualizarRanking() : alert('Sistema ainda carregando...');
window.obterRankingAtual = () => sistemaPronto ? obterRankingAtual() : alert('Sistema ainda carregando...');

// Exportar funções do Firestore para uso no script inline
window.doc = doc;
window.getDoc = getDoc;
window.query = query;
window.collection = collection;
window.where = where;
window.getDocs = getDocs;

async function processActionCodeFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const actionCode = params.get('oobCode');
    if (mode !== 'verifyEmail' || !actionCode) return;

    await applyActionCode(window.auth, actionCode);
    if (window.auth.currentUser) {
      await window.auth.currentUser.reload();
      
      // Atualizar o status de verificação no Firestore
      const userRef = doc(window.db, 'usuarios', window.auth.currentUser.uid);
      await updateDoc(userRef, {
        emailVerificado: true
      });
      console.log("Email verificado e status atualizado no Firestore");
    }
    document.getElementById('loginMsg').innerText = 'Email verificado com sucesso! Faça login para continuar.';
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
    console.error('Erro ao processar link de verificação:', error);
    document.getElementById('loginMsg').innerText = 'Não foi possível processar o link de verificação. Tente novamente.';
  }
}

async function iniciar() {
  console.log("🚀 Iniciando aplicação...");

  try {
    // Verificar se estamos na página correta (index.html)
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
      console.log("Não estamos na página principal, pulando inicialização automática");
      return;
    }

    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      console.log("⏳ Aguardando DOM carregar...");
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    console.log("📄 DOM pronto");

    if(window.location.protocol === 'file:') {
      console.warn('⚠️ O site está sendo executado localmente. Os assuntos e exercícios podem não carregar corretamente. Use Live Server para acesso completo.');
      // Não retornar, permitir que o sistema seja inicializado para login
    }

    // Verificar se Firebase está disponível
    console.log("🔥 Verificando Firebase...");
    if (!window.auth || !window.db) {
      console.error("❌ Firebase não está inicializado!");
      setTimeout(() => {
        console.log("🔄 Tentando inicializar novamente...");
        iniciar();
      }, 1000);
      return;
    }
    console.log("✅ Firebase inicializado");

    console.log("🔗 Processando códigos de ação da URL...");
    try {
      await processActionCodeFromUrl();
      console.log("✅ Códigos processados");
    } catch (error) {
      console.error("❌ Erro ao processar códigos de ação:", error);
    }

    console.log("📊 Mostrando meta...");
    try {
      mostrarMeta();
      atualizarMeta();
      console.log("✅ Meta atualizada");
    } catch (error) {
      console.error("❌ Erro ao atualizar meta:", error);
    }

    // Marcar sistema como pronto
    sistemaPronto = true;
    window.sistemaPronto = true; // Também definir globalmente
    console.log("🎉 Sistema pronto!");

    // Agora sobrescrever as funções com as reais
    window.loginUsuario = loginUsuario;
    window.criarUsuario = criarUsuario;
    window.logout = logout;
    window.mostrarCriarConta = mostrarCriarConta;
    window.reenviarVerificacao = reenviarVerificacao;
    window.atualizarRanking = atualizarRanking;
    window.obterRankingAtual = obterRankingAtual;

    console.log("🔄 Configurando listener de autenticação...");

    // Limpar listener anterior se existir
    if (authStateUnsubscribe) {
      authStateUnsubscribe();
    }

    // Listen for authentication state changes
    authStateUnsubscribe = onAuthStateChanged(window.auth, async (user) => {
      console.log("👤 Estado de autenticação mudou:", user ? "logado" : "deslogado");

      // Só fazer verificações se estamos na página principal
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        console.log("Estamos em uma página específica, pulando verificações automáticas");
        return;
      }

      if (user) {
        console.log("🔍 Verificando email do usuário:", user.email, "Verificado:", user.emailVerified);

        // Verificar se o email está verificado no Firebase Auth
        if (!user.emailVerified) {
          console.log("Usuário logado mas email não verificado - não redirecionando automaticamente");
          return;
        }

        // User is signed in and email verificado, load their data from Firestore
        try {
          console.log("📊 Carregando dados do usuário do Firestore...");
          const userRef = doc(window.db, 'usuarios', user.uid);
          const userSnap = await getDoc(userRef);

          if(userSnap.exists()){
            const userData = userSnap.data();
            console.log("✅ Dados do usuário encontrados");

            // Atualizar status de verificação no Firestore se necessário
            if (!userData.emailVerificado) {
              console.log("🔄 Atualizando status de verificação no Firestore");
              await updateDoc(userRef, { emailVerificado: true });
              userData.emailVerificado = true;
            }

            definirUsuarioAtivo({id: user.uid, ...userData});
            mostrarDashboard();
            console.log("🎯 Dashboard mostrado");
          } else {
            // Dados não encontrados - usuário deve criar conta primeiro
            console.error("❌ Dados do usuário não encontrados no Firestore");
            // Não mostrar dashboard, manter na tela de login
          }
        } catch(error) {
          console.error("❌ Erro ao carregar dados do usuário:", error);
        }
      } else {
        console.log("🚪 Usuário deslogado");
        // User is signed out
        // Dashboard will remain hidden, login form will be shown
      }
    });

    console.log("✅ Inicialização completa!");
  } catch (error) {
    console.error("❌ Erro crítico na inicialização:", error);
    // Tentar novamente em caso de erro
    setTimeout(() => {
      console.log("🔄 Tentando reinicializar...");
      iniciar();
    }, 2000);
  }
}

function limparAuthListener() {
  if (authStateUnsubscribe) {
    authStateUnsubscribe();
    authStateUnsubscribe = null;
  }
}

// Tornar função global
window.limparAuthListener = limparAuthListener;

// Iniciar aplicação quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    iniciar();
  });
} else {
  iniciar();
}

// Timeout de segurança - marcar como pronto após 10 segundos mesmo se houver problemas
setTimeout(() => {
  if (!sistemaPronto) {
    console.warn("⚠️ Timeout de segurança: marcando sistema como pronto");
    sistemaPronto = true;
    window.sistemaPronto = true;

    // Sobrescrever funções com as reais
    window.loginUsuario = loginUsuario;
    window.criarUsuario = criarUsuario;
    window.logout = logout;
    window.mostrarCriarConta = mostrarCriarConta;
    window.reenviarVerificacao = reenviarVerificacao;
    window.atualizarRanking = atualizarRanking;
    window.obterRankingAtual = obterRankingAtual;

    console.log("✅ Sistema marcado como pronto por timeout de segurança");
  }
}, 10000);
