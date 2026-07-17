import { useEffect, useState } from 'react';
import { api, authHeaders, getErrorMessage } from '../../api';
import type { Department } from '../../types';

interface DepartmentsManagementProps {
  token: string;
  onChanged?: () => void;
}

export function DepartmentsManagement({ token, onChanged }: DepartmentsManagementProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch {
      setError('Erro ao carregar departamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/departments', { name: newName }, authHeaders(token));
      setNewName('');
      await load();
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao criar departamento.'));
    }
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditingName(dept.name);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    setError('');
    try {
      await api.patch(`/departments/${editingId}`, { name: editingName }, authHeaders(token));
      setEditingId(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao atualizar departamento.'));
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Remover este departamento?')) return;
    setError('');
    try {
      await api.delete(`/departments/${id}`, authHeaders(token));
      await load();
      onChanged?.();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'Erro ao remover departamento (verifique se ainda há usuários vinculados).',
        ),
      );
    }
  };

  return (
    <div className="admin-section">
      {error && <p className="admin-error">{error}</p>}
      {loading && <p>Carregando...</p>}

      <form onSubmit={handleCreate} className="admin-form" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label>Novo departamento</label>
          <input
            required
            placeholder="Ex: Financeiro"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-auth">
          Adicionar
        </button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <td>
                  {editingId === d.id ? (
                    <form onSubmit={submitEdit} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        required
                      />
                      <button type="submit" className="admin-link-btn">
                        Salvar
                      </button>
                      <button
                        type="button"
                        className="admin-link-btn"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    d.name
                  )}
                </td>
                <td>
                  {editingId !== d.id && (
                    <>
                      <button className="admin-link-btn" onClick={() => startEdit(d)}>
                        Editar
                      </button>
                      <button className="admin-link-btn danger" onClick={() => remove(d.id)}>
                        Excluir
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
