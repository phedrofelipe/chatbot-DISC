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
- **Gestão Autenticada:** Acesso ao Dashboard de Liderança protegido por autenticação JWT (JSON Web Token).
- **Relatório Completo:**
  - **Headline:** Essência do perfil em uma frase.
  - **Descrição:** Parágrafo detalhado sobre o perfil combinado (Primário + Secundário).
  - **Pontos Fortes & Desafios:** Lista de competências e pontos de atenção.
  - **Dicas para Gestores:** Como melhor liderar e se comunicar com este perfil.
  - **Funções Ideais:** Ambientes e cargos onde o perfil mais se destaca.
  - **Insight de Combinação:** Como os traços dominantes interagem entre si.
- **Visualização de Dados:** Gráficos interativos (Recharts) no dashboard organizacional.
- **Exportação de Relatórios:** Download dos resultados individuais e do dashboard em PDF.
- **Interface Moderna:** UI responsiva, animações fluidas (Framer Motion) e suporte a Tema Escuro/Claro.
- **Infraestrutura:** Containerização completa com Docker e suporte a PostgreSQL (em ambiente de produção).
- **Persistência de Dados:** Banco de dados SQLite integrado para desenvolvimento e PostgreSQL para produção via TypeORM.

---

## 📈 Roadmap de Melhorias Profissionais

1.  **Refatoração e Limpeza:** Remoção de placeholders de código e otimização do build.
2.  **Testes Automatizados:** Implementação de testes unitários (Jest) para garantir a estabilidade do sistema.
3.  **Performance:** Otimização do carregamento e redução do bundle size do frontend.
4.  **Internacionalização (i18n):** Suporte nativo para múltiplos idiomas.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React + TypeScript + Vite**
- **Framer Motion:** Animações de transição e interface.
- **Lucide React:** Ícones modernos.
- **Axios:** Comunicação com a API.
- **Recharts:** Visualização de dados estatísticos.
- **jsPDF + html2canvas:** Geração de relatórios em PDF.
- **CSS Variables:** Sistema de temas (Dark/Light).

### Backend
- **NestJS:** Framework robusto para o servidor.
- **TypeORM:** ORM para gestão de bancos SQL (SQLite/PostgreSQL).
- **Passport + JWT:** Sistema de autenticação seguro.
- **Groq API (Llama 3.3):** Processamento de linguagem natural para análise comportamental.
- **ConfigModule:** Gestão de variáveis de ambiente.

---

## 📦 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- NPM ou Yarn
- Docker & Docker Compose (Opcional)
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
   - Crie um arquivo `.env` na raiz da pasta `backend`.
   - Utilize o `.env.example` na raiz do projeto como referência.
   - Adicione sua chave do Groq e o segredo JWT.
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

### 3. Execução com Docker (Recomendado)
Para subir o ambiente completo (Frontend, Backend e PostgreSQL):
1. Copie o `.env.example` para `.env` na raiz do projeto.
2. Edite o arquivo `.env` com sua `GROQ_API_KEY` e outras configurações.
3. Execute o Docker Compose:
   ```bash
   docker-compose up --build
   ```
   *O frontend estará disponível em `http://localhost`, o backend em `http://localhost:3000` e o banco PostgreSQL em `5432`.*

---

## 🧠 Sobre o Modelo DISC
O modelo DISC é uma ferramenta de avaliação comportamental que classifica o comportamento humano em quatro estilos principais:
- **D (Dominância):** Ênfase em obter resultados, competitividade e confiança.
- **I (Influência):** Ênfase em influenciar ou persuadir os outros, abertura e relacionamentos.
- **S (Estabilidade):** Ênfase na cooperação, sinceridade e dependência.
- **C (Conformidade):** Ênfase na qualidade e precisão, perícia e competência.

---
Desenvolvido como uma ferramenta de auxílio para RH e Autoconhecimento.
