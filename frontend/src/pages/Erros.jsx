// src/pages/Erros.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import SearchInput from '../components/SearchInput';
import PaginationComponent from '../components/PaginationComponent';

export default function Erros() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

  // Estados do Reenvio
  const [reenviandoId, setReenviandoId] = useState(null);
  const [isReenviandoTodos, setIsReenviandoTodos] = useState(false);
  const [showModalTodos, setShowModalTodos] = useState(false);

  const fetchErros = () => {
    setLoading(true);
    axios
      .get('/api/erros', { params: { page, limit, search } })
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
        setError(err.response?.data?.error || 'Erro ao buscar erros');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchErros();
  }, [page, limit, search]);

  const handleSearch = (term) => {
    setSearch(term);
    setPage(1); // Reset to first page on search
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleReenviarIndividual = async (id) => {
    try {
      setReenviandoId(id);
      setError(null);
      setSuccessMsg(null);
      const res = await axios.post(`/api/contracheques/${id}/reenviar`);
      setSuccessMsg(res.data.message || 'Contracheque enviado para fila de reenvio.');
      fetchErros(); // Recarrega a lista para mostrar o novo status
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao reenviar contracheque.');
    } finally {
      setReenviandoId(null);
    }
  };

  const handleReenviarTodos = async () => {
    try {
      setIsReenviandoTodos(true);
      setError(null);
      setSuccessMsg(null);
      const res = await axios.post('/api/contracheques/reenviar-erros');
      setSuccessMsg(res.data.message || 'Contracheques enviados para a fila.');
      setShowModalTodos(false);
      fetchErros();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao reenviar lote.');
    } finally {
      setIsReenviandoTodos(false);
    }
  };

  return (
    <>
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', background: 'var(--success)', color: 'var(--text-light)', padding: '1rem', borderRadius: '8px' }}>
          <i className="fas fa-check-circle"></i> {successMsg}
        </div>
      )}

      {showModalTodos && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px',
            maxWidth: '500px', width: '90%'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Reenviar Todos os Erros</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Deseja reenviar todos os contracheques com erro?
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Quantidade encontrada: <strong>{total}</strong> registros.
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--warning)', marginTop: '1rem' }}>
              <i className="fas fa-exclamation-triangle"></i> Essa operação poderá levar alguns minutos dependendo da quantidade.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn" 
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onClick={() => setShowModalTodos(false)}
                disabled={isReenviandoTodos}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleReenviarTodos}
                disabled={isReenviandoTodos}
              >
                {isReenviandoTodos ? (
                  <><i className="fas fa-spinner fa-spin"></i> Processando...</>
                ) : (
                  <><i className="fas fa-paper-plane"></i> Confirmar Reenvio</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red"><i className="fas fa-triangle-exclamation"></i></div>
          <div className="stat-info">
            <div className="stat-label">Total de Erros</div>
            <div className="stat-value">{total}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <div className="d-flex align-items-center mb-3 mb-md-0">
            <h3>Log de Erros</h3>
            <span className="badge danger ms-2">{total} erros</span>
          </div>
          
          <div className="d-flex flex-column flex-md-row gap-2" style={{ width: '100%', maxWidth: '500px' }}>
            {total > 0 && (
              <button 
                className="btn btn-primary" 
                onClick={() => setShowModalTodos(true)}
                disabled={loading || isReenviandoTodos}
                style={{ flexShrink: 0 }}
              >
                <i className="fas fa-rotate-right"></i> Reenviar Todos
              </button>
            )}
            <div style={{ flexGrow: 1 }}>
              <SearchInput 
                value={search} 
                onSearch={handleSearch} 
                placeholder="Nome, matrícula ou erro..." 
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading && !data.length ? (
            <div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 42, marginBottom: 8, borderRadius: 6 }}></div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-face-smile"></i>
              <h4>Nenhum erro encontrado</h4>
              <p>{search ? 'Nenhum resultado para a busca.' : 'Todos os contracheques foram processados com sucesso.'}</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Funcionário</th>
                      <th>Status</th>
                      <th>Mensagem / Último Erro</th>
                      <th>Tentativas</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>{(page - 1) * limit + idx + 1}</td>
                        <td style={{ fontWeight: 500 }}>{item.nomeFuncionario || item.nome || `Registro ${idx + 1}`}</td>
                        <td>
                          {item.status === 'REENVIANDO' ? (
                            <span className="badge warning"><i className="fas fa-spinner fa-spin"></i> REENVIANDO</span>
                          ) : (
                            <span className="badge danger">{item.status || 'ERRO'}</span>
                          )}
                        </td>
                        <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span title={item.ultimoErro || item.mensagemErro || item.error}>
                            {item.ultimoErro || item.mensagemErro || item.error || JSON.stringify(item)}
                          </span>
                        </td>
                        <td>
                          <span className="badge neutral">{item.tentativas || 0}</span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleReenviarIndividual(item.id)}
                            disabled={reenviandoId === item.id || item.status === 'REENVIANDO'}
                          >
                            {reenviandoId === item.id ? (
                              <><i className="fas fa-spinner fa-spin"></i> Reenviando...</>
                            ) : (
                              <><i className="fas fa-rotate-right"></i> Reenviar</>
                            )}
                          </button>
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
