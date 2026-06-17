// src/pages/Lotes.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Lotes() {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/lotes')
      .then((res) => {
        setLotes(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Erro ao buscar lotes');
        setLoading(false);
      });
  }, []);

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
          <div className="stat-icon blue"><i className="fas fa-layer-group"></i></div>
          <div className="stat-info">
            <div className="stat-label">Total de Lotes</div>
            <div className="stat-value">{lotes.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-check-circle"></i></div>
          <div className="stat-info">
            <div className="stat-label">Concluídos</div>
            <div className="stat-value">{lotes.filter((l) => l.status === 'concluido').length || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><i className="fas fa-spinner"></i></div>
          <div className="stat-info">
            <div className="stat-label">Em Processamento</div>
            <div className="stat-value">{lotes.filter((l) => l.status === 'processando').length || 0}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Histórico de Lotes</h3>
          <span className="badge neutral">{lotes.length} registros</span>
        </div>
        <div className="card-body">
          {lotes.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-layer-group"></i>
              <h4>Nenhum lote encontrado</h4>
              <p>Os lotes processados aparecerão aqui.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nome do Lote</th>
                    <th>Data</th>
                    <th>Quantidade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lotes.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>{item.nome || `Lote ${idx + 1}`}</td>
                      <td>{item.data || '—'}</td>
                      <td>{item.quantidade ?? '—'}</td>
                      <td>
                        <span className={`badge ${item.status === 'concluido' ? 'success' : item.status === 'erro' ? 'danger' : 'warning'}`}>
                          {item.status || 'pendente'}
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
