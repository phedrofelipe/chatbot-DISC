import { motion } from 'framer-motion';

interface StaffLoginScreenProps {
  creds: { email: string; pass: string };
  setCreds: (creds: { email: string; pass: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function StaffLoginScreen({ creds, setCreds, onSubmit, onBack }: StaffLoginScreenProps) {
  return (
    <motion.div
      className="auth"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="auth-card">
        <h2>Acesso Administrativo</h2>
        <p>Apenas para Administradores, Gestores e Líderes autorizados.</p>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              required
              value={creds.email}
              onChange={(e) => setCreds({ ...creds, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              required
              value={creds.pass}
              onChange={(e) => setCreds({ ...creds, pass: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-auth">
            Acessar Dashboard →
          </button>
          <button
            type="button"
            className="btn-restart"
            style={{ marginTop: '10px' }}
            onClick={onBack}
          >
            Voltar
          </button>
        </form>
      </div>
    </motion.div>
  );
}
