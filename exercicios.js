// exercicios.js - Lógica de exercícios e questões
import { usuarioAtivo, atualizarXPStreak, atualizarRanking, atualizarStreak, registrarQuestaoDoDia, atualizarPosicaoUsuario } from './user.js';
import { construirCaminho, atualizarProgresso } from './disciplinas.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';

let respostaSelecionada = null;

function xpPorNivel(nivel){
  switch((nivel || '').toLowerCase()){
    case 'facil': return 5;
    case 'medio': return 10;
    case 'dificil': return 20;
    default: return 10;
  }
}

function renderQuestao(){
  const questoesAtivas = window.questoesAtivas || [];
  const questaoIndex = window.questaoIndex || 0;
  if(!questoesAtivas.length) return;
  let questao = questoesAtivas[questaoIndex];
  document.getElementById("questaoMeta").innerText = `Pergunta ${questaoIndex + 1} de ${questoesAtivas.length} • Nível: ${questao.nivel.charAt(0).toUpperCase() + questao.nivel.slice(1)}`;
  document.getElementById("pergunta").innerText = questao.pergunta;
  document.getElementById("btnConfirmar").disabled = false;

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

  const disciplinaAtual = window.disciplinaAtual || "";
  const assuntoId = window.assuntoId || "";
  const questaoId = questao.id || `${disciplinaAtual}:${questaoIndex}`;
  const questionKey = `${assuntoId}|${questaoId}`;

  if(!usuarioAtivo.progresso) usuarioAtivo.progresso = {};
  if(!usuarioAtivo.acertos) usuarioAtivo.acertos = 0;
  if(!usuarioAtivo.erros) usuarioAtivo.erros = 0;
  if(!usuarioAtivo.questoesRespondidas) usuarioAtivo.questoesRespondidas = [];

  if(usuarioAtivo.questoesRespondidas.includes(questionKey)){
    feedback.innerText = "Você já respondeu esta questão antes. Nenhuma pontuação adicional será registrada.";
    feedback.style.color = "orange";
    document.getElementById("btnConfirmar").disabled = true;
    document.getElementById("voltarAssuntosBtn").classList.remove("hidden");
    document.getElementById("proximaQuestaoBtn").classList.add("hidden");
    return;
  }

  const xpBase = xpPorNivel(questao.nivel);
  let bonus = 0;

  if(selecionada === correta){
    atualizarStreak();
    if(usuarioAtivo.streak >= 3) {
      bonus = 5;
    }

    usuarioAtivo.acertos += 1;
    usuarioAtivo.progresso[disciplinaAtual] = (usuarioAtivo.progresso[disciplinaAtual] || 0) + 1;
    usuarioAtivo.xp += xpBase + bonus;
    usuarioAtivo.questoesRespondidas.push(questionKey);

    registrarQuestaoDoDia();

    feedback.innerText = `Resposta correta ✅ (+${xpBase} XP${bonus ? ` +${bonus} bônus de streak` : ''})`;
    feedback.style.color = "green";
  } else {
    usuarioAtivo.erros += 1;
    usuarioAtivo.questoesRespondidas.push(questionKey);
    feedback.innerText = `Resposta incorreta ❌ (Resposta correta: ${correta})`;
    feedback.style.color = "red";
  }
  document.getElementById("btnConfirmar").disabled = true;

  try {
    if(window.db && usuarioAtivo.id) {
      console.log("Salvando progresso: ID =", usuarioAtivo.id, "XP =", usuarioAtivo.xp);
      const { id, ...usuarioDados } = usuarioAtivo;
      await updateDoc(doc(window.db, 'usuarios', usuarioAtivo.id), usuarioDados);

      // Atualizar o objeto local usuarioAtivo com os dados salvos
      // Isso garante que usuarioAtivo reflita as mudanças mais recentes
      Object.assign(usuarioAtivo, usuarioDados);
      console.log("Progresso salvo: ID ainda é", usuarioAtivo.id, "XP =", usuarioAtivo.xp);
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
    document.getElementById("feedback").innerText += "\nVocê concluiu todas as questões deste assunto.";
  }
  atualizarProgresso();
  atualizarXPStreak();
  await atualizarPosicaoUsuario(); // Atualização mais eficiente da posição
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