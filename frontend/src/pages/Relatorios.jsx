// src/pages/Relatorios.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('mensal');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros usados na exportação (CSV/Excel)
  const [filtroCompetencia, setFiltroCompetencia] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [incluirCpfCompleto, setIncluirCpfCompleto] = useState(false);
  const [exportando, setExportando] = useState(null); // 'csv' | 'xlsx' | null
  const [exportError, setExportError] = useState(null);

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

  const handleExport = async (formato) => {
    setExportando(formato);
    setExportError(null);
    try {
      const params = { formato };
      if (filtroCompetencia) params.competencia = filtroCompetencia;
      if (filtroStatus) params.status = filtroStatus;
      if (incluirCpfCompleto) params.cpfCompleto = 'true';

      const response = await axios.get('/api/relatorios/exportar', {
        params,
        responseType: 'blob',
      });

      const extensao = formato === 'xlsx' ? 'xlsx' : 'csv';
      const dataArquivo = new Date().toISOString().split('T')[0];
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${dataArquivo}.${extensao}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.response?.data?.error || 'Erro ao exportar relatório');
    } finally {
      setExportando(null);
    }
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

      {/* Exportação */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3><i className="fas fa-file-export" style={{ marginRight: 8, color: 'var(--text-muted)' }}></i>Exportar envios</h3>
        </div>
        <div className="card-body">
          {exportError && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <i className="fas fa-exclamation-circle"></i> {exportError}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Competência
              </label>
              <input
                type="text"
                placeholder="ex: 06/2026"
                value={filtroCompetencia}
                onChange={(e) => setFiltroCompetencia(e.target.value)}
                className="form-input"
                style={{ padding: '0.45rem 0.6rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="form-input"
                style={{ padding: '0.45rem 0.6rem' }}
              >
                <option value="">Todos</option>
                <option value="PENDENTE">Pendente</option>
                <option value="PROCESSANDO">Processando</option>
                <option value="ENVIADO">Enviado</option>
                <option value="BLOQUEADO">Bloqueado</option>
                <option value="ERRO">Erro</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', paddingBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={incluirCpfCompleto}
                onChange={(e) => setIncluirCpfCompleto(e.target.checked)}
              />
              Incluir CPF completo (por padrão, apenas os 3 últimos dígitos são exportados)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleExport('csv')}
                disabled={exportando !== null}
              >
                {exportando === 'csv' ? (
                  <><i className="fas fa-spinner fa-spin"></i> Exportando...</>
                ) : (
                  <><i className="fas fa-file-csv"></i> Exportar CSV</>
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleExport('xlsx')}
                disabled={exportando !== null}
              >
                {exportando === 'xlsx' ? (
                  <><i className="fas fa-spinner fa-spin"></i> Exportando...</>
                ) : (
                  <><i className="fas fa-file-excel"></i> Exportar Excel</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status de entrega/leitura (WhatsApp) */}
      {reportData?.status && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enviados</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>{reportData.status.enviado}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Entregues</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>{reportData.status.entregue ?? 0}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lidos</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>{reportData.status.lido ?? 0}</div>
            </div>
          </div>
        </div>
      )}

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
