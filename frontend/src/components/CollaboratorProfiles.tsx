import { useEffect, useState } from 'react';
import { api, authHeaders, getErrorMessage } from '../api';
import { DISC_NAMES } from '../data/questions';
import type { CollaboratorUser, Department } from '../types';

interface CollaboratorProfilesProps {
  token: string;
}

export function CollaboratorProfiles({ token }: CollaboratorProfilesProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [usersRes, deptRes] = await Promise.all([
          api.get('/users', {
            ...authHeaders(token),
            params: { role: 'colaborador', limit: 200 },
          }),
          api.get('/departments'),
        ]);
        setCollaborators(usersRes.data.data);
        setDepartments(deptRes.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Erro ao carregar os perfis dos colaboradores.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const departmentName = (id: number | null) => departments.find((d) => d.id === id)?.name ?? '—';

  return (
    <div className="profile-section">
      <h3>
        <span className="icon" style={{ background: 'rgba(168, 198, 240, 0.1)' }}>
          🧭
        </span>
        Perfis da Equipe
      </h3>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && collaborators.length === 0 && (
        <p>Nenhum colaborador mapeado neste escopo ainda.</p>
      )}

      {collaborators.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Departamento</th>
                <th>Perfil</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((c) => (
                <tr key={c.id}>
                  <td>{c.nomeCompleto}</td>
                  <td>{departmentName(c.departmentId)}</td>
                  <td>
                    {c.primaryType ? (
                      <>
                        <span className={`disc-pill ${c.primaryType}`}>
                          {c.primaryType} · {DISC_NAMES[c.primaryType as keyof typeof DISC_NAMES]}
                        </span>
                        {c.secondaryType && (
                          <span
                            className={`disc-pill ${c.secondaryType}`}
                            style={{ marginLeft: '6px' }}
                          >
                            {c.secondaryType} ·{' '}
                            {DISC_NAMES[c.secondaryType as keyof typeof DISC_NAMES]}
                          </span>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{c.analiseResult ? 'Concluído' : 'Pendente'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
