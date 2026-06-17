// src/pages/Erros.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Erros() {
  const [erros, setErros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/erros')
      .then((res) => {
        setErros(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Erro ao buscar erros');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          {[1, 2, 3].map((i) => (
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
          <div className="stat-icon red"><i className="fas fa-triangle-exclamation"></i></div>
          <div className="stat-info">
            <div className="stat-label">Total de Erros</div>
            <div className="stat-value">{erros.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Log de Erros</h3>
          <span className="badge danger">{erros.length} erros</span>
        </div>
        <div className="card-body">
          {erros.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-face-smile"></i>
              <h4>Nenhum erro encontrado</h4>
              <p>Todos os contracheques foram processados com sucesso.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Funcionário</th>
                    <th>Status</th>
                    <th>Mensagem</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {erros.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>{item.nomeFuncionario || item.nome || `Registro ${idx + 1}`}</td>
                      <td><span className="badge danger">{item.status || 'ERRO'}</span></td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.mensagemErro || item.mensagem || item.error || JSON.stringify(item)}
                      </td>
                      <td>{item.dataProcessamento || '—'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm">
                          <i className="fas fa-rotate-right"></i> Reprocessar
                        </button>
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
