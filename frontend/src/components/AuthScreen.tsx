import { motion } from 'framer-motion';
import type { Department, UserFormData } from '../types';

const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

interface AuthScreenProps {
  userData: UserFormData;
  setUserData: (data: UserFormData) => void;
  departments: Department[];
  onSubmit: (e: React.FormEvent) => void;
  needsAccessCode?: boolean;
  accessCode?: string;
  setAccessCode?: (v: string) => void;
  onVerifyAccess?: (e: React.FormEvent) => void;
  onCancelAccessCode?: () => void;
  accessError?: string;
}

export function AuthScreen({
  userData,
  setUserData,
  departments,
  onSubmit,
  needsAccessCode,
  accessCode,
  setAccessCode,
  onVerifyAccess,
  onCancelAccessCode,
  accessError,
}: AuthScreenProps) {
  if (needsAccessCode) {
    return (
      <motion.div
        className="auth"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="auth-card">
          <h2>Já vimos você por aqui</h2>
          <p>
            O e-mail <strong>{userData.email}</strong> já concluiu a avaliação. Informe o código
            de acesso que você recebeu ao terminar o quiz para ver seu resultado.
          </p>
          <form onSubmit={onVerifyAccess}>
            <div className="form-group">
              <label>Código de acesso</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="XXXX-XXXX"
                value={accessCode}
                onChange={(e) => setAccessCode?.(e.target.value)}
              />
            </div>
            {accessError && <p className="admin-error">{accessError}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-auth" style={{ flex: 1 }}>
                Ver meu resultado →
              </button>
              <button
                type="button"
                className="btn-restart"
                style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)' }}
                onClick={onCancelAccessCode}
              >
                Usar outro e-mail
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="auth"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="auth-card">
        <h2>Identificação</h2>
        <p>Preencha os dados abaixo para iniciar sua avaliação personalizada.</p>
        <form onSubmit={onSubmit}>
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
          <div
            className="form-group-row"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
          >
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
            <label>Departamento</label>
            <select
              required
              value={userData.departmentId}
              onChange={(e) => setUserData({ ...userData, departmentId: e.target.value })}
            >
              <option value="">Selecione seu departamento...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
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
}
