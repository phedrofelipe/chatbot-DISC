# Chatbot Perfil DISC (IA) 🧠

Uma ferramenta moderna de análise de perfil comportamental baseada no modelo DISC (William Moulton Marston, 1928). O projeto utiliza um questionário interativo no frontend e uma análise inteligente no backend alimentada por Inteligência Artificial (Groq/Llama 3.3).

## 🚀 Funcionalidades

- **Identificação e Cadastro:** Sistema obrigatório de cadastro (Nome, Email, Departamento, Idade, Região) com e-mail como chave única.
- **Persistência de Sessão:** Reconhecimento automático do usuário através de `LocalStorage` e integração com o banco de dados.
- **Teste Único:** Bloqueio inteligente para que cada usuário realize o teste apenas uma vez, redirecionando para o resultado em acessos futuros.
- **Identificação em Tempo Real:** Nome do usuário exibido no cabeçalho com opção de sair (logout).
- **Questionário DISC:** 10 perguntas estratégicas para identificar traços de Dominância (D), Influência (I), Estabilidade (S) e Conformidade (C).
- **Análise Inteligente (IA):** Integração com a API do Groq (modelo Llama-3.3-70b) para gerar um relatório comportamental detalhado e personalizado.
- **Controle de Acesso por Papéis (RBAC):** Quatro níveis — **Administrador** (controle total: usuários, departamentos e colaboradores), **Gestor** (dashboard estratégico de todos os departamentos), **Líder** (dashboard filtrado apenas pelo seu departamento) e **Colaborador** (responde o quiz, sem login).
- **Departamentos:** Cadastro de departamentos usado no formulário do colaborador e como filtro de acesso de Líder/Gestor.
- **Painel Administrativo:** Gestão de usuários (staff), departamentos e colaboradores em um painel simples, acessível apenas pelo Administrador.
- **Dashboard Estratégico (Liderança):** Painel que compila os dados dos colaboradores (globalmente ou por departamento, conforme o papel) com scores reais armazenados no banco de dados para alimentar os gráficos e a análise de cultura da IA.
- **Gestão Autenticada:** Acesso a rotas administrativas protegido por JWT + verificação de papel (RBAC).
- **Exportação de Relatórios (PDF):** Sistema de geração de PDF otimizado com suporte a múltiplas páginas, compressão de imagem e alta fidelidade visual para download dos resultados individuais e do dashboard.
- **Interface Moderna:** UI responsiva, animações fluidas (Framer Motion) e suporte a Tema Escuro/Claro.
- **Infraestrutura:** Containerização completa com Docker, migrations do TypeORM e PostgreSQL como único banco suportado (dev e produção).

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React + TypeScript + Vite**
- **Framer Motion** (Animações) | **Recharts** (Gráficos) | **jsPDF** (PDF)
- **CSS Variables** (Temas Dark/Light)

### Backend
- **NestJS** (Framework) | **TypeORM + PostgreSQL** (Banco de Dados, com migrations)
- **Passport + JWT + RBAC** (Autenticação e controle de papéis)
- **class-validator/class-transformer** (Validação de payloads)
- **Groq API (Llama 3.3)** (IA de Análise)

---

## 📦 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- NPM ou Yarn
- Docker & Docker Compose
- Uma chave de API do [Groq Cloud](https://console.groq.com/)

### 1. Configuração Global
O projeto utiliza um arquivo `.env` centralizado na **raiz** para facilitar a gestão.
1. Na raiz do projeto, copie o exemplo:
   ```bash
   cp .env.example .env
   ```
2. Abra o arquivo `.env` e preencha as variáveis obrigatórias:
   - `GROQ_API_KEY`: Sua chave da API Groq.
   - `JWT_SECRET`: Uma chave forte e aleatória para os tokens JWT.
   - `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`: dados do Administrador inicial, criado automaticamente no primeiro boot do backend (papel `admin`, com acesso total ao Painel Administrativo).
   - `FRONTEND_URL`: origem liberada no CORS (default `http://localhost`).

### 2. Execução com Docker (Recomendado)
Para subir o ambiente completo (Frontend, Backend e PostgreSQL) com um único comando:
```bash
docker-compose up --build
```
*   **Frontend:** `http://localhost`
*   **Backend (API):** `http://localhost:3000`

### 3. Execução Local (Desenvolvimento)
Se preferir rodar os serviços separadamente durante o desenvolvimento, o PostgreSQL é o único banco suportado — suba-o via Docker antes de iniciar o backend local:
```bash
docker-compose up -d db
```

#### Backend
```bash
cd backend
npm install
# Copie o .env da raiz para rodar localmente:
cp ../.env .env
# Aponte DB_HOST=localhost no .env copiado (o db do docker-compose expõe 5432 apenas internamente por padrão;
# publique a porta em docker-compose.yml caso queira acessá-lo fora do Docker).
npm run start:dev
```
As migrations rodam automaticamente ao subir o backend (`migrationsRun: true`), e o Administrador inicial é criado no primeiro boot a partir de `ADMIN_NAME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD`.

#### Frontend
```bash
cd frontend
npm install
npm run dev
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
