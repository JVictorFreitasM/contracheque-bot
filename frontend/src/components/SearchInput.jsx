import React, { useState, useEffect } from 'react';

export default function SearchInput({ value, onSearch, placeholder = 'Buscar...' }) {
  const [searchTerm, setSearchTerm] = useState(value || '');

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    // Only call onSearch if searchTerm actually changed from the prop value
    if (searchTerm === (value || '')) return;

    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, value]); // Removed onSearch from deps to avoid triggering on parent re-renders

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <i 
        className="fas fa-search" 
        style={{
          position: 'absolute', 
          left: 12, 
          top: '50%', 
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)', 
          fontSize: '0.9rem'
        }}
      ></i>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ paddingLeft: '36px', paddingRight: searchTerm ? '36px' : '1rem' }}
      />
      {searchTerm && (
        <button 
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
}
