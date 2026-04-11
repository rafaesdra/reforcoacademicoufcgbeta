import { auth } from './firebase-init.js';
import { reenviarEmail, verificarEmailAtual } from './auth.js';

const btnResend = document.getElementById('btnResendEmail');
const btnChecked = document.getElementById('btnEmailChecked');
const statusText = document.getElementById('verifyStatus');
const emailText = document.getElementById('verifyEmail');
const loader = document.getElementById('verifyLoader');

function setLoading(active) {
  if (!loader) return;
  loader.style.display = active ? 'block' : 'none';
}

function setStatus(message, type = 'info') {
  if (!statusText) return;
  statusText.innerText = message;
  statusText.className = 'mt-4 text-center font-medium ' + (type === 'error' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-gray-700');
}

async function atualizarInterface() {
  if (!auth) {
    setStatus('Erro ao inicializar Firebase. Recarregue a página.', 'error');
    return;
  }

  const user = auth.currentUser;
  if (user && user.email) {
    emailText.innerText = user.email;
    return;
  }

  setLoading(true);
  auth.onAuthStateChanged((userState) => {
    setLoading(false);
    if (userState && userState.email) {
      emailText.innerText = userState.email;
      return;
    }
    setStatus('Faça login para continuar a verificação de email.', 'error');
  });
}

async function handleResend() {
  try {
    setLoading(true);
    setStatus('Enviando email de verificação...', 'info');
    await reenviarEmail();
    setStatus('Email reenviado com sucesso. Verifique sua caixa de entrada.', 'success');
  } catch (error) {
    console.error(error);
    setStatus('Falha ao reenviar o email. Tente novamente.', 'error');
  } finally {
    setLoading(false);
  }
}

async function handleChecked() {
  try {
    setLoading(true);
    setStatus('Verificando o status do email...', 'info');
    const verified = await verificarEmailAtual();
    if (verified) {
      setStatus('Email verificado! Redirecionando para o dashboard...', 'success');
      window.location.href = '/index.html';
      return;
    }
    setStatus('Ainda não encontramos a confirmação. Abra o email e clique no link.', 'error');
  } catch (error) {
    console.error(error);
    setStatus('Não foi possível verificar o email agora. Tente novamente em alguns instantes.', 'error');
  } finally {
    setLoading(false);
  }
}

if (btnResend) {
  btnResend.addEventListener('click', handleResend);
}

if (btnChecked) {
  btnChecked.addEventListener('click', handleChecked);
}

atualizarInterface();
