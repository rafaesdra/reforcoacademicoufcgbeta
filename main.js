// main.js - Inicialização da aplicação
import { carregarUsuarios, mostrarDashboard, gerarCalendario, mostrarMeta, atualizarMeta, definirUsuarioAtivo, atualizarRanking, loginUsuario, criarUsuario, logout, mostrarCriarConta, obterRankingAtual } from './user.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';
import './disciplinas.js';
import './exercicios.js';

// === INICIALIZAÇÃO ===
let authStateUnsubscribe = null;

async function iniciar() {
  if(window.location.protocol === 'file:') {
    alert('O site deve ser executado a partir de um servidor HTTP. Use Live Server ou execute um servidor local para acessar os assuntos e exercícios.');
    return;
  }

  // Wait for Firebase to be initialized
  while(!window.db || !window.auth) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await carregarUsuarios();
  mostrarMeta();
  atualizarMeta();

  // Tornar funções disponíveis globalmente para o HTML
  window.loginUsuario = loginUsuario;
  window.criarUsuario = criarUsuario;
  window.logout = logout;
  window.mostrarCriarConta = mostrarCriarConta;
  window.atualizarRanking = atualizarRanking;
  window.obterRankingAtual = obterRankingAtual;

  // Limpar listener anterior se existir
  if (authStateUnsubscribe) {
    authStateUnsubscribe();
  }

  // Listen for authentication state changes
  authStateUnsubscribe = onAuthStateChanged(window.auth, async (user) => {
    if (user) {
      // User is signed in, load their data from Firestore
      try {
        const userRef = doc(window.db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);

        if(userSnap.exists()){
          definirUsuarioAtivo({id: user.uid, ...userSnap.data()});
          mostrarDashboard();
        } else {
          // Dados não encontrados - usuário deve criar conta primeiro
          console.error("Dados do usuário não encontrados no Firestore");
          // Não mostrar dashboard, manter na tela de login
        }
      } catch(error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    } else {
      // User is signed out
      // Dashboard will remain hidden, login form will be shown
    }
  });
}

function limparAuthListener() {
  if (authStateUnsubscribe) {
    authStateUnsubscribe();
    authStateUnsubscribe = null;
  }
}

// Tornar função global
window.limparAuthListener = limparAuthListener;

window.onload = iniciar;
