// src/pages/Configuracoes.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Configuracoes() {
  const [config, setConfig] = useState({
    whatsappApiUrl: '',
    whatsappToken: '',
    uploadDir: './uploads',
    maxFileSize: 10,
    autoSend: true,
    notifyErrors: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    axios
      .get('/api/configuracoes')
      .then((res) => {
        if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) {
          setConfig((prev) => ({ ...prev, ...res.data }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await axios.put('/api/configuracoes', config);
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Erro ao salvar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 44, marginBottom: 16, borderRadius: 6 }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {message && (
        <div className={`alert alert-${message.type}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
        {/* WhatsApp / API */}
        <div className="card">
          <div className="card-header">
            <h3><i className="fab fa-whatsapp" style={{ marginRight: 8, color: '#25d366' }}></i>Integração WhatsApp</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">URL da API (Evolution API)</label>
              <input
                className="form-input"
                value={config.whatsappApiUrl}
                onChange={(e) => handleChange('whatsappApiUrl', e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Token de Autenticação</label>
              <input
                className="form-input"
                type="password"
                value={config.whatsappToken}
                onChange={(e) => handleChange('whatsappToken', e.target.value)}
                placeholder="••••••••••••"
              />
            </div>
          </div>
        </div>

        {/* Uploads */}
        <div className="card">
          <div className="card-header">
            <h3><i className="fas fa-folder-open" style={{ marginRight: 8, color: 'var(--accent)' }}></i>Configurações de Upload</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Diretório de Upload</label>
              <input
                className="form-input"
                value={config.uploadDir}
                onChange={(e) => handleChange('uploadDir', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tamanho Máximo do Arquivo (MB)</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={100}
                value={config.maxFileSize}
                onChange={(e) => handleChange('maxFileSize', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Automação */}
        <div className="card">
          <div className="card-header">
            <h3><i className="fas fa-robot" style={{ marginRight: 8, color: 'var(--info)' }}></i>Automação</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.autoSend}
                  onChange={(e) => handleChange('autoSend', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Envio Automático</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Enviar contracheques automaticamente após processamento</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.notifyErrors}
                  onChange={(e) => handleChange('notifyErrors', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Notificação de Erros</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Receber notificação quando ocorrer um erro de processamento</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-config-btn">
          {saving ? (
            <><i className="fas fa-spinner fa-spin"></i> Salvando...</>
          ) : (
            <><i className="fas fa-save"></i> Salvar Configurações</>
          )}
        </button>
      </div>
    </>
  );
}
