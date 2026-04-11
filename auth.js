import { auth } from './firebase-init.js';
import { sendEmailVerification, reload } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';

const origin = window.location.origin || `${window.location.protocol}//${window.location.host}`;
const actionCodeSettings = {
  url: `${origin}/index.html`,
  handleCodeInApp: true
};

function usuarioVerificado() {
  return auth?.currentUser?.emailVerified === true;
}

async function enviarEmailDeVerificacao(user) {
  if (!user) {
    throw new Error('Usuário não autenticado para envio de verificação.');
  }

  await sendEmailVerification(user, actionCodeSettings);
}

async function reenviarEmail() {
  if (!auth?.currentUser) {
    throw new Error('Nenhum usuário autenticado para reenviar o email.');
  }
  await enviarEmailDeVerificacao(auth.currentUser);
}

async function verificarEmailAtual() {
  if (!auth?.currentUser) {
    return false;
  }
  await reload(auth.currentUser);
  return auth.currentUser.emailVerified === true;
}

async function verificarAcessoUsuario(user) {
  if (!user) {
    return false;
  }
  await reload(user);
  if (!user.emailVerified) {
    window.location.href = '/pages/verificar-email.html';
    return false;
  }
  return true;
}

export {
  auth,
  actionCodeSettings,
  usuarioVerificado,
  reenviarEmail,
  verificarEmailAtual,
  verificarAcessoUsuario,
  enviarEmailDeVerificacao
};
