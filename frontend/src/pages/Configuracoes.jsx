// src/pages/Configuracoes.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Configuracoes() {
  const [config, setConfig] = useState({
    evolution_url: '',
    evolution_instance: '',
    evolution_api_key: '',
    intervalo_envio: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    axios
      .get('/api/configuracoes')
      .then((res) => {
        if (res.data && res.data.config) {
          setConfig((prev) => ({ ...prev, ...res.data.config }));
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
        {/* Evolution API */}
        <div className="card">
          <div className="card-header">
            <h3><i className="fab fa-whatsapp" style={{ marginRight: 8, color: '#25d366' }}></i>Evolution API</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">URL da Evolution</label>
              <input
                className="form-input"
                value={config.evolution_url}
                onChange={(e) => handleChange('evolution_url', e.target.value)}
                placeholder="http://localhost:8080"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nome da Instância</label>
              <input
                className="form-input"
                value={config.evolution_instance}
                onChange={(e) => handleChange('evolution_instance', e.target.value)}
                placeholder="bot-contracheque"
              />
            </div>
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                className="form-input"
                type="password"
                value={config.evolution_api_key}
                onChange={(e) => handleChange('evolution_api_key', e.target.value)}
                placeholder="••••••••••••"
              />
            </div>
          </div>
        </div>

        {/* Envio */}
        <div className="card">
          <div className="card-header">
            <h3><i className="fas fa-paper-plane" style={{ marginRight: 8, color: 'var(--accent)' }}></i>Configurações de Envio</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Intervalo entre envios (segundos)</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={config.intervalo_envio}
                onChange={(e) => handleChange('intervalo_envio', Number(e.target.value))}
              />
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
