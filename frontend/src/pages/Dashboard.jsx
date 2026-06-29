// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { apiFetch } from '../services/apiFetch';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);



export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProcessados: 0,
    pendentes: 0,
    erros: 0,
    funcionarios: 0,
    processadosMes: [],
    meses: [],
    statusDistribuicao: {
      enviados: 0,
      pendentes: 0,
      erros: 0,
    },
    ultimaSincronizacao: null,
    proximoLote: null,
  });
  const [loading, setLoading] = useState(true);

  const [processamentoRealTime, setProcessamentoRealTime] = useState({
    loteAtual: 'Carregando...',
    total: 0,
    processados: 0,
    enviados: 0,
    erros: 0,
    restantes: 0,
    tempoMedio: 0,
    previsaoTermino: '00:00',
    workerOnline: false,
    redisOnline: false,
    evolutionOnline: false
  });

  useEffect(() => {
    apiFetch('/api/dashboard/indicadores')
      .then((result) => {
        if (!result) {
          console.warn('Dashboard endpoint returned null/invalid data');
          return;
        }
        setStats({
          totalProcessados:
            (result.enviados ?? 0) +
            (result.pendentes ?? 0) +
            (result.erros ?? 0) +
            (result.duplicidades ?? 0),
          pendentes: result.pendentes ?? 0,
          erros: result.erros ?? 0,
          funcionarios: result.funcionariosSincronizados ?? 0,
          processadosMes: [
            result.pendentes ?? 0,
            result.enviados ?? 0,
            result.erros ?? 0,
            result.duplicados ?? 0,
          ],
          meses: result.meses ?? ['Pendentes', 'Enviados', 'Erros', 'Duplicados'],
          statusDistribuicao: {
            enviados: result.enviados ?? 0,
            pendentes: result.pendentes ?? 0,
            erros: result.erros ?? 0,
          },
          ultimaSincronizacao: result.ultimaSincronizacao ?? null,
          proximoLote: result.proximoLote ?? null,
        });
      })
      .catch((err) => {
        console.error('Erro ao buscar métricas do dashboard:', err);
      })
      .finally(() => setLoading(false));

    // SSE Connection for Real-Time Processing Panel
    const evtSource = new EventSource('/api/processamento/stream');
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProcessamentoRealTime(data);
      } catch (err) {
        console.error('Erro ao parsear dados do SSE:', err);
      }
    };
    evtSource.onerror = () => {
      console.error('Erro de conexão SSE.');
    };

    return () => {
      evtSource.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10 }}></div>
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }}></div>
              <div className="skeleton" style={{ width: '40%', height: 24 }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const lineData = {
    labels: stats.meses,
    datasets: [
      {
        label: 'Processados',
        data: stats.processadosMes,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        titleColor: isDark ? '#f1f5f9' : '#1e293b',
        bodyColor: isDark ? '#94a3b8' : '#64748b',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 12 } } },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 12 } },
        border: { display: false },
      },
    },
  };

  const doughnutData = {
    labels: ['Enviados', 'Pendentes', 'Erros'],
    datasets: [
      {
        data: [stats.statusDistribuicao.enviados, stats.statusDistribuicao.pendentes, stats.statusDistribuicao.erros],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        spacing: 3,
        borderRadius: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: textColor, padding: 16, font: { size: 12 }, usePointStyle: true, pointStyleWidth: 8 },
      },
    },
  };

  return (
    <>
      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fas fa-file-invoice"></i></div>
          <div className="stat-info">
            <div className="stat-label">Total Processados</div>
            <div className="stat-value">{stats.totalProcessados.toLocaleString('pt-BR')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><i className="fas fa-clock"></i></div>
          <div className="stat-info">
            <div className="stat-label">Pendentes</div>
            <div className="stat-value">{stats.pendentes}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><i className="fas fa-circle-exclamation"></i></div>
          <div className="stat-info">
            <div className="stat-label">Erros</div>
            <div className="stat-value">{stats.erros}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-users"></i></div>
          <div className="stat-info">
            <div className="stat-label">Funcionários</div>
            <div className="stat-value">{stats.funcionarios}</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Painel de Processamento</h3>
            <span className="badge info">Lote: {processamentoRealTime.loteAtual}</span>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Progresso</span>
                <span style={{ color: 'var(--text-primary)' }}>{processamentoRealTime.total > 0 ? Math.round((processamentoRealTime.processados / processamentoRealTime.total) * 100) : 0}%</span>
              </div>
              <div style={{ height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${processamentoRealTime.total > 0 ? Math.round((processamentoRealTime.processados / processamentoRealTime.total) * 100) : 0}%`, height: '100%', background: '#3b82f6', transition: 'width 0.3s ease' }}></div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {processamentoRealTime.processados} / {processamentoRealTime.total} PDFs processados
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Enviados</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#10b981' }}>{processamentoRealTime.enviados}</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Erros</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#ef4444' }}>{processamentoRealTime.erros}</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Restantes</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{processamentoRealTime.restantes}</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tempo Médio</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{processamentoRealTime.tempoMedio}s</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Previsão de Término</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{processamentoRealTime.previsaoTermino}</span>
            </div>

            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status dos Serviços</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge ${processamentoRealTime.workerOnline ? 'success' : 'danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <i className="fas fa-cogs"></i> Worker
                </span>
                <span className={`badge ${processamentoRealTime.redisOnline ? 'success' : 'danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <i className="fas fa-database"></i> Redis
                </span>
                <span className={`badge ${processamentoRealTime.evolutionOnline ? 'success' : 'danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <i className="fab fa-whatsapp"></i> Evolution
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Distribuição de Status</h3>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </>
  );
}
