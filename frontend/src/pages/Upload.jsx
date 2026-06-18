// src/pages/Upload.jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    setMessage(null);
    setProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
  });

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await axios.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / (e.total || 1));
          setProgress(pct);
        },
      });
      setMessage({
        type: 'success',
        text: response.data.message || `Enviado ${files.length} arquivo${files.length > 1 ? 's' : ''} com sucesso!`,
      });
      setFiles([]);
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Falha ao enviar os arquivos.' });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFiles([]);
    setProgress(0);
    setMessage(null);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      {message && (
        <div className={`alert alert-${message.type}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3><i className="fas fa-cloud-arrow-up" style={{ marginRight: 8, color: 'var(--accent)' }}></i>Enviar Arquivo</h3>
        </div>
        <div className="card-body">
          <div {...getRootProps()} className={`dropzone${isDragActive ? ' active' : ''}`} id="upload-dropzone">
            <input {...getInputProps()} />
            <i className="fas fa-cloud-arrow-up"></i>
            {isDragActive ? (
              <h4>Solte o arquivo aqui...</h4>
            ) : (
              <>
                <h4>Arraste o arquivo aqui ou clique para selecionar</h4>
                <p>Formatos aceitos: PDF, XLSX, CSV • Tamanho máximo: 10 MB</p>
              </>
            )}
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: progress > 0 ? '0.75rem' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-light)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    <i className="fas fa-file"></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{files.map((file) => file.name).join(', ')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={removeFile} disabled={uploading}>
                    <i className="fas fa-xmark"></i>
                  </button>
                </div>
              </div>

              {progress > 0 && progress < 100 && (
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
              )}

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={uploading}
                  id="upload-submit-btn"
                >
                  {uploading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Enviando...</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> Enviar {files.length} arquivo{files.length > 1 ? 's' : ''}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload tips */}
      <div className="card">
        <div className="card-header">
          <h3>Instruções de Upload</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { icon: 'fa-file-pdf', title: 'PDF', desc: 'Contracheques individuais ou lote' },
              { icon: 'fa-file-excel', title: 'Excel (XLSX)', desc: 'Planilha com dados dos funcionários' },
              { icon: 'fa-file-csv', title: 'CSV', desc: 'Dados separados por vírgula' },
            ].map((t) => (
              <div key={t.title} style={{
                padding: '1rem', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                textAlign: 'center'
              }}>
                <i className={`fas ${t.icon}`} style={{ fontSize: '1.5rem', color: 'var(--accent)', marginBottom: '0.5rem', display: 'block' }}></i>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{t.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
