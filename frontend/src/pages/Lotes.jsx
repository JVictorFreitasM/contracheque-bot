// src/pages/Lotes.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import SearchInput from '../components/SearchInput';
import PaginationComponent from '../components/PaginationComponent';

export default function Lotes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
                      <tr key={item.id || idx}>
                        <td>{(page - 1) * limit + idx + 1}</td>
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
