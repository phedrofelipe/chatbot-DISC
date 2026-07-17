import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { DashboardData, UserRole } from '../types';
import { CollaboratorProfiles } from './CollaboratorProfiles';

interface DashboardScreenProps {
  dashboardData: DashboardData;
  role: UserRole;
  token: string;
  onOpenAdminPanel: () => void;
  onExit: () => void;
}

const DISC_COLORS = ['#c0392b', '#d4860b', '#27794a', '#1e5fa8'];

export function DashboardScreen({
  dashboardData,
  role,
  token,
  onOpenAdminPanel,
  onExit,
}: DashboardScreenProps) {
  const analysis = dashboardData.analysis;

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
          <div className="stat-label">Departamentos Mapeados</div>
        </div>
      </div>

      <CollaboratorProfiles token={token} />

      {!analysis ? (
        <div className="profile-section">
          <p>Ainda não há colaboradores mapeados neste escopo.</p>
        </div>
      ) : (
        <>
          <div
            className="charts-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '24px',
            }}
          >
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
              <h3>Colaboradores por Departamento</h3>
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
            <p>{analysis.culture_summary}</p>
          </div>

          {analysis.attention_needed.length > 0 && (
            <div className="profile-section" style={{ borderColor: '#c0392b' }}>
              <h3>
                <span className="icon weaknesses-icon">🚨</span> Atenção Necessária
              </h3>
              <ul>
                {analysis.attention_needed.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="dashboard-grid">
            <div className="profile-section">
              <h3>
                <span className="icon tips-icon">🎯</span> Foco da Liderança
              </h3>
              <ul>
                {analysis.leadership_focus.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="profile-section">
              <h3>
                <span className="icon strengths-icon">💡</span> Conselhos Estratégicos
              </h3>
              <p>{analysis.strategic_advice}</p>
            </div>

            <div className="profile-section">
              <h3>
                <span className="icon weaknesses-icon">⚠️</span> Riscos Potenciais
              </h3>
              <p>{analysis.potential_risks}</p>
            </div>

            <div className="profile-section">
              <h3>
                <span className="icon combo-icon">🚀</span> Oportunidades de Crescimento
              </h3>
              <p>{analysis.growth_opportunities}</p>
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {role === 'admin' && (
          <button className="btn-restart" style={{ flex: 1 }} onClick={onOpenAdminPanel}>
            ⚙️ Painel Admin
          </button>
        )}
        <button
          className="btn-restart"
          style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)' }}
          onClick={onExit}
        >
          Voltar para Início
        </button>
      </div>
    </motion.div>
  );
}
