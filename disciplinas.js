// disciplinas.js - Gerenciamento de disciplinas e assuntos
import { usuarioAtivo } from './user.js';

let dados, indice, respostaSelecionada = null, disciplinaAtual = "", basePath = "";
let questoesAtivas = [];
let questaoIndex = 0;

function criarChaveQuestao(assuntoId, questaoId){
  return `${assuntoId}|${questaoId}`;
}

function construirCaminho(path){
  if(/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("/")) return path;
  return basePath + path;
}

// === PROGRESSO ===
function obterProgressoTopico(disciplina, assuntoId){
  if (!usuarioAtivo.progressoTopicos) usuarioAtivo.progressoTopicos = {};
  if (!usuarioAtivo.progressoTopicos[disciplina]) usuarioAtivo.progressoTopicos[disciplina] = {};
  if (!usuarioAtivo.progressoTopicos[disciplina][assuntoId]) {
    usuarioAtivo.progressoTopicos[disciplina][assuntoId] = {
      respondidas: 0,
      acertos: 0,
      erros: 0,
      total: 5,
      concluido: false
    };
  }
  return usuarioAtivo.progressoTopicos[disciplina][assuntoId];
}


// === DISCIPLINAS DINÂMICAS ===
function carregarDisciplinas(){
  fetch(encodeURI("disciplinas.json"))
  .then(res=>res.json())
  .then(data=>{
    let container = document.getElementById("disciplinasContainer");
    if(container) {
      container.innerHTML="";
      data.disciplinas.forEach(d=>{
        let btn = document.createElement("button");
        btn.innerText = d.nome;
        btn.className="disciplinaBtn";
        btn.onclick=()=>carregarDisciplina(d.path);
        container.appendChild(btn);
      });
    }
  })
  .catch(error=>{
    console.error("Erro ao carregar disciplinas:", error);
  });
}

// === DISCIPLINA ===
const frases=["Continue estudando, cada passo conta.","Grandes engenheiros foram persistentes.","Você está mais perto de entender matemática.","Aprender cálculo é como treinar um músculo.","Não desista, o esforço vale a pena."];

function motivacao(){ document.getElementById("motivacao").innerText = frases[Math.floor(Math.random()*frases.length)]; }

function carregarDisciplina(indexPath){
  fetch(encodeURI(indexPath))
  .then(res=>res.json())
  .then(data=>{
    disciplinaAtual = indexPath;
    window.disciplinaAtual = disciplinaAtual;
    basePath = indexPath.includes("/") ? indexPath.substring(0, indexPath.lastIndexOf("/") + 1) : "";
    dados = data;
    document.getElementById("menuCard").style.display = "none";
    document.getElementById("assuntosCard").style.display = "block";
    document.getElementById("disciplinaTitulo").innerText = data.disciplina;

    let lista=document.getElementById("listaAssuntos");
    lista.innerHTML="";
    data.assuntos.forEach((assunto, index) => {
  const assuntoId = assunto.path;
  const progresso = obterProgressoTopico(indexPath, assuntoId);

  let btn = document.createElement("button");
  btn.className = "assuntoBtn blocoAssunto";
  btn.onclick = () => abrirAssunto(index, assunto.path);

  const total = progresso.total || 5;
const acertos = progresso.acertos || 0;
const erros = progresso.erros || 0;
const respondidas = progresso.respondidas || 0;
const restantes = Math.max(0, total - respondidas);

const larguraVerde = (acertos / total) * 100;
const larguraVermelha = (erros / total) * 100;
const larguraBranca = (restantes / total) * 100;

console.log(assunto.titulo, progresso);

btn.innerHTML = `
  <div class="flex justify-between items-center mb-2">
    <span class="font-semibold text-left">${assunto.titulo}</span>
    <span class="text-sm font-bold">${acertos}/${total}</span>
  </div>

  <div style="
    width: 100%;
    height: 16px;
    display: flex;
    border: 1px solid #d1d5db;
    border-radius: 9999px;
    overflow: hidden;
    background: white;
  ">
    <div style="width:${larguraVerde}%; background:#22c55e;"></div>
    <div style="width:${larguraVermelha}%; background:#ef4444;"></div>
    <div style="width:${larguraBranca}%; background:#ffffff;"></div>
  </div>
`;

  lista.appendChild(btn);
});
    motivacao();
    atualizarProgresso();
  })
  .catch(error=>{
    console.error("Erro ao carregar disciplina:", error);
    alert("Não foi possível carregar a disciplina. Verifique o console para mais detalhes.");
  });
}

// === CONTEÚDO ===
function abrirAssunto(i, path){
  indice=i;
  // Set onclick immediately
  document.getElementById("btnExercicio").onclick = window.mostrarExercicio;
  fetch(encodeURI(construirCaminho(path)))
  .then(res=>res.json())
  .then(assunto=>{
    const assuntoId = path;
    const respondidasRaw = usuarioAtivo && usuarioAtivo.questoesRespondidas;
    const respondidasList = Array.isArray(respondidasRaw) ? respondidasRaw : Object.values(respondidasRaw || {});
    const respondidas = new Set(respondidasList);
    questoesAtivas = (assunto.questoes || []).filter(q => !respondidas.has(criarChaveQuestao(assuntoId, q.id)));
    window.questoesAtivas = questoesAtivas;
    window.assuntoId = assuntoId;

    document.getElementById("assuntosCard").style.display = "none";
    document.getElementById("conteudoCard").style.display = "block";

    document.getElementById("tema").innerText = assunto.assunto || assunto.titulo;
    let teoria = assunto.teoria || assunto;
    let aplicacoes = teoria.aplicacoes ? "\n\nAplicações:\n" + teoria.aplicacoes.map(a => "- " + a).join("\n") : "";
    let erros = teoria.erros_comuns ? "\n\nErros Comuns:\n" + teoria.erros_comuns.map(e => "- " + e).join("\n") : "";
    let dica = teoria.dica_pratica ? "\n\nDica: " + teoria.dica_pratica : "";
    let conteudo = `${teoria.resumo || ""}\n\n${teoria.explicacao || ""}\n\nIntuição: ${teoria.intuicao || ""}${dica}${aplicacoes}${erros}`;
    document.getElementById("conteudo").innerText = conteudo;

    let btn = document.getElementById("btnExercicio");
    if(questoesAtivas.length === 0){
      btn.disabled = true;
      btn.innerText = "Nenhuma questão nova disponível";
    } else {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-play mr-2"></i>Ir para exercício';
    }

    questaoIndex = 0;
    window.questaoIndex = 0;
    document.getElementById("voltarAssuntosBtn").classList.add("hidden");
  })
  .catch(error=>{
    console.error("Erro ao abrir assunto:", error);
    alert("Não foi possível carregar o assunto. Verifique o console para mais detalhes.");
  });
}

function atualizarProgresso(){
  if (!dados || !dados.assuntos) return;

  const progressoDisciplina = usuarioAtivo.progressoTopicos?.[disciplinaAtual] || {};
  const totalTopicos = dados.assuntos.length;

  let topicosConcluidos = 0;

  dados.assuntos.forEach(assunto => {
    const assuntoId = assunto.path;
    const p = progressoDisciplina[assuntoId];
    if (p && p.concluido) topicosConcluidos++;
  });

  const porcentagem = totalTopicos > 0 ? (topicosConcluidos / totalTopicos) * 100 : 0;

  document.getElementById("progressBar").style.width = porcentagem + "%";

  let contador = document.getElementById("contadorTopicos");
  if (!contador) {
    contador = document.createElement("div");
    contador.id = "contadorTopicos";
    contador.className = "text-sm text-gray-700 font-semibold text-right mb-4";
    document.getElementById("progressBar").parentElement.insertAdjacentElement("afterend", contador);
  }

  contador.innerText = `${topicosConcluidos}/${totalTopicos} tópicos concluídos`;
}

// === VOLTAR / MENU ===
function voltarAssuntos(){
  document.getElementById("exercicioCard").style.display = "none";
  document.getElementById("assuntosCard").style.display = "block";
  respostaSelecionada=null;
}
function voltarMenu(){ 
  // Esconder cards de disciplina
  const assuntosCard = document.getElementById("assuntosCard");
  const conteudoCard = document.getElementById("conteudoCard"); 
  const exercicioCard = document.getElementById("exercicioCard");
  
  if (assuntosCard) {
    assuntosCard.classList.add("hidden");
    assuntosCard.style.display = "none";
  }
  if (conteudoCard) {
    conteudoCard.classList.add("hidden");
    conteudoCard.style.display = "none";
  }
  if (exercicioCard) {
    exercicioCard.classList.add("hidden");
    exercicioCard.style.display = "none";
  }
  
  // Mostrar dashboard e menu de disciplinas
  const dashboard = document.getElementById("dashboard");
  const loginCard = document.getElementById("loginCard");
  const menuCard = document.getElementById("menuCard");
  
  if (loginCard) loginCard.style.display = "none";
  if (dashboard) {
    dashboard.classList.remove("hidden");
    dashboard.style.display = "block";
  }
  if (menuCard) {
    menuCard.classList.remove("hidden");
    menuCard.style.display = "block";
  }
  
  // Carregar disciplinas com um pequeno delay para garantir que o DOM está pronto
  setTimeout(() => {
    if (window.carregarDisciplinas) {
      window.carregarDisciplinas();
    }
  }, 100);
}

export { dados, indice, respostaSelecionada, disciplinaAtual, basePath, questoesAtivas, questaoIndex, construirCaminho, carregarDisciplinas, carregarDisciplina, abrirAssunto, atualizarProgresso, voltarAssuntos, voltarMenu };

// Tornar funções globais
window.carregarDisciplinas = carregarDisciplinas;
window.carregarDisciplina = carregarDisciplina;
window.abrirAssunto = abrirAssunto;
window.voltarAssuntos = voltarAssuntos;
window.voltarMenu = voltarMenu;
