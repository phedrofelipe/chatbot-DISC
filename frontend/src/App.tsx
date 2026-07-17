import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api, authHeaders } from './api';
import { questions } from './data/questions';
import { IntroScreen } from './components/IntroScreen';
import { AuthScreen } from './components/AuthScreen';
import { QuizScreen } from './components/QuizScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultScreen } from './components/ResultScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { StaffLoginScreen } from './components/StaffLoginScreen';
import { AdminPanelScreen } from './components/AdminPanel/AdminPanelScreen';
import type {
  Analysis,
  DashboardData,
  Department,
  Screen,
  StaffSession,
  UserFormData,
} from './types';
import './App.css';

function loadStaffSession(): StaffSession | null {
  const raw = localStorage.getItem('staffSession');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StaffSession;
  } catch {
    return null;
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [loadingMessage, setLoadingMessage] = useState('Analisando seu perfil…');
  const [staffSession, setStaffSession] = useState<StaffSession | null>(loadStaffSession());
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'departments'>('users');
  const [departments, setDepartments] = useState<Department[]>([]);

  const loadingMessages = [
    'Sintonizando com a teoria de Marston...',
    'Processando vetores comportamentais...',
    'A IA está gerando seu relatório personalizado...',
    'Quase lá! Refinando os insights de gestão...',
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (screen === 'loading') {
      let idx = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[idx]);
      }, 3000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const [staffCreds, setStaffCreds] = useState({ email: '', pass: '' });
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState({ D: 0, I: 0, S: 0, C: 0 });
  const [answers, setAnswers] = useState<{ q: string; a: string; type: string }[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userData, setUserData] = useState<UserFormData>({
    nomeCompleto: '',
    email: '',
    departmentId: '',
    idade: '',
    regiao: '',
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const loadDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // Verifica se o usuário já existe ao carregar a página
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      checkExistingUser(savedEmail);
    }
  }, []);

  const checkExistingUser = async (email: string) => {
    try {
      const res = await api.get(`/users/email/${email}`);
      if (res.data) {
        setUserData({
          nomeCompleto: res.data.nomeCompleto,
          email: res.data.email,
          departmentId: res.data.departmentId ? String(res.data.departmentId) : '',
          idade: res.data.idade?.toString() ?? '',
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const startIntro = () => {
    setScreen('auth');
  };

  const startQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !userData.nomeCompleto ||
      !userData.email ||
      !userData.departmentId ||
      !userData.idade ||
      !userData.regiao
    ) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const res = await api.get(`/users/email/${userData.email}`);

      if (res.data) {
        if (res.data.analiseResult) {
          setAnalysis(JSON.parse(res.data.analiseResult));
          setUserData({
            nomeCompleto: res.data.nomeCompleto,
            email: res.data.email,
            departmentId: res.data.departmentId ? String(res.data.departmentId) : '',
            idade: res.data.idade?.toString() ?? '',
            regiao: res.data.regiao,
          });
          localStorage.setItem('userEmail', res.data.email);
          setScreen('result');
          return;
        }
        localStorage.setItem('userEmail', res.data.email);
      } else {
        const userRes = await api.post('/users', {
          nomeCompleto: userData.nomeCompleto,
          email: userData.email,
          departmentId: Number(userData.departmentId),
          idade: parseInt(userData.idade, 10),
          regiao: userData.regiao,
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
      const response = await api.post('/analysis', {
        email: userData.email,
        scores: finalScores,
        answers: finalAnswers,
      });
      setAnalysis(response.data);
      setScreen('result');
    } catch (error) {
      console.error('Erro no processamento:', error);
      setScreen('intro');
      alert('Erro ao processar sua análise. Verifique se o backend está rodando e configurado corretamente.');
    }
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    setUserData({ nomeCompleto: '', email: '', departmentId: '', idade: '', regiao: '' });
    setAnalysis(null);
    setScreen('intro');
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', {
        email: staffCreds.email,
        password: staffCreds.pass,
      });
      const session: StaffSession = {
        token: res.data.access_token,
        role: res.data.role,
        nomeCompleto: res.data.nomeCompleto,
        departmentId: res.data.departmentId,
      };
      setStaffSession(session);
      localStorage.setItem('staffSession', JSON.stringify(session));
      loadDashboard(session.token);
    } catch {
      alert('Credenciais administrativas inválidas');
    }
  };

  const staffLogout = () => {
    setStaffSession(null);
    localStorage.removeItem('staffSession');
    setScreen('intro');
  };

  const loadDashboard = async (token?: string) => {
    const activeToken = token || staffSession?.token;
    if (!activeToken) {
      setScreen('staff-login');
      return;
    }

    setScreen('loading');
    try {
      const res = await api.get('/analysis/dashboard', authHeaders(activeToken));
      setDashboardData(res.data);
      setScreen('dashboard');
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setStaffSession(null);
      localStorage.removeItem('staffSession');
      setScreen('staff-login');
    }
  };

  const downloadPDF = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const previousScreen = screen;
    setScreen('loading');
    setLoadingMessage('Preparando seu PDF...');

    try {
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: theme === 'dark' ? '#0e0f11' : '#f7f5f0',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${fileName}.pdf`);
      setScreen(previousScreen);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF.');
      setScreen(previousScreen);
    }
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
            <button className="btn-logout" onClick={logout}>
              Sair
            </button>
          </div>
        )}
        {staffSession && (screen === 'dashboard' || screen === 'admin-users' || screen === 'admin-departments') && (
          <div className="user-info">
            {staffSession.nomeCompleto} ({staffSession.role})
            <button className="btn-logout" onClick={staffLogout}>
              Sair
            </button>
          </div>
        )}
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'intro' && <IntroScreen onStart={startIntro} />}
        {screen === 'auth' && (
          <AuthScreen
            userData={userData}
            setUserData={setUserData}
            departments={departments}
            onSubmit={startQuiz}
          />
        )}
        {screen === 'quiz' && <QuizScreen currentQ={currentQ} onSelect={selectOption} />}
        {screen === 'loading' && <LoadingScreen message={loadingMessage} />}
        {screen === 'result' && analysis && (
          <ResultScreen
            analysis={analysis}
            scores={scores}
            nomeCompleto={userData.nomeCompleto}
            onDownloadPdf={() => downloadPDF('capture-result', `DISC_${userData.nomeCompleto}`)}
            onExit={() => setScreen('intro')}
          />
        )}
        {screen === 'dashboard' && dashboardData && staffSession && (
          <DashboardScreen
            dashboardData={dashboardData}
            role={staffSession.role}
            token={staffSession.token}
            onOpenAdminPanel={() => {
              setAdminActiveTab('users');
              setScreen('admin-users');
            }}
            onExit={() => setScreen('intro')}
          />
        )}
        {screen === 'staff-login' && (
          <StaffLoginScreen
            creds={staffCreds}
            setCreds={setStaffCreds}
            onSubmit={handleStaffLogin}
            onBack={() => setScreen('intro')}
          />
        )}
        {(screen === 'admin-users' || screen === 'admin-departments') && staffSession && (
          <AdminPanelScreen
            activeTab={adminActiveTab}
            onChangeTab={(tab) => {
              setAdminActiveTab(tab);
              setScreen(tab === 'users' ? 'admin-users' : 'admin-departments');
            }}
            token={staffSession.token}
            onBack={() => setScreen('dashboard')}
            onDepartmentsChanged={loadDepartments}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
