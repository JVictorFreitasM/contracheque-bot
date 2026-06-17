// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/indicadores')
      .then((res) => res.json())
      .then((result) => {
        setStats({
          totalProcessados: result.enviados + result.pendentes + result.erros + (result.duplicidades || 0),
          pendentes: result.pendentes,
          erros: result.erros,
          funcionarios: result.funcionariosSincronizados || 0,
          processadosMes: [
            result.pendentes,
            result.enviados,
            result.erros,
            result.duplicidades || 0,
          ],
          meses: ['Pendentes', 'Enviados', 'Erros', 'Duplicados'],
          statusDistribuicao: {
            enviados: result.enviados,
            pendentes: result.pendentes,
            erros: result.erros,
          },
          ultimaSincronizacao: result.ultimaSincronizacao,
          proximoLote: result.proximoLote,
        });
      })
      .catch((err) => {
        console.error('Erro ao buscar métricas do dashboard:', err);
      })
      .finally(() => setLoading(false));
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
            <div className="stat-change up"><i className="fas fa-arrow-up"></i> 12% este mês</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><i className="fas fa-clock"></i></div>
          <div className="stat-info">
            <div className="stat-label">Pendentes</div>
            <div className="stat-value">{stats.pendentes}</div>
            <div className="stat-change down"><i className="fas fa-arrow-down"></i> 5% vs ontem</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><i className="fas fa-circle-exclamation"></i></div>
          <div className="stat-info">
            <div className="stat-label">Erros</div>
            <div className="stat-value">{stats.erros}</div>
            <div className="stat-change up"><i className="fas fa-arrow-down"></i> 2 resolvidos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-users"></i></div>
          <div className="stat-info">
            <div className="stat-label">Funcionários</div>
            <div className="stat-value">{stats.funcionarios}</div>
            <div className="stat-change up"><i className="fas fa-arrow-up"></i> 8 novos</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Contracheques Processados</h3>
            <span className="badge info">Últimos 12 meses</span>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <Line data={lineData} options={lineOptions} />
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
