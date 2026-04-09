# Reforço Acadêmico UFCG

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/rafaesdra/reforcoacademicoufcgbeta)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Uma plataforma web interativa de reforço acadêmico desenvolvida especificamente para estudantes de Engenharia da Universidade Federal de Campina Grande (UFCG). O projeto oferece exercícios, conteúdos teóricos e acompanhamento de progresso em diversas disciplinas do curso de Engenharia.

## 🚀 Funcionalidades

### 📚 Disciplinas Disponíveis
- **Pré-Cálculo**: Fundamentos matemáticos essenciais
- **Cálculo I**: Limites, derivadas e integrais
- **Cálculo II**: Técnicas de integração e séries
- **Álgebra Linear**: Vetores, matrizes e transformações lineares
- **Álgebra Vetorial**: Geometria analítica e espaços vetoriais
- **Física 1**: Mecânica clássica
- **Física 2**: Eletromagnetismo e ondas

### 🎯 Recursos Principais
- **Sistema de Autenticação**: Login seguro com Firebase Auth
- **Ranking de Usuários**: Competição saudável entre estudantes
- **Acompanhamento de Progresso**: XP e níveis por disciplina
- **Exercícios Interativos**: Questões com feedback imediato
- **Interface Responsiva**: Compatível com desktop e mobile
- **Conteúdo Estruturado**: Assuntos organizados por dificuldade

### 📊 Dashboard
- Visualização de progresso por disciplina
- Ranking global de usuários
- Estatísticas pessoais (XP, nível, posição)
- Navegação intuitiva entre conteúdos

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica da aplicação
- **CSS3 + Tailwind CSS**: Estilização moderna e responsiva
- **JavaScript (ES6+)**: Lógica de aplicação com módulos
- **Font Awesome**: Ícones vetoriais

### Backend & Banco de Dados
- **Firebase Authentication**: Sistema de login e registro
- **Firestore**: Banco de dados NoSQL para usuários e progresso
- **Firebase Analytics**: Acompanhamento de uso

### Ferramentas de Desenvolvimento
- **Tailwind CSS**: Framework CSS utilitário
- **NPM**: Gerenciamento de dependências
- **ESLint**: Padronização de código JavaScript

## 📁 Estrutura do Projeto

```
reforcoacademicoufcgbeta-main/
├── index.html                 # Página principal da aplicação
├── main.js                    # Inicialização e configuração Firebase
├── user.js                    # Gerenciamento de usuários e ranking
├── disciplinas.js             # Lógica de disciplinas e navegação
├── exercicios.js              # Sistema de exercícios e questões
├── styles.css                 # Estilos compilados (Tailwind)
├── tailwind.config.js         # Configuração Tailwind CSS
├── package.json               # Dependências e scripts
├── disciplinas.json           # Configuração das disciplinas
├── README.md                  # Este arquivo
├── logo.png                   # Logo da aplicação
└── [disciplinas]/             # Conteúdo específico por disciplina
    ├── pre-calculo/
    ├── calculo1/
    ├── calculo2/
    ├── algebra-linear/
    ├── algebra-vetorial/
    ├── fisica1/
    └── fisica2/
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 14 ou superior)
- Navegador web moderno
- Conexão com internet (para Firebase)

### Instalação e Execução

1. **Clone o repositório**
   ```bash
   git clone https://github.com/your-username/reforcoacademicoufcgbeta.git
   cd reforcoacademicoufcgbeta
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Compile os estilos CSS**
   ```bash
   npm run build:css
   ```

4. **Para desenvolvimento (watch mode)**
   ```bash
   npm run watch:css
   ```

5. **Execute a aplicação**
   - Abra `index.html` diretamente no navegador, ou
   - Use um servidor local:
     ```bash
     python -m http.server 8000
     ```
     Acesse: `http://localhost:8000`

## 🔧 Configuração do Firebase

Para configurar o Firebase em seu ambiente:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication e Firestore
3. Configure as regras de segurança do Firestore
4. Atualize as credenciais em `main.js`

## 📖 Como Usar

1. **Registro/Login**: Crie uma conta ou faça login
2. **Seleção de Disciplina**: Escolha a disciplina desejada
3. **Navegação por Assuntos**: Explore os tópicos disponíveis
4. **Exercícios**: Responda questões e ganhe XP
5. **Acompanhamento**: Monitore seu progresso no dashboard

## 🤝 Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes de Contribuição
- Siga os padrões de código existentes
- Adicione testes quando possível
- Atualize a documentação conforme necessário
- Mantenha commits pequenos e descritivos

## 📝 Adicionando Novo Conteúdo

### Nova Disciplina
1. Crie uma pasta em `[disciplinas]/`
2. Adicione arquivos JSON com conteúdo teórico
3. Atualize `disciplinas.json` com a nova disciplina
4. Teste a integração com a interface

### Novo Exercício
1. Adicione questões ao arquivo JSON da disciplina
2. Siga o formato existente de questões
3. Teste a funcionalidade de resposta

## 🐛 Reportando Problemas

Para reportar bugs ou solicitar features:

1. Verifique se o problema já foi reportado
2. Use o template de issue apropriado
3. Forneça detalhes completos:
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Ambiente (navegador, SO, etc.)
   - Logs de erro (se aplicável)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvimento**: Soares, Kogiso, Holanda. 
- **Orientação**: UFCG - Universidade Federal de Campina Grande
- **Colaboradores**: Comunidade acadêmica

## 🙏 Agradecimentos

- Universidade Federal de Campina Grande (UFCG)
- Comunidade de estudantes de Engenharia
- Firebase por fornecer infraestrutura gratuita
- Tailwind CSS pela excelente ferramenta de estilização

---

**Nota**: Este projeto foi desenvolvido como ferramenta educacional e não substitui o acompanhamento acadêmico oficial da UFCG.
