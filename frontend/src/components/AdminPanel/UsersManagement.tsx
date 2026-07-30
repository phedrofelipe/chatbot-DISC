import { useEffect, useState } from 'react';
import { api, authHeaders, getErrorMessage } from '../../api';
import type { CollaboratorUser, Department, StaffUser, UserRole } from '../../types';

interface UsersManagementProps {
  token: string;
  onDataWiped?: () => void;
}

type AnyUser = CollaboratorUser | StaffUser;

const STAFF_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'lider', label: 'Líder' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  lider: 'Líder',
  colaborador: 'Colaborador',
};

const WIPE_CONFIRMATION_PHRASE = 'APAGAR TUDO';

export function UsersManagement({ token, onDataWiped }: UsersManagementProps) {
  const [subTab, setSubTab] = useState<'colaboradores' | 'staff'>('colaboradores');
  const [allUsers, setAllUsers] = useState<AnyUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    nomeCompleto: '',
    email: '',
    password: '',
    role: 'lider' as UserRole,
    departmentId: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    nomeCompleto: '',
    departmentId: '',
    idade: '',
    regiao: '',
    role: 'lider' as UserRole,
    password: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, deptRes] = await Promise.all([
        api.get('/users', { ...authHeaders(token), params: { limit: 200 } }),
        api.get('/departments'),
      ]);
      setAllUsers(usersRes.data.data);
      setDepartments(deptRes.data);
    } catch {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentName = (id: number | null) => departments.find((d) => d.id === id)?.name ?? '—';

  const collaborators = allUsers.filter((u) => u.role === 'colaborador') as CollaboratorUser[];
  const staff = allUsers.filter((u) => u.role !== 'colaborador') as StaffUser[];

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(
        '/users/staff',
        {
          nomeCompleto: newStaff.nomeCompleto,
          email: newStaff.email,
          password: newStaff.password,
          role: newStaff.role,
          departmentId: newStaff.departmentId ? Number(newStaff.departmentId) : undefined,
        },
        authHeaders(token),
      );
      setShowCreateStaff(false);
      setNewStaff({ nomeCompleto: '', email: '', password: '', role: 'lider', departmentId: '' });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao criar usuário de equipe.'));
    }
  };

  const startEdit = (user: AnyUser) => {
    setEditingId(user.id);
    setError('');
    if (user.role === 'colaborador') {
      const c = user as CollaboratorUser;
      setEditForm({
        nomeCompleto: c.nomeCompleto,
        departmentId: c.departmentId ? String(c.departmentId) : '',
        idade: String(c.idade ?? ''),
        regiao: c.regiao ?? '',
        role: 'colaborador',
        password: '',
      });
    } else {
      const s = user as StaffUser;
      setEditForm({
        nomeCompleto: s.nomeCompleto,
        departmentId: s.departmentId ? String(s.departmentId) : '',
        idade: '',
        regiao: '',
        role: s.role,
        password: '',
      });
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    setError('');
    const payload: Record<string, unknown> = {
      nomeCompleto: editForm.nomeCompleto,
      departmentId: editForm.departmentId ? Number(editForm.departmentId) : undefined,
    };
    if (editForm.role === 'colaborador') {
      payload.idade = editForm.idade ? Number(editForm.idade) : undefined;
      payload.regiao = editForm.regiao || undefined;
    } else {
      payload.role = editForm.role;
      if (editForm.password) payload.password = editForm.password;
    }
    try {
      await api.patch(`/users/${editingId}`, payload, authHeaders(token));
      setEditingId(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao atualizar usuário.'));
    }
  };

  const removeUser = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário?')) return;
    setError('');
    try {
      await api.delete(`/users/${id}`, authHeaders(token));
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao remover usuário.'));
    }
  };

  const resetOneAnalysis = async (c: CollaboratorUser) => {
    if (
      !window.confirm(
        `Reiniciar as respostas de "${c.nomeCompleto}"? O resultado atual será apagado e um novo código de acesso será gerado.`,
      )
    )
      return;
    setError('');
    try {
      const res = await api.patch(`/users/${c.id}/reset-analysis`, {}, authHeaders(token));
      await load();
      window.alert(
        `Respostas de "${c.nomeCompleto}" reiniciadas.\n\nNovo código de acesso: ${res.data.accessCode}\n\nInforme este código ao colaborador — ele não será mostrado novamente.`,
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao reiniciar respostas do colaborador.'));
    }
  };

  const resetAllAnalysis = async () => {
    const confirmation = window.prompt(
      `Esta ação apaga o resultado de TODOS os ${collaborators.length} colaboradores (o cadastro é mantido). Para confirmar, digite REINICIAR:`,
    );
    if (confirmation !== 'REINICIAR') return;
    setError('');
    try {
      const res = await api.post(
        '/users/reset-all-analysis',
        { confirm: true },
        authHeaders(token),
      );
      await load();
      window.alert(`${res.data.affected} colaborador(es) tiveram as respostas reiniciadas.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao reiniciar as respostas em massa.'));
    }
  };

  const wipeAllData = async () => {
    const confirmation = window.prompt(
      `AÇÃO IRREVERSÍVEL: isso apaga TODAS as contas de Colaborador, Líder e Gestor, e TODOS os departamentos. Só a(s) conta(s) de Administrador permanece(m). Não é possível desfazer.\n\nPara confirmar, digite exatamente: ${WIPE_CONFIRMATION_PHRASE}`,
    );
    if (confirmation !== WIPE_CONFIRMATION_PHRASE) return;
    if (!window.confirm('Tem certeza absoluta? Todos os cadastros e departamentos serão apagados agora.'))
      return;

    setError('');
    try {
      const res = await api.post(
        '/users/wipe-data',
        { confirmationPhrase: confirmation },
        authHeaders(token),
      );
      await load();
      onDataWiped?.();
      window.alert(
        `Limpeza concluída: ${res.data.removedUsers} usuário(s) e ${res.data.removedDepartments} departamento(s) removidos.`,
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao limpar os dados.'));
    }
  };

  return (
    <div className="admin-section">
      <div
        style={{
          border: '1px solid var(--danger, #c0392b)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
        }}
      >
        <strong style={{ color: 'var(--danger, #c0392b)' }}>⚠ Zona de perigo</strong>
        <p style={{ margin: '8px 0' }}>
          Limpar dados apaga permanentemente todas as contas de Colaborador, Líder e Gestor, e
          todos os departamentos. Só a(s) conta(s) de Administrador permanece(m). Use isso para
          reiniciar a plataforma do zero (ex.: novo cliente/implantação) — não para reiniciar um
          ciclo de avaliação (use "Reiniciar respostas" para isso).
        </p>
        <button className="admin-link-btn danger" onClick={wipeAllData}>
          Limpar dados (apagar tudo, exceto Admin)
        </button>
      </div>

      <div className="admin-subtabs">
        <button
          className={`admin-tab-btn ${subTab === 'colaboradores' ? 'active' : ''}`}
          onClick={() => setSubTab('colaboradores')}
        >
          Colaboradores ({collaborators.length})
        </button>
        <button
          className={`admin-tab-btn ${subTab === 'staff' ? 'active' : ''}`}
          onClick={() => setSubTab('staff')}
        >
          Equipe / Staff ({staff.length})
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p>Carregando...</p>}

      {subTab === 'colaboradores' && collaborators.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <button className="admin-link-btn danger" onClick={resetAllAnalysis}>
            Reiniciar respostas de todos os colaboradores
          </button>
        </div>
      )}

      {subTab === 'staff' && (
        <div style={{ marginBottom: '16px' }}>
          <button className="btn-restart" onClick={() => setShowCreateStaff((v) => !v)}>
            {showCreateStaff ? 'Cancelar' : '+ Novo usuário de equipe'}
          </button>

          {showCreateStaff && (
            <form onSubmit={handleCreateStaff} className="admin-form">
              <div className="form-group">
                <label>Nome completo</label>
                <input
                  required
                  value={newStaff.nomeCompleto}
                  onChange={(e) => setNewStaff({ ...newStaff, nomeCompleto: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Papel</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {newStaff.role === 'lider' && (
                <div className="form-group">
                  <label>Departamento (obrigatório para Líder)</label>
                  <select
                    required
                    value={newStaff.departmentId}
                    onChange={(e) => setNewStaff({ ...newStaff, departmentId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className="btn-auth">
                Criar usuário
              </button>
            </form>
          )}
        </div>
      )}

      {editingId !== null && (
        <form onSubmit={submitEdit} className="admin-form">
          <h4>Editando usuário #{editingId}</h4>
          <div className="form-group">
            <label>Nome completo</label>
            <input
              required
              value={editForm.nomeCompleto}
              onChange={(e) => setEditForm({ ...editForm, nomeCompleto: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Departamento</label>
            <select
              value={editForm.departmentId}
              onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
            >
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          {editForm.role === 'colaborador' ? (
            <>
              <div className="form-group">
                <label>Idade</label>
                <input
                  type="number"
                  value={editForm.idade}
                  onChange={(e) => setEditForm({ ...editForm, idade: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Região</label>
                <input
                  value={editForm.regiao}
                  onChange={(e) => setEditForm({ ...editForm, regiao: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Papel</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nova senha (opcional)</label>
                <input
                  type="password"
                  minLength={8}
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-auth">
              Salvar
            </button>
            <button type="button" className="btn-restart" onClick={() => setEditingId(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="admin-table-wrap">
        {subTab === 'colaboradores' ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Departamento</th>
                <th>Idade</th>
                <th>Região</th>
                <th>Análise</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((c) => (
                <tr key={c.id}>
                  <td>{c.nomeCompleto}</td>
                  <td>{c.email}</td>
                  <td>{departmentName(c.departmentId)}</td>
                  <td>{c.idade}</td>
                  <td>{c.regiao}</td>
                  <td>{c.analiseResult ? 'Sim' : 'Pendente'}</td>
                  <td>
                    <button className="admin-link-btn" onClick={() => startEdit(c)}>
                      Editar
                    </button>
                    {c.analiseResult && (
                      <button className="admin-link-btn" onClick={() => resetOneAnalysis(c)}>
                        Reiniciar respostas
                      </button>
                    )}
                    <button className="admin-link-btn danger" onClick={() => removeUser(c.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Departamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.nomeCompleto}</td>
                  <td>{s.email}</td>
                  <td>{ROLE_LABELS[s.role]}</td>
                  <td>{departmentName(s.departmentId)}</td>
                  <td>
                    <button className="admin-link-btn" onClick={() => startEdit(s)}>
                      Editar
                    </button>
                    <button className="admin-link-btn danger" onClick={() => removeUser(s.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
