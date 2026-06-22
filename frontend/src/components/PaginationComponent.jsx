import React from 'react';

export default function PaginationComponent({ page, limit, total, totalPages, onPageChange, onLimitChange }) {
  if (total === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '1.5rem',
      gap: '1rem',
      fontSize: '0.9rem',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span>Mostrar:</span>
        <select 
          className="form-input"
          value={limit} 
          onChange={(e) => onLimitChange(Number(e.target.value))}
          style={{ width: '80px', minHeight: '36px', padding: '0.4rem 0.75rem' }}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span style={{ marginLeft: '0.5rem' }}>
          Total de registros: <strong style={{ color: 'var(--text-primary)' }}>{total}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>
          Página <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> de <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
        </span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.preventDefault(); onPageChange(1); }} 
            disabled={page === 1}
            style={{ padding: '0.4rem 0.6rem', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            <i className="fas fa-angle-double-left"></i>
          </button>
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.preventDefault(); onPageChange(page - 1); }} 
            disabled={page === 1}
            style={{ padding: '0.4rem 0.6rem', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            <i className="fas fa-angle-left"></i>
          </button>
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.preventDefault(); onPageChange(page + 1); }} 
            disabled={page === totalPages || totalPages === 0}
            style={{ padding: '0.4rem 0.6rem', opacity: page === totalPages || totalPages === 0 ? 0.5 : 1, cursor: page === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer' }}
          >
            <i className="fas fa-angle-right"></i>
          </button>
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.preventDefault(); onPageChange(totalPages); }} 
            disabled={page === totalPages || totalPages === 0}
            style={{ padding: '0.4rem 0.6rem', opacity: page === totalPages || totalPages === 0 ? 0.5 : 1, cursor: page === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer' }}
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
