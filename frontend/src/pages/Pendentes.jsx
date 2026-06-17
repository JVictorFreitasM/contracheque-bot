// src/pages/Pendentes.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Pendentes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/pendentes')
      .then((res) => {
        setData(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? 'Erro ao buscar pendentes');
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
          <div className="stat-icon yellow"><i className="fas fa-clock"></i></div>
          <div className="stat-info">
            <div className="stat-label">Pendentes Totais</div>
            <div className="stat-value">{data.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Envios Pendentes</h3>
          <span className="badge warning">{data.length} aguardando</span>
        </div>
        <div className="card-body">
          {data.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-check-circle"></i>
              <h4>Tudo em dia!</h4>
              <p>Não há contracheques pendentes de envio.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Funcionário</th>
                    <th>Telefone</th>
                    <th>Competência</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>{item.nomeFuncionario || `Registro ${idx + 1}`}</td>
                      <td>{item.telefone || '—'}</td>
                      <td>{item.competencia || '—'}</td>
                      <td><span className={`badge ${item.status === 'PENDENTE' ? 'warning' : 'neutral'}`}>{item.status || 'PENDENTE'}</span></td>
                      <td>{item.dataProcessamento || '—'}</td>
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
