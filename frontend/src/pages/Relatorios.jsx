// src/pages/Relatorios.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('mensal');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/relatorios')
      .then((res) => {
        setReportData(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Erro ao carregar relatórios');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = (tipo) => {
    setGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false);
      alert(`Relatório "${tipo}" gerado com sucesso! (implementar download)`);
    }, 1500);
  };

  const reportTypes = [
    {
      id: 'processamento',
      icon: 'fa-file-lines',
      title: 'Relatório de Processamento',
      desc: 'Resumo de todos os contracheques processados no período selecionado',
      color: 'blue',
    },
    {
      id: 'erros',
      icon: 'fa-triangle-exclamation',
      title: 'Relatório de Erros',
      desc: 'Detalhamento dos erros ocorridos durante o processamento',
      color: 'red',
    },
    {
      id: 'envios',
      icon: 'fa-paper-plane',
      title: 'Relatório de Envios',
      desc: 'Status de envio dos contracheques via WhatsApp',
      color: 'green',
    },
    {
      id: 'funcionarios',
      icon: 'fa-users',
      title: 'Relatório de Funcionários',
      desc: 'Lista completa de funcionários com status de recebimento',
      color: 'purple',
    },
  ];

  return (
    <>
      {/* Period selector */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <i className="fas fa-calendar" style={{ marginRight: 6 }}></i>Período:
          </span>
          {['semanal', 'mensal', 'trimestral', 'anual'].map((p) => (
            <button
              key={p}
              className={`btn ${periodo === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setPeriodo(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Report cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {reportTypes.map((r) => (
          <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-body" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className={`stat-icon ${r.color}`}>
                  <i className={`fas ${r.icon}`}></i>
                </div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {r.title}
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {r.desc}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleGenerate(r.title)}
                  disabled={generating}
                >
                  {generating ? (
                    <><i className="fas fa-spinner fa-spin"></i> Gerando...</>
                  ) : (
                    <><i className="fas fa-download"></i> Gerar PDF</>
                  )}
                </button>
                <button className="btn btn-secondary btn-sm">
                  <i className="fas fa-file-csv"></i> CSV
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
