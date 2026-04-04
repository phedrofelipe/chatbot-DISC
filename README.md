# Chatbot Perfil DISC (IA) 🧠

Uma ferramenta moderna de análise de perfil comportamental baseada no modelo DISC (William Moulton Marston, 1928). O projeto utiliza um questionário interativo no frontend e uma análise inteligente no backend alimentada por Inteligência Artificial (Groq/Llama 3.3).

## 🚀 Funcionalidades

- **Identificação e Cadastro:** Sistema obrigatório de cadastro (Nome, Email, Setor, Idade, Região) com e-mail como chave única.
- **Persistência de Sessão:** Reconhecimento automático do usuário através de `LocalStorage` e integração com o banco de dados.
- **Teste Único:** Bloqueio inteligente para que cada usuário realize o teste apenas uma vez, redirecionando para o resultado em acessos futuros.
- **Identificação em Tempo Real:** Nome do usuário exibido no cabeçalho com opção de sair (logout).
- **Questionário DISC:** 10 perguntas estratégicas para identificar traços de Dominância (D), Influência (I), Estabilidade (S) e Conformidade (C).
- **Análise Inteligente (IA):** Integração com a API do Groq (modelo Llama-3.3-70b) para gerar um relatório comportamental detalhado e personalizado.
- **Dashboard Estratégico (Liderança):** Painel que compila os dados de todos os colaboradores com alta precisão, utilizando scores reais armazenados no banco de dados para alimentar os gráficos e a análise de cultura da IA.
- **Gestão Autenticada:** Acesso ao Dashboard de Liderança protegido por autenticação JWT (JSON Web Token).
- **Exportação de Relatórios (PDF):** Sistema de geração de PDF otimizado com suporte a múltiplas páginas, compressão de imagem e alta fidelidade visual para download dos resultados individuais e do dashboard.
- **Interface Moderna:** UI responsiva, animações fluidas (Framer Motion) e suporte a Tema Escuro/Claro.
- **Infraestrutura:** Containerização completa com Docker e suporte a PostgreSQL (em ambiente de produção).

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React + TypeScript + Vite**
- **Framer Motion** (Animações) | **Recharts** (Gráficos) | **jsPDF** (PDF)
- **CSS Variables** (Temas Dark/Light)

### Backend
- **NestJS** (Framework) | **TypeORM** (Banco de Dados)
- **Passport + JWT** (Autenticação)
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
   - `JWT_SECRET`: Uma senha forte para os tokens JWT.
   - `ADMIN_EMAIL` e `ADMIN_PASS`: Credenciais para o Dashboard.

### 2. Execução com Docker (Recomendado)
Para subir o ambiente completo (Frontend, Backend e PostgreSQL) com um único comando:
```bash
docker-compose up --build
```
*   **Frontend:** `http://localhost`
*   **Backend (API):** `http://localhost:3000`

### 3. Execução Local (Desenvolvimento)
Se preferir rodar os serviços separadamente durante o desenvolvimento:

#### Backend
```bash
cd backend
npm install
# O backend lerá o .env da raiz automaticamente se estiver configurado no docker
# Para rodar puramente local, copie o .env para a pasta backend:
cp ../.env .env
npm run start:dev
```

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
