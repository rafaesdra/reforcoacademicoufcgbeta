import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';

console.log("🔥 Inicializando Firebase...");

const firebaseConfig = {
  apiKey: "AIzaSyBaSxQGsFGXMc0IwZCLNT3PRNhwfW0woxg",
  authDomain: "reforcoacademicoufcg.firebaseapp.com",
  projectId: "reforcoacademicoufcg",
  storageBucket: "reforcoacademicoufcg.firebasestorage.app",
  messagingSenderId: "753603407071",
  appId: "1:753603407071:web:97ed12b315375b04e94d6a",
  measurementId: "G-80SS8D7RL9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseApp = app;
window.auth = auth;
window.db = db;

console.log("✅ Firebase inicializado com sucesso!");
window.db = db;

export { app, auth, db };
