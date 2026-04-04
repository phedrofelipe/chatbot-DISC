import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { questions, DISC_NAMES, DISC_FULL } from './data/questions';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type Screen = 'intro' | 'auth' | 'quiz' | 'loading' | 'result' | 'dashboard' | 'admin-login';
interface DashboardData {
  totalUsers: number;
  sectorDistribution: Record<string, number>;
  discDistribution: { name: string; value: number }[];
  sectorData: { name: string; value: number }[];
  analysis: {
    culture_summary: string;
    leadership_focus: string[];
    strategic_advice: string;
    potential_risks: string;
    growth_opportunities: string;
  };
}

interface Analysis {
  headline: string;
  description: string;
  strengths: string[];
  challenges: string[];
  management_tips: string[];
  ideal_roles: string;
  combo_insight: string;
}

const SECTORS = ['TI', 'RH', 'Processos', 'Administrativo', 'Operações'];
const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
function App() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [loadingMessage, setLoadingMessage] = useState('Analisando seu perfil…');
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('adminToken'));

  const loadingMessages = [
    'Sintonizando com a teoria de Marston...',
    'Processando vetores comportamentais...',
    'A IA está gerando seu relatório personalizado...',
    'Quase lá! Refinando os insights de gestão...',
  ];

  useEffect(() => {
    let interval: any;
    if (screen === 'loading') {
      let idx = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[idx]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [screen]);

  const [adminCreds, setAdminCreds] = useState({ email: '', pass: '' });
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState({ D: 0, I: 0, S: 0, C: 0 });
  const [answers, setAnswers] = useState<{ q: string; a: string; type: string }[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userData, setUserData] = useState({
    nomeCompleto: '',
    email: '',
    setor: '',
    idade: '',
    regiao: '',
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  // Verifica se o usuário já existe ao carregar a página
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      checkExistingUser(savedEmail);
    }
  }, []);

  const checkExistingUser = async (email: string) => {
    try {
      const res = await axios.get(`${API_URL}/users/email/${email}`);
      if (res.data) {
        setUserData({
          nomeCompleto: res.data.nomeCompleto,
          email: res.data.email,
          setor: res.data.setor,
          idade: res.data.idade.toString(),
          regiao: res.data.regiao,
        });
        
        if (res.data.analiseResult) {
          setAnalysis(JSON.parse(res.data.analiseResult));
          setScreen('result');
        } else {
          setScreen('quiz');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
    }
  };

  // Aplica o tema globalmente no elemento raiz
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Embaralha as opções toda vez que a pergunta muda
  const shuffledOptions = useMemo(() => {
    if (screen !== 'quiz') return [];
    return [...questions[currentQ].opts].sort(() => Math.random() - 0.5);
  }, [currentQ, screen]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const startIntro = () => {
    setScreen('auth');
  };

  const startQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.nomeCompleto || !userData.email || !userData.setor || !userData.idade || !userData.regiao) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      // Verifica se o e-mail já existe
      const res = await axios.get(`${API_URL}/users/email/${userData.email}`);
      
      if (res.data) {
        if (res.data.analiseResult) {
          setAnalysis(JSON.parse(res.data.analiseResult));
          setUserData({
            nomeCompleto: res.data.nomeCompleto,
            email: res.data.email,
            setor: res.data.setor,
            idade: res.data.idade.toString(),
            regiao: res.data.regiao,
          });
          localStorage.setItem('userEmail', res.data.email);
          setScreen('result');
          return;
        }
        // Se existe mas não tem análise, continua para o quiz
        localStorage.setItem('userEmail', res.data.email);
      } else {
        // Se não existe, cria o usuário agora
        const userRes = await axios.post(`${API_URL}/users`, {
          ...userData,
          idade: parseInt(userData.idade),
        });
        localStorage.setItem('userEmail', userRes.data.email);
      }

      setScreen('quiz');
      setCurrentQ(0);
      setScores({ D: 0, I: 0, S: 0, C: 0 });
      setAnswers([]);
    } catch (error) {
      console.error('Erro na autenticação:', error);
      alert('Erro ao processar dados do usuário.');
    }
  };

  const selectOption = (type: 'D' | 'I' | 'S' | 'C', text: string) => {
    const newScores = { ...scores, [type]: scores[type] + 1 };
    const newAnswers = [...answers, { q: questions[currentQ].text, a: text, type }];
    
    setScores(newScores);
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      generateResult(newScores, newAnswers);
    }
  };

  const generateResult = async (finalScores: typeof scores, finalAnswers: typeof answers) => {
    setScreen('loading');
    try {
      // Gerar análise via IA - Agora o backend valida o usuário e salva o resultado (Item 1 & 6)
      const response = await axios.post(`${API_URL}/analysis`, {
        email: userData.email,
        scores: finalScores,
        answers: finalAnswers,
      });
      const analysisResult = response.data;

      setAnalysis(analysisResult);
      setScreen('result');
    } catch (error) {
      console.error('Erro no processamento:', error);
      setScreen('intro');
      alert('Erro ao processar sua análise. Verifique se o backend está rodando e configurado corretamente.');
    }
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    setUserData({
      nomeCompleto: '',
      email: '',
      setor: '',
      idade: '',
      regiao: '',
    });
    setAnalysis(null);
    setScreen('intro');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, adminCreds);
      const token = res.data.access_token;
      setAdminToken(token);
      localStorage.setItem('adminToken', token);
      loadDashboard(token);
    } catch (error) {
      alert('Credenciais administrativas inválidas');
    }
  };

  const loadDashboard = async (token?: string) => {
    const activeToken = token || adminToken;
    if (!activeToken) {
      setScreen('admin-login');
      return;
    }

    setScreen('loading');
    try {
      const res = await axios.get(`${API_URL}/analysis/dashboard`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      setDashboardData(res.data);
      setScreen('dashboard');
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      // Se o token expirou, limpa e pede login
      setAdminToken(null);
      localStorage.removeItem('adminToken');
      setScreen('admin-login');
    }
  };

  const downloadPDF = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    setScreen('loading');
    setLoadingMessage('Preparando seu PDF...');

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: theme === 'dark' ? '#0e0f11' : '#f7f5f0',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
      setScreen(elementId === 'capture-result' ? 'result' : 'dashboard');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF.');
      setScreen(elementId === 'capture-result' ? 'result' : 'dashboard');
    }
  };

  const renderAdminLogin = () => (
    <motion.div
      className="auth"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="auth-card">
        <h2>Acesso Administrativo</h2>
        <p>Apenas para gestores autorizados.</p>
        <form onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label>Email Admin</label>
            <input
              type="email"
              required
              value={adminCreds.email}
              onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              required
              value={adminCreds.pass}
              onChange={(e) => setAdminCreds({ ...adminCreds, pass: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-auth">
            Acessar Dashboard →
          </button>
          <button type="button" className="btn-restart" style={{ marginTop: '10px' }} onClick={() => setScreen('intro')}>
            Voltar
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderIntro = () => (
    <motion.div
      className="intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="badge">🧠 Baseado em William Moulton Marston · 1928</div>
      <h1>
        Descubra seu
        <br />
        <em>perfil comportamental</em>
      </h1>
      <p>
        10 perguntas de múltipla escolha para identificar seu tipo DISC dominante e secundário, com
        análise de pontos fortes, desafios e dicas de gestão.
      </p>
      <div className="disc-preview">
        <span className="disc-pill D">D · Executor</span>
        <span className="disc-pill I">I · Comunicador</span>
        <span className="disc-pill S">S · Planejador</span>
        <span className="disc-pill C">C · Analista</span>
      </div>
      <button className="btn-start" onClick={startIntro}>
        Começar agora →
      </button>
    </motion.div>
  );

  const renderAuth = () => (
    <motion.div
      className="auth"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="auth-card">
        <h2>Identificação</h2>
        <p>Preencha os dados abaixo para iniciar sua avaliação personalizada.</p>
        <form onSubmit={startQuiz}>
          <div className="form-group">
            <label>Nome Completo</label>
            <input
              type="text"
              required
              placeholder="Ex: João Silva"
              value={userData.nomeCompleto}
              onChange={(e) => setUserData({ ...userData, nomeCompleto: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            />
          </div>
          <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Idade</label>
              <input
                type="number"
                required
                min="14"
                max="100"
                placeholder="Idade"
                value={userData.idade}
                onChange={(e) => setUserData({ ...userData, idade: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Região</label>
              <select
                required
                value={userData.regiao}
                onChange={(e) => setUserData({ ...userData, regiao: e.target.value })}
              >
                <option value="">Selecione...</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Setor de Atuação</label>
            <select
              required
              value={userData.setor}
              onChange={(e) => setUserData({ ...userData, setor: e.target.value })}
            >
              <option value="">Selecione seu setor...</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-auth">
            Iniciar Quiz →
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderQuiz = () => {
    const q = questions[currentQ];
    const pct = Math.round((currentQ / questions.length) * 100);

    return (
      <motion.div
        className="quiz"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        key={currentQ}
      >
        <div className="quiz-header">
          <div className="quiz-progress-info">
            <span>
              Pergunta {currentQ + 1} de {questions.length}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }}></div>
          </div>
        </div>

        <div className="question-card">
          <div className="question-num">Pergunta {currentQ + 1}</div>
          <div className="question-text">{q.text}</div>
          <div className="options-grid">
            {shuffledOptions.map((opt, i) => (
              <button
                key={i}
                className="option-btn"
                onClick={() => selectOption(opt.type as any, opt.text)}
              >
                <span className="opt-label">{String.fromCharCode(65 + i)}</span>
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLoading = () => (
    <div className="loading">
      <div className="loading-orb"></div>
      <h3>{loadingMessage}</h3>
      <p>
        A IA está processando suas respostas e gerando um relatório personalizado com base no modelo
        DISC de Marston.
      </p>
    </div>
  );

  const renderResult = () => {
    if (!analysis) return null;
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [primary, secondary] = sorted;
    const colors = { D: 'var(--D)', I: 'var(--I)', S: 'var(--S)', C: 'var(--C)' };
    const icons = { D: '⚡', I: '✨', S: '🌿', C: '🔍' };
    const bgIcons = { D: 'var(--D-bg)', I: 'var(--I-bg)', S: 'var(--S-bg)', C: 'var(--C-bg)' };

    return (
      <motion.div className="result" id="capture-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="result-header">
          <div className="result-badge">Análise DISC Completa para {userData.nomeCompleto}</div>
          <div
            className="result-title"
            style={{ color: colors[primary[0] as keyof typeof colors] }}
          >
            {analysis.headline}
          </div>
          <div className="result-subtitle">
            Perfil {primary[0]}
            {secondary[0]} · {DISC_FULL[primary[0] as keyof typeof DISC_FULL]} +{' '}
            {DISC_FULL[secondary[0] as keyof typeof DISC_FULL]}
          </div>
        </div>

        <div className="score-grid">
          {sorted.map(([type, score], idx) => {
            const pct = Math.round((score / total) * 100);
            return (
              <div key={type} className={`score-card ${type} ${idx === 0 ? 'primary' : ''}`}>
                {idx === 0 && <span className="primary-crown">1º</span>}
                {idx === 1 && (
                  <span className="primary-crown" style={{ background: '#888' }}>
                    2º
                  </span>
                )}
                <div className="type-letter">{type}</div>
                <div className="type-name">{DISC_NAMES[type as keyof typeof DISC_NAMES]}</div>
                <div className="score-bar-wrap">
                  <div className="score-bar-fill" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="score-pct">{pct}%</div>
              </div>
            );
          })}
        </div>

        <div className="profile-section">
          <h3>
            <span
              className="icon"
              style={{ background: bgIcons[primary[0] as keyof typeof bgIcons], fontSize: '16px' }}
            >
              {icons[primary[0] as keyof typeof icons]}
            </span>
            Sobre este perfil
          </h3>
          <p>{analysis.description}</p>
        </div>

        <div className="profile-section">
          <h3>
            <span className="icon strengths-icon">💪</span> Pontos fortes
          </h3>
          <ul>
            {analysis.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="profile-section">
          <h3>
            <span className="icon weaknesses-icon">⚠️</span> Pontos de atenção
          </h3>
          <ul>
            {analysis.challenges.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="profile-section">
          <h3>
            <span className="icon combo-icon">🔗</span> Combinação {primary[0]}+{secondary[0]}
          </h3>
          <p>{analysis.combo_insight}</p>
        </div>

        <div className="profile-section">
          <h3>
            <span className="icon tips-icon">🎯</span> Dicas para o gestor
          </h3>
          <ul>
            {analysis.management_tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        <div className="profile-section">
          <h3>
            <span className="icon" style={{ background: 'rgba(168, 198, 240, 0.1)' }}>
              🏢
            </span>{' '}
            Funções ideais
          </h3>
          <p>{analysis.ideal_roles}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-restart" style={{ flex: 1 }} onClick={() => downloadPDF('capture-result', `DISC_${userData.nomeCompleto}`)}>
            📥 Baixar Relatório (PDF)
          </button>
          <button className="btn-restart" style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)' }} onClick={() => setScreen('intro')}>
            Sair
          </button>
        </div>
      </motion.div>
    );
  };

  const renderDashboard = () => {
    if (!dashboardData) return null;

    const DISC_COLORS = ['#c0392b', '#d4860b', '#27794a', '#1e5fa8'];

    return (
      <motion.div className="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="result-header">
          <div className="result-badge">Painel Estratégico de Liderança</div>
          <div className="result-title" style={{ color: 'var(--text)' }}>
            Visão Geral da Cultura
          </div>
          <div className="result-subtitle">
            Análise baseada em {dashboardData.totalUsers} colaboradores mapeados
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{dashboardData.totalUsers}</div>
            <div className="stat-label">Total de Colaboradores</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Object.keys(dashboardData.sectorDistribution).length}</div>
            <div className="stat-label">Setores Mapeados</div>
          </div>
        </div>

        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="profile-section" style={{ height: '350px' }}>
            <h3>Distribuição DISC</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.discDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {dashboardData.discDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DISC_COLORS[index % DISC_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="profile-section" style={{ height: '350px' }}>
            <h3>Colaboradores por Setor</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.sectorData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--text)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="profile-section main-analysis">
          <h3>
            <span className="icon" style={{ background: 'rgba(168, 198, 240, 0.1)' }}>
              📊
            </span>
            Resumo da Cultura
          </h3>
          <p>{dashboardData.analysis.culture_summary}</p>
        </div>

        <div className="dashboard-grid">
          <div className="profile-section">
            <h3>
              <span className="icon tips-icon">🎯</span> Foco da Liderança
            </h3>
            <ul>
              {dashboardData.analysis.leadership_focus.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          <div className="profile-section">
            <h3>
              <span className="icon strengths-icon">💡</span> Conselhos Estratégicos
            </h3>
            <p>{dashboardData.analysis.strategic_advice}</p>
          </div>

          <div className="profile-section">
            <h3>
              <span className="icon weaknesses-icon">⚠️</span> Riscos Potenciais
            </h3>
            <p>{dashboardData.analysis.potential_risks}</p>
          </div>

          <div className="profile-section">
            <h3>
              <span className="icon combo-icon">🚀</span> Oportunidades de Crescimento
            </h3>
            <p>{dashboardData.analysis.growth_opportunities}</p>
          </div>
        </div>

        <button className="btn-restart" onClick={() => setScreen('intro')}>
          Voltar para Início
        </button>
      </motion.div>
    );
  };

  return (
    <div className="container" data-theme={theme}>
      <div className="top-bar">
        {screen === 'intro' && (
          <button className="btn-dashboard-entry" onClick={() => loadDashboard()}>
            📊 Dashboard
          </button>
        )}
        {userData.nomeCompleto && (
          <div className="user-info">
            Olá, <strong>{userData.nomeCompleto}</strong>
            <button className="btn-logout" onClick={logout}>Sair</button>
          </div>
        )}
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'intro' && renderIntro()}
        {screen === 'auth' && renderAuth()}
        {screen === 'quiz' && renderQuiz()}
        {screen === 'loading' && renderLoading()}
        {screen === 'result' && renderResult()}
        {screen === 'dashboard' && renderDashboard()}
        {screen === 'admin-login' && renderAdminLogin()}
      </AnimatePresence>
    </div>
  );
}

export default App;
