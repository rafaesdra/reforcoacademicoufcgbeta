// disciplinas.js - Gerenciamento de disciplinas e assuntos
import { usuarioAtivo } from './user.js';

let dados, indice, respostaSelecionada = null, disciplinaAtual = "", basePath = "";
let questoesAtivas = [];
let questaoIndex = 0;

function construirCaminho(path){
  if(/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("/")) return path;
  return basePath + path;
}

// === DISCIPLINAS DINÂMICAS ===
function carregarDisciplinas(){
  fetch("disciplinas.json")
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
  fetch(indexPath)
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
  });
}

// === CONTEÚDO ===
function abrirAssunto(i, path){
  indice=i;
  // Set onclick immediately
  document.getElementById("btnExercicio").onclick = window.mostrarExercicio;
  fetch(construirCaminho(path))
  .then(res=>res.json())
  .then(assunto=>{
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
    btn.disabled = false;

    questoesAtivas = assunto.questoes || [];
    window.questoesAtivas = questoesAtivas;
    questaoIndex = 0;
    window.questaoIndex = 0;
    document.getElementById("voltarAssuntosBtn").classList.add("hidden");
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
function voltarMenu(){ location.reload(); }

export { dados, indice, respostaSelecionada, disciplinaAtual, basePath, questoesAtivas, questaoIndex, construirCaminho, carregarDisciplinas, carregarDisciplina, abrirAssunto, atualizarProgresso, voltarAssuntos, voltarMenu };

// Tornar funções globais
window.carregarDisciplinas = carregarDisciplinas;
window.carregarDisciplina = carregarDisciplina;
window.abrirAssunto = abrirAssunto;
window.voltarAssuntos = voltarAssuntos;
window.voltarMenu = voltarMenu;