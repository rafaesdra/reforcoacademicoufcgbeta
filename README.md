# 📚 Reforço Acadêmico UFCG

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/rafaesdra/reforcoacademicoufcgbeta)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-orange.svg)](https://rafaesdra.github.io/reforcoacademicoufcgbeta/)

Uma plataforma web interativa de reforço acadêmico desenvolvida especificamente para estudantes de Engenharia da Universidade Federal de Campina Grande (UFCG). Oferece exercícios, conteúdos teóricos e acompanhamento de progresso em diversas disciplinas do curso de Engenharia.

## 🎯 Demonstração

Acesse a versão online: **[reforcoacademicoufcgbeta.github.io](https://rafaesdra.github.io/reforcoacademicoufcgbeta/)**
**(https://reforcoacademicoufcg.vercel.app/)**
## ✨ Funcionalidades

### 📖 Disciplinas Disponíveis
- **Pré-Cálculo**: Fundamentos matemáticos essenciais
- **Cálculo I**: Limites, derivadas e integrais
- **Cálculo II**: Técnicas de integração e séries
- **Álgebra Linear**: Vetores, matrizes e transformações lineares
- **Álgebra Vetorial**: Geometria analítica e espaços vetoriais
- **Física 1**: Mecânica clássica
- **Física 2**: Eletromagnetismo e ondas
- **Química**: Noções básicas de química

### 🎮 Recursos Principais
- **Sistema de Autenticação Seguro**: Login com email/senha ou Google
- **Ranking de Usuários**: Competição saudável entre estudantes
- **Acompanhamento de Progresso**: XP, níveis e estatísticas por disciplina
- **Exercícios Interativos**: Questões com feedback imediato e explicações
- **Interface Responsiva**: Compatível com desktop, tablet e mobile
- **Conteúdo Estruturado**: Assuntos organizados por dificuldade crescente

### 📊 Dashboard do Usuário
- Visualização de progresso por disciplina com barras de progresso
- Ranking global e histórico de usuários
- Estatísticas pessoais (XP total, sequência de dias, posição)
- Calendário de atividades com metas diárias
- Navegação intuitiva entre conteúdos

## 🛠️ Tecnologias Utilizadas

### 🎨 Frontend
- **HTML5**: Estrutura semântica da aplicação
- **CSS3 + Tailwind CSS**: Estilização moderna e responsiva
- **JavaScript (ES6+)**: Lógica de aplicação com módulos
- **Font Awesome**: Ícones vetoriais

### ☁️ Backend & Banco de Dados
- **Firebase Authentication**: Sistema de login e registro seguro
- **Firestore**: Banco de dados NoSQL para usuários e progresso
- **Firebase Hosting**: Hospedagem via GitHub Pages

### 🛠️ Ferramentas de Desenvolvimento
- **Tailwind CSS**: Framework CSS utilitário
- **NPM**: Gerenciamento de dependências
- **ESLint**: Padronização de código JavaScript
- **Git**: Controle de versão

## 🚀 Como Executar Localmente

### 📋 Pré-requisitos
- Node.js (versão 16 ou superior)
- Navegador web moderno
- Conexão com internet (para Firebase)

### 📦 Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/rafaesdra/reforcoacademicoufcgbeta.git
   cd reforcoacademicoufcgbeta
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute o servidor local:**
   ```bash
   # Opção 1: Usando Python (recomendado)
   python -m http.server 8000

   # Opção 2: Usando Node.js
   npx http-server -p 8000

   # Opção 3: Usando PHP
   php -S localhost:8000
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:8000
   ```

## 🌐 Deploy no GitHub Pages

### Configuração Automática
1. No repositório do GitHub, vá para **Settings** → **Pages**
2. Em **Source**, selecione **Deploy from a branch**
3. Em **Branch**, selecione **main** (ou sua branch principal)
4. Clique em **Save**

### Arquivos de Configuração
O projeto inclui arquivos específicos para GitHub Pages:
- `.nojekyll`: Permite arquivos que começam com underscore
- Estrutura organizada com `pages/` para rotas específicas

### URL do Site
Após o deploy, o site estará disponível em:
```
https://[seu-usuario].github.io/[nome-do-repositorio]/
```

### 🚨 Solução de Problemas
- **Página não carrega**: Verifique se o arquivo `.nojekyll` está na raiz
- **Página de verificação abre primeiro**: Aguarde alguns minutos após o commit
- **Firebase não conecta**: Verifique as configurações no console do Firebase
- **Erro "Sistema ainda carregando"**: Aguarde alguns segundos ou recarregue a página

## 📁 Estrutura do Projeto

```
reforcoacademicoufcgbeta/
├── 📄 index.html                 # Página principal (login/dashboard)
├── 📄 README.md                  # Este arquivo
├── 📄 package.json              # Dependências do projeto
├── 📄 tailwind.config.js        # Configuração do Tailwind CSS
├── 📄 .nojekyll                 # Configuração GitHub Pages
├── 📁 pages/                    # Páginas específicas
│   └── 📄 verificar-email.html  # Página de verificação de email
├── 📁 src/                      # Recursos estáticos
├── 📁 algebra-linear/           # Exercícios de Álgebra Linear
├── 📁 algebra-vetorial/         # Exercícios de Álgebra Vetorial
├── 📁 calculo1/                 # Exercícios de Cálculo I
├── 📁 calculo2/                 # Exercícios de Cálculo II
├── 📁 fisica1/                  # Exercícios de Física I
├── 📁 fisica2/                  # Exercícios de Física II
├── 📁 quimica/                  # Exercícios de Química
├── 📁 pré-calculo/              # Exercícios de Pré-Cálculo
├── 📄 auth.js                   # Utilitários de autenticação
├── 📄 firebase-init.js          # Configuração do Firebase
├── 📄 user.js                   # Gerenciamento de usuários
├── 📄 main.js                   # Inicialização da aplicação
├── 📄 disciplinas.js            # Configuração das disciplinas
├── 📄 exercicios.js             # Lógica dos exercícios
├── 📄 verify-email.js           # Lógica da verificação de email
└── 📄 styles.css                # Estilos customizados
```

## 🔧 Configuração do Firebase

### 1. Criar Projeto no Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar um projeto"
3. Defina um nome para o projeto
4. Ative o Google Analytics (opcional)

### 2. Configurar Authentication
1. No menu lateral, clique em **Authentication**
2. Vá para **Sign-in method**
3. Ative os provedores:
   - **Email/Password**
   - **Google**
4. Configure o domínio autorizado como `localhost` para desenvolvimento

### 3. Configurar Firestore
1. No menu lateral, clique em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Iniciar no modo de teste** (para desenvolvimento)
4. Selecione uma localização para o banco

### 4. Obter Configurações
1. Clique no ícone de engrenagem → **Configurações do projeto**
2. Role para baixo até "Seus apps"
3. Clique em **Adicionar app** → **Web**
4. Copie as configurações do Firebase para `firebase-init.js`

## 🤝 Como Contribuir

### 📝 Passos para Contribuir
1. **Fork** o projeto
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/reforcoacademicoufcgbeta.git`
3. **Crie uma branch** para sua feature: `git checkout -b feature/nova-feature`
4. **Faça suas alterações** e teste localmente
5. **Commit** suas mudanças: `git commit -m 'Adiciona nova feature'`
6. **Push** para o repositório: `git push origin feature/nova-feature`
7. **Abra um Pull Request** no GitHub

### 🐛 Relatando Bugs
- Use as **Issues** do GitHub para reportar bugs
- Inclua passos para reproduzir o problema
- Descreva o comportamento esperado vs. observado
- Adicione screenshots se possível

### 💡 Sugestões de Melhorias
- **Novas disciplinas**: Adicione exercícios em novas pastas seguindo o padrão existente
- **Melhorias na UI**: Sugestões de design e usabilidade
- **Novos recursos**: Ideias para funcionalidades adicionais
- **Correções de conteúdo**: Revisão de exercícios e explicações

## 📊 Status do Projeto

### ✅ Implementado
- Sistema completo de autenticação (email/senha + Google)
- Dashboard com estatísticas e ranking
- 8 disciplinas com exercícios interativos
- Interface responsiva e moderna
- Deploy automático no GitHub Pages

### 🚧 Em Desenvolvimento
- Sistema de conquistas e badges
- Modo offline para exercícios
- Integração com ferramentas educacionais
- Análise de desempenho por assunto

### 📋 Planejado
- Gamificação avançada
- Sistema de tutoria
- Relatórios de progresso para professores
- API para integração com outros sistemas

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Sobre o Projeto

Este projeto foi desenvolvido por estudantes de Engenharia Elétrica da UFCG, com o objetivo de auxiliar colegas na revisão e reforço de conteúdos matemáticos e científicos essenciais para o curso.

### 🎓 Desenvolvedor
**Rafael Silva** - Engenharia Elétrica - UFCG

### 🙏 Agradecimentos
- Universidade Federal de Campina Grande (UFCG)
- Professores e colegas do curso de Engenharia Elétrica
- Comunidade open source

---

**⭐ Se este projeto te ajudou, dê uma estrela no GitHub!**
