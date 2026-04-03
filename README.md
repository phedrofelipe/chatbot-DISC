# Chatbot Perfil DISC (IA) 🧠

Uma ferramenta moderna de análise de perfil comportamental baseada no modelo DISC (William Moulton Marston, 1928). O projeto utiliza um questionário interativo no frontend e uma análise inteligente no backend alimentada por Inteligência Artificial (Groq/Llama 3).

## 🚀 Funcionalidades

- **Identificação e Cadastro:** Sistema obrigatório de cadastro (Nome, Email, Setor, Idade, Região) com e-mail como chave única.
- **Persistência de Sessão:** Reconhecimento automático do usuário através de `LocalStorage` e integração com o banco de dados SQLite.
- **Teste Único:** Bloqueio inteligente para que cada usuário realize o teste apenas uma vez, redirecionando para o resultado em acessos futuros.
- **Identificação em Tempo Real:** Nome do usuário exibido no cabeçalho com opção de sair (logout).
- **Questionário DISC:** 10 perguntas estratégicas para identificar traços de Dominância (D), Influência (I), Estabilidade (S) e Conformidade (C).
- **Análise Inteligente (IA):** Integração com a API do Groq (modelo Llama-3.3-70b) para gerar um relatório comportamental detalhado e personalizado.
- **Dashboard Estratégico (Liderança):** Painel que compila os dados de todos os colaboradores e utiliza IA para fornecer uma análise de cultura, riscos e conselhos estratégicos para gestores.
- **Relatório Completo:**
  - **Headline:** Essência do perfil em uma frase.
  - **Descrição:** Parágrafo detalhado sobre o perfil combinado (Primário + Secundário).
  - **Pontos Fortes & Desafios:** Lista de competências e pontos de atenção.
  - **Dicas para Gestores:** Como melhor liderar e se comunicar com este perfil.
  - **Funções Ideais:** Ambientes e cargos onde o perfil mais se destaca.
  - **Insight de Combinação:** Como os traços dominantes interagem entre si.
- **Interface Moderna:** UI responsiva, animações fluidas (Framer Motion) e suporte a Tema Escuro/Claro.
- **Persistência de Dados:** Banco de dados SQLite integrado para armazenamento de usuários e resultados (via TypeORM).

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React + TypeScript + Vite**
- **Framer Motion:** Animações de transição e interface.
- **Lucide React:** Ícones modernos.
- **Axios:** Comunicação com a API.
- **CSS Variables:** Sistema de temas (Dark/Light).

### Backend
- **NestJS:** Framework robusto para o servidor.
- **TypeORM + SQLite:** Persistência de dados leve e eficiente.
- **Groq API (Llama 3.3):** Processamento de linguagem natural para análise comportamental.
- **ConfigModule:** Gestão de variáveis de ambiente.

---

## 📦 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- NPM ou Yarn
- Uma chave de API do [Groq Cloud](https://console.groq.com/)

### 1. Configuração do Backend
1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz da pasta `backend` (ou edite o existente).
   - Adicione sua chave do Groq:
     ```env
     GROQ_API_KEY=sua_chave_aqui
     ```
4. Inicie o servidor:
   ```bash
   npm run start:dev
   ```
   *O backend estará rodando em `http://localhost:3000`*

### 2. Configuração do Frontend
1. Navegue até a pasta `frontend`:
   ```bash
   cd ../frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie a aplicação:
   ```bash
   npm run dev
   ```
   *O frontend estará rodando em `http://localhost:5173`*

---

## 📂 Estrutura do Projeto

```text
chatbot-perfil/
├── backend/            # API NestJS
│   ├── src/
│   │   ├── analysis/   # Lógica de integração com IA
│   │   ├── users/      # Gestão de usuários e banco de dados
│   │   └── app.module.ts
│   └── db.sqlite       # Banco de dados local
├── frontend/           # Aplicação React
│   ├── src/
│   │   ├── data/       # Questões e constantes DISC
│   │   ├── App.tsx     # Componente principal e lógica do quiz
│   │   └── App.css     # Estilização e temas
└── README.md           # Documentação do projeto
```

---

## 🧠 Sobre o Modelo DISC
O modelo DISC é uma ferramenta de avaliação comportamental que classifica o comportamento humano em quatro estilos principais:
- **D (Dominância):** Ênfase em obter resultados, competitividade e confiança.
- **I (Influência):** Ênfase em influenciar ou persuadir os outros, abertura e relacionamentos.
- **S (Estabilidade):** Ênfase na cooperação, sinceridade e dependência.
- **C (Conformidade):** Ênfase na qualidade e precisão, perícia e competência.

---
Desenvolvido como uma ferramenta de auxílio para RH e Autoconhecimento.
