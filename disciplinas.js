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
    data.assuntos.forEach((assunto,index)=>{
      let btn = document.createElement("button");
      btn.innerText = assunto.titulo;
      btn.className = "assuntoBtn";
      btn.onclick = ()=>abrirAssunto(index, assunto.path);
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
    const assuntoId = assunto.id || path;
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
  let progresso = usuarioAtivo.progresso[disciplinaAtual] || 0;
  let porcentagem = (progresso/dados.assuntos.length)*100;
  document.getElementById("progressBar").style.width = porcentagem+"%";
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