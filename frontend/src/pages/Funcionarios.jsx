// src/pages/Funcionarios.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import SearchInput from '../components/SearchInput';
import PaginationComponent from '../components/PaginationComponent';

export default function Funcionarios() {
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
      .get('/api/funcionarios', { params: { page, limit, search } })
      .then((res) => {
        // Handle both new paginated response and old array response (fallback)
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
        setError(err.response?.data?.error || 'Erro ao buscar funcionários');
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
          <div className="stat-icon green"><i className="fas fa-users"></i></div>
          <div className="stat-info">
            <div className="stat-label">Total de Funcionários</div>
            <div className="stat-value">{total}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h3>Funcionários Cadastrados</h3>
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <SearchInput 
              value={search} 
              onSearch={handleSearch} 
              placeholder="Nome, matrícula ou telefone..." 
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
              <i className="fas fa-users"></i>
              <h4>{search ? 'Nenhum resultado' : 'Nenhum funcionário cadastrado'}</h4>
              <p>{search ? 'Tente outro termo de busca.' : 'Os funcionários importados aparecerão aqui.'}</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Matrícula</th>
                      <th>Telefone</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, idx) => (
                      <tr key={item.cpf || idx}>
                        <td>{(page - 1) * limit + idx + 1}</td>
                        <td style={{ fontWeight: 500 }}>{item.nome || item.name || '—'}</td>
                        <td>{item.cpf || '—'}</td>
                        <td>{item.codigo || '—'}</td>
                        <td>{item.telefone || item.phone || '—'}</td>
                        <td>
                          <span className={`badge ${item.ativo !== false ? 'success' : 'neutral'}`}>
                            {item.ativo !== false ? 'Ativo' : 'Inativo'}
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
