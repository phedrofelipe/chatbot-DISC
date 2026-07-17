import { motion } from 'framer-motion';
import { UsersManagement } from './UsersManagement';
import { DepartmentsManagement } from './DepartmentsManagement';

interface AdminPanelScreenProps {
  activeTab: 'users' | 'departments';
  onChangeTab: (tab: 'users' | 'departments') => void;
  token: string;
  onBack: () => void;
  onDepartmentsChanged: () => void;
}

export function AdminPanelScreen({
  activeTab,
  onChangeTab,
  token,
  onBack,
  onDepartmentsChanged,
}: AdminPanelScreenProps) {
  return (
    <motion.div className="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="result-header">
        <div className="result-badge">Painel Administrativo</div>
        <div className="result-title" style={{ color: 'var(--text)' }}>
          Gestão de Usuários e Departamentos
        </div>
      </div>

      <div className="admin-subtabs" style={{ marginBottom: '20px' }}>
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => onChangeTab('users')}
        >
          👥 Usuários
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => onChangeTab('departments')}
        >
          🏢 Departamentos
        </button>
      </div>

      {activeTab === 'users' ? (
        <UsersManagement token={token} />
      ) : (
        <DepartmentsManagement token={token} onChanged={onDepartmentsChanged} />
      )}

      <button className="btn-restart" style={{ marginTop: '20px' }} onClick={onBack}>
        ← Voltar para o Dashboard
      </button>
    </motion.div>
  );
}
