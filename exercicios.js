// exercicios.js - Lógica de exercícios e questões
import { usuarioAtivo, atualizarXPStreak, atualizarRanking, atualizarStreak, registrarQuestaoDoDia } from './user.js';
import { construirCaminho, atualizarProgresso } from './disciplinas.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';

let respostaSelecionada = null;

function renderQuestao(){
  const questoesAtivas = window.questoesAtivas || [];
  const questaoIndex = window.questaoIndex || 0;
  if(!questoesAtivas.length) return;
  let questao = questoesAtivas[questaoIndex];
  document.getElementById("questaoMeta").innerText = `Pergunta ${questaoIndex + 1} de ${questoesAtivas.length} • Nível: ${questao.nivel.charAt(0).toUpperCase() + questao.nivel.slice(1)}`;
  document.getElementById("pergunta").innerText = questao.pergunta;

  let opcoesDiv = document.getElementById("opcoes");
  opcoesDiv.innerHTML = "";
  questao.alternativas.forEach((op,index)=>{
    let div = document.createElement("div");
    div.className = "opcao";
    div.innerText = String.fromCharCode(65+index)+") "+op;
    div.onclick = ()=>selecionar(div,index);
    opcoesDiv.appendChild(div);
  });

  respostaSelecionada = null;
  document.getElementById("feedback").innerText = "";
  document.getElementById("explicacao").innerText = "";
  document.getElementById("proximaQuestaoBtn").classList.add("hidden");
  document.getElementById("voltarAssuntosBtn").classList.add("hidden");
}

function mostrarExercicio(){
  console.log('mostrarExercicio called');
  document.getElementById("conteudoCard").style.display = "none";
  document.getElementById("exercicioCard").style.display = "block";
  renderQuestao();
}

function selecionar(elemento,index){
  document.querySelectorAll(".opcao").forEach(op=>op.classList.remove("selected"));
  elemento.classList.add("selected");
  respostaSelecionada=index;
}

async function verificar(){
  if(respostaSelecionada===null){
    document.getElementById("feedback").innerText="Escolha uma alternativa.";
    return;
  }

  const questoesAtivas = window.questoesAtivas || [];
  const questaoIndex = window.questaoIndex || 0;
  let questao = questoesAtivas[questaoIndex];
  if(!questao) return;

  let correta = questao.resposta;
  let selecionada = questao.alternativas[respostaSelecionada];
  let feedback = document.getElementById("feedback");
  feedback.innerText = "";
  if(selecionada === correta){
    feedback.innerText = "Resposta correta ✅";
    feedback.style.color = "green";

    registrarQuestaoDoDia();

    const disciplinaAtual = window.disciplinaAtual || "";
    usuarioAtivo.progresso[disciplinaAtual] = (usuarioAtivo.progresso[disciplinaAtual] || 0) + 1;
    usuarioAtivo.xp += 10;
    atualizarStreak();

  } else {
    feedback.innerText = `Resposta incorreta ❌ (Resposta correta: ${correta})`;
    feedback.style.color = "red";
  }

  try {
    if(window.db && usuarioAtivo.id) {
      await updateDoc(doc(window.db, 'usuarios', usuarioAtivo.id), usuarioAtivo);
    }
  } catch(error) {
    console.error("Erro ao atualizar progresso:", error);
  }

  document.getElementById("explicacao").innerText = questao.explicacao || "";
  document.getElementById("voltarAssuntosBtn").classList.remove("hidden");
  if(questaoIndex < questoesAtivas.length - 1){
    document.getElementById("proximaQuestaoBtn").classList.remove("hidden");
  } else {
    document.getElementById("proximaQuestaoBtn").classList.add("hidden");
  }
  atualizarProgresso();
  atualizarXPStreak();
  await atualizarRanking();
}

function proximaQuestao(){
  const questoesAtivas = window.questoesAtivas || [];
  let questaoIndex = window.questaoIndex || 0;
  if(questaoIndex < questoesAtivas.length - 1){
    questaoIndex += 1;
    window.questaoIndex = questaoIndex;
    renderQuestao();
  }
}

export { renderQuestao, mostrarExercicio, selecionar, verificar, proximaQuestao };

// Tornar funções globais
window.mostrarExercicio = mostrarExercicio;
window.verificar = verificar;
window.proximaQuestao = proximaQuestao;
window.selecionar = selecionar;