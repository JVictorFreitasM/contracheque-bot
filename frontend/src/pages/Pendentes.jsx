// src/pages/Pendentes.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import SearchInput from '../components/SearchInput';
import PaginationComponent from '../components/PaginationComponent';

export default function Pendentes() {
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
      .get('/api/pendentes', { params: { page, limit, search } })
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
        setError(err.response?.data?.error ?? 'Erro ao buscar pendentes');
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
          <div className="stat-icon yellow"><i className="fas fa-clock"></i></div>
          <div className="stat-info">
            <div className="stat-label">Pendentes Totais</div>
            <div className="stat-value">{total}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <div className="d-flex align-items-center">
            <h3>Envios Pendentes</h3>
            <span className="badge warning ms-2">{total} aguardando</span>
          </div>
          <div style={{ width: '100%', maxWidth: '300px', marginTop: '10px' }} className="mt-md-0">
            <SearchInput 
              value={search} 
              onSearch={handleSearch} 
              placeholder="Nome ou matrícula..." 
            />
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 42, marginBottom: 8, borderRadius: 6 }}></div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-check-circle"></i>
              <h4>Tudo em dia!</h4>
              <p>{search ? 'Nenhum resultado para a busca.' : 'Não há contracheques pendentes de envio.'}</p>
            </div>
          ) : (
            <>
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
                        <td>{(page - 1) * limit + idx + 1}</td>
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
