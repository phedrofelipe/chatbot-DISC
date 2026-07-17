import { motion } from 'framer-motion';
import type { Analysis } from '../types';
import { DISC_NAMES, DISC_FULL } from '../data/questions';

interface ResultScreenProps {
  analysis: Analysis;
  scores: { D: number; I: number; S: number; C: number };
  nomeCompleto: string;
  onDownloadPdf: () => void;
  onExit: () => void;
}

export function ResultScreen({ analysis, scores, nomeCompleto, onDownloadPdf, onExit }: ResultScreenProps) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primary, secondary] = sorted;
  const colors: Record<string, string> = { D: 'var(--D)', I: 'var(--I)', S: 'var(--S)', C: 'var(--C)' };
  const icons: Record<string, string> = { D: '⚡', I: '✨', S: '🌿', C: '🔍' };
  const bgIcons: Record<string, string> = { D: 'var(--D-bg)', I: 'var(--I-bg)', S: 'var(--S-bg)', C: 'var(--C-bg)' };

  return (
    <motion.div className="result" id="capture-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="result-header">
        <div className="result-badge">Análise DISC Completa para {nomeCompleto}</div>
        <div className="result-title" style={{ color: colors[primary[0]] }}>
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
          <span className="icon" style={{ background: bgIcons[primary[0]], fontSize: '16px' }}>
            {icons[primary[0]]}
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
        <button className="btn-restart" style={{ flex: 1 }} onClick={onDownloadPdf}>
          📥 Baixar Relatório (PDF)
        </button>
        <button
          className="btn-restart"
          style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)' }}
          onClick={onExit}
        >
          Sair
        </button>
      </div>
    </motion.div>
  );
}
