// src/pages/Monitoramento.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Monitoramento() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = () => {
    axios
      .get('/api/monitoramento')
      .then((res) => {
        setMetrics(res.data);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Erro ao carregar métricas');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const formatMemory = (bytes) => {
    if (!bytes) return '0 MB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (loading && !metrics) {
    return (
      <div className="card">
        <div className="card-body">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 44, marginBottom: 16, borderRadius: 6 }}></div>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <span className="badge success" style={{ padding: '0.4rem 0.8rem' }}>
          <i className="fas fa-circle" style={{ fontSize: '0.5rem', marginRight: 4, animation: 'pulse 2s infinite' }}></i>
          Atualizando ao vivo
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><i className="fas fa-server"></i></div>
          <div className="stat-info">
            <div className="stat-label">Uptime (Servidor)</div>
            <div className="stat-value">{formatUptime(metrics?.uptime)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fas fa-memory"></i></div>
          <div className="stat-info">
            <div className="stat-label">Memória RAM</div>
            <div className="stat-value">{formatMemory(metrics?.memoryUsage?.rss)}</div>
            <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
              Heap: {formatMemory(metrics?.memoryUsage?.heapUsed)}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-check-double"></i></div>
          <div className="stat-info">
            <div className="stat-label">Jobs Concluídos</div>
            <div className="stat-value">{metrics?.jobs?.completed || 0}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3><i className="fas fa-network-wired" style={{ marginRight: 8, color: 'var(--text-muted)' }}></i>Status das Filas</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '0.5rem' }}>{metrics?.jobs?.awaiting || 0}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Aguardando</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--info)', marginBottom: '0.5rem' }}>{metrics?.jobs?.active || 0}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Processando</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem' }}>{metrics?.jobs?.failed || 0}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Falhas</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
