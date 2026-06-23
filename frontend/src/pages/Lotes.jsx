// src/pages/Lotes.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import SearchInput from '../components/SearchInput';
import PaginationComponent from '../components/PaginationComponent';

export default function Lotes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLote, setSelectedLote] = useState(null);
  const [progresso, setProgresso] = useState(null);
  const [progressoLoading, setProgressoLoading] = useState(false);
  const [progressoError, setProgressoError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [reprocessLoading, setReprocessLoading] = useState(false);
  const [reprocessError, setReprocessError] = useState(null);
  const [reprocessSuccess, setReprocessSuccess] = useState(null);
  const [historicoReprocessamento, setHistoricoReprocessamento] = useState([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    axios
      .get('/api/lotes', { params: { page, limit, search } })
      .then((res) => {
        if (res.data && res.data.data) {
          setData(res.data.data);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 0);
        } else {
          setData(Array.isArray(res.data) ? res.data : []);
          setTotal(res.data?.length || 0);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Erro ao buscar lotes');
        setLoading(false);
      });
  }, [page, limit, search]);

  const handleSearch = (term) => {
    setSearch(term);
    setPage(1); // Reset to first page on search
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const fetchProgresso = async (loteId) => {
    if (!loteId) {
      setProgresso(null);
      return;
    }
    setProgressoLoading(true);
    setProgressoError(null);

    try {
      const response = await axios.get(`/api/lotes/${loteId}/progresso`);
      setProgresso(response.data);
    } catch (err) {
      setProgresso(null);
      setProgressoError(err.response?.data?.error || 'Falha ao carregar progresso do lote');
    } finally {
      setProgressoLoading(false);
    }
  };

  const fetchHistoricoReprocessamento = async (loteId) => {
    if (!loteId) {
      setHistoricoReprocessamento([]);
      return;
    }

    try {
      const response = await axios.get(`/api/lotes/${loteId}/reprocessamentos`);
      setHistoricoReprocessamento(response.data.data || []);
    } catch (err) {
      setHistoricoReprocessamento([]);
    }
  };

  const handleCancelLote = async () => {
    if (!selectedLote) return;
    const confirmed = window.confirm('Tem certeza que deseja cancelar este lote?');
    if (!confirmed) return;

    setCancelLoading(true);
    setCancelError(null);

    try {
      await axios.post(`/api/lotes/${selectedLote.id}/cancelar`);
      setSelectedLote((prev) => (prev ? { ...prev, status: 'cancelado' } : null));
      setData((prev) => prev.map((item) => item.id === selectedLote.id ? { ...item, status: 'cancelado' } : item));
      fetchProgresso(selectedLote.id);
    } catch (err) {
      setCancelError(err.response?.data?.error || 'Falha ao cancelar o lote');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReprocessar = async (tipo) => {
    if (!selectedLote) return;
    const confirmed = window.confirm(`Tem certeza que deseja ${tipo === 'full' ? 'reprocessar o lote completo' : tipo === 'errors' ? 'reprocessar apenas os erros' : 'reprocessar apenas os pendentes'}?`);
    if (!confirmed) return;

    setReprocessLoading(true);
    setReprocessError(null);
    setReprocessSuccess(null);

    try {
      const url = tipo === 'full'
        ? `/api/lotes/${selectedLote.id}/reprocessar`
        : tipo === 'errors'
          ? `/api/lotes/${selectedLote.id}/reprocessar-erros`
          : `/api/lotes/${selectedLote.id}/reprocessar-pendentes`;

      const response = await axios.post(url);
      setReprocessSuccess(`Reprocessamento iniciado: ${response.data.quantidade || 0} itens.`);
      fetchProgresso(selectedLote.id);
    } catch (err) {
      setReprocessError(err.response?.data?.error || 'Falha ao iniciar reprocessamento');
    } finally {
      setReprocessLoading(false);
    }
  };

  const renderStatusBadgeClass = (status) => {
    if (status === 'concluido') return 'success';
    if (status === 'erro') return 'danger';
    if (status === 'cancelado') return 'secondary';
    return 'warning';
  };

  const handleSelectLote = (lote) => {
    setSelectedLote(lote);
  };

  useEffect(() => {
    if (!selectedLote) {
      setProgresso(null);
      return undefined;
    }

    fetchProgresso(selectedLote.id);
    fetchHistoricoReprocessamento(selectedLote.id);
    const interval = setInterval(() => fetchProgresso(selectedLote.id), 5000);

    return () => clearInterval(interval);
  }, [selectedLote]);

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
            <div className="stat-value">{total}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-check-circle"></i></div>
          <div className="stat-info">
            <div className="stat-label">Concluídos (nesta pág)</div>
            <div className="stat-value">{data.filter((l) => l.status === 'concluido').length || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><i className="fas fa-spinner"></i></div>
          <div className="stat-info">
            <div className="stat-label">Em Processamento (nesta pág)</div>
            <div className="stat-value">{data.filter((l) => l.status === 'processando').length || 0}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <div className="d-flex align-items-center">
            <h3>Histórico de Lotes</h3>
            <span className="badge neutral ms-2">{total} registros</span>
          </div>
          <div style={{ width: '100%', maxWidth: '300px', marginTop: '10px' }} className="mt-md-0">
            <SearchInput 
              value={search} 
              onSearch={handleSearch} 
              placeholder="Buscar por lote ou competência..." 
            />
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ height: 42, marginBottom: 8, borderRadius: 6 }}></div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-layer-group"></i>
              <h4>Nenhum lote encontrado</h4>
              <p>{search ? 'Nenhum resultado para a busca.' : 'Os lotes processados aparecerão aqui.'}</p>
            </div>
          ) : (
            <>
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
                    {data.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        onClick={() => handleSelectLote(item)}
                        className={selectedLote?.id === item.id ? 'selected-row' : ''}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{(page - 1) * limit + idx + 1}</td>
                        <td style={{ fontWeight: 500 }}>{item.nome || `Lote ${idx + 1}`}</td>
                        <td>{item.data || '—'}</td>
                        <td>{item.quantidade ?? '—'}</td>
                        <td>
                          <span className={`badge ${renderStatusBadgeClass(item.status)}`}>
                            {item.status || 'pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationComponent 
                page={page} 
                limit={limit} 
                total={total} 
                totalPages={totalPages} 
                onPageChange={setPage} 
                onLimitChange={handleLimitChange} 
              />

              {selectedLote && (
                <div className="card mt-4">
                  <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h4>Progresso do Lote</h4>
                        <p className="text-muted mb-0">{selectedLote.nome || 'Competência selecionada'}</p>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {['processando', 'pendente'].includes(selectedLote.status) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={handleCancelLote}
                            disabled={cancelLoading || reprocessLoading}
                          >
                            {cancelLoading ? 'Cancelando...' : 'Cancelar Lote'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleReprocessar('full')}
                          disabled={reprocessLoading || cancelLoading}
                        >
                          {reprocessLoading ? 'Reprocessando...' : 'Reprocessar Lote'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          onClick={() => handleReprocessar('errors')}
                          disabled={reprocessLoading || cancelLoading}
                        >
                          {reprocessLoading ? 'Reprocessando...' : 'Reprocessar Erros'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleReprocessar('pendentes')}
                          disabled={reprocessLoading || cancelLoading}
                        >
                          {reprocessLoading ? 'Reprocessando...' : 'Reprocessar Pendentes'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelectedLote(null)}
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    {cancelError && (
                      <div className="alert alert-danger">{cancelError}</div>
                    )}
                    {reprocessError && (
                      <div className="alert alert-danger">{reprocessError}</div>
                    )}
                    {reprocessSuccess && (
                      <div className="alert alert-success">{reprocessSuccess}</div>
                    )}
                    {progressoLoading ? (
                      <p>Carregando progresso...</p>
                    ) : progressoError ? (
                      <div className="alert alert-danger">{progressoError}</div>
                    ) : progresso ? (
                      <>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Total de PDFs</span>
                            <strong>{progresso.total_pdfs}</strong>
                          </div>
                          <div className="progress-bar-container">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${progresso.total_pdfs ? Math.round((progresso.processados / progresso.total_pdfs) * 100) : 0}%` }}
                            />
                          </div>
                          <div className="d-flex justify-content-between mt-2 text-sm text-secondary">
                            <span>{`${Math.round(progresso.total_pdfs ? (progresso.processados / progresso.total_pdfs) * 100 : 0)}% processados`}</span>
                            <span>{`${progresso.pendentes} pendentes`}</span>
                          </div>
                        </div>

                        <div className="stats-grid">
                          <div className="stat-card">
                            <div className="stat-icon blue"><i className="fas fa-file"></i></div>
                            <div className="stat-info">
                              <div className="stat-label">Total</div>
                              <div className="stat-value">{progresso.total_pdfs}</div>
                            </div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-icon green"><i className="fas fa-check"></i></div>
                            <div className="stat-info">
                              <div className="stat-label">Processados</div>
                              <div className="stat-value">{progresso.processados}</div>
                            </div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-icon yellow"><i className="fas fa-exclamation-triangle"></i></div>
                            <div className="stat-info">
                              <div className="stat-label">Em processamento</div>
                              <div className="stat-value">{progresso.pendentes}</div>
                            </div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-icon red"><i className="fas fa-times"></i></div>
                            <div className="stat-info">
                              <div className="stat-label">Erros</div>
                              <div className="stat-value">{progresso.erros}</div>
                            </div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-icon purple"><i className="fas fa-history"></i></div>
                            <div className="stat-info">
                              <div className="stat-label">Reprocessamentos</div>
                              <div className="stat-value">{historicoReprocessamento.length}</div>
                            </div>
                          </div>
                        </div>

                        {historicoReprocessamento.length > 0 && (
                          <div className="mt-4">
                            <h5>Histórico de Reprocessamentos</h5>
                            <div className="table-responsive">
                              <table className="data-table">
                                <thead>
                                  <tr>
                                    <th>Data</th>
                                    <th>Tipo</th>
                                    <th>Quantidade</th>
                                    <th>Usuário</th>
                                    <th>Descrição</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {historicoReprocessamento.map((registro) => (
                                    <tr key={registro.id}>
                                      <td>{new Date(registro.createdAt).toLocaleString()}</td>
                                      <td>{registro.tipo}</td>
                                      <td>{registro.quantidade}</td>
                                      <td>{registro.usuario}</td>
                                      <td>{registro.descricao || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p>Selecione um lote para ver o progresso.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
