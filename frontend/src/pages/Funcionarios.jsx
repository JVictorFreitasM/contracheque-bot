// src/pages/Funcionarios.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios
      .get('/api/funcionarios')
      .then((res) => {
        setFuncionarios(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Erro ao buscar funcionários');
        setLoading(false);
      });
  }, []);

  const filtered = funcionarios.filter((f) => {
    const name = (f.nome || f.name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 42, marginBottom: 8, borderRadius: 6 }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-users"></i></div>
          <div className="stat-info">
            <div className="stat-label">Total de Funcionários</div>
            <div className="stat-value">{funcionarios.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Funcionários Cadastrados</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '0.8rem'
              }}></i>
              <input
                className="form-input"
                placeholder="Buscar funcionário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 32, width: 220 }}
                id="search-funcionarios"
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-users"></i>
              <h4>{search ? 'Nenhum resultado' : 'Nenhum funcionário cadastrado'}</h4>
              <p>{search ? 'Tente outro termo de busca.' : 'Os funcionários importados aparecerão aqui.'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>Setor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>{item.nome || item.name || '—'}</td>
                      <td>{item.cpf || '—'}</td>
                      <td>{item.telefone || item.phone || '—'}</td>
                      <td>{item.setor || item.department || '—'}</td>
                      <td>
                        <span className={`badge ${item.ativo !== false ? 'success' : 'neutral'}`}>
                          {item.ativo !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
