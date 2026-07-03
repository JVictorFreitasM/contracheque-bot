// src/pages/Configuracoes.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Configuracoes() {
  const [config, setConfig] = useState({
    evolution_url: '',
    evolution_instance: '',
    evolution_api_key: '',
    intervalo_envio: 30,
    mensagem_template: '',
    sincronizacao_hora: 3,
    sincronizacao_minuto: 0
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

  const horarioSincronizacao = `${String(config.sincronizacao_hora ?? 3).padStart(2, '0')}:${String(config.sincronizacao_minuto ?? 0).padStart(2, '0')}`;

  const handleHorarioChange = (value) => {
    const [hora, minuto] = value.split(':').map(Number);
    setConfig((prev) => ({ ...prev, sincronizacao_hora: hora, sincronizacao_minuto: minuto }));
  };

  const renderizarPreview = (template) => {
    const texto = (template || '')
      .replace(/\{nome\}/g, 'João da Silva')
      .replace(/\{competencia\}/g, '06/2026');

    // Renderiza *negrito* do WhatsApp visualmente, com escape básico de HTML
    const escapado = texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const comNegrito = escapado.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    return comNegrito.replace(/\n/g, '<br/>');
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
            <div className="form-group">
              <label className="form-label">Horário da sincronização diária com o ERP</label>
              <input
                className="form-input"
                type="time"
                value={horarioSincronizacao}
                onChange={(e) => handleHorarioChange(e.target.value)}
              />
              <small style={{ color: 'var(--text-muted)' }}>
                Todo dia, neste horário, o sistema busca a lista atualizada de funcionários no WK Radar.
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem do WhatsApp */}
      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-header">
          <h3><i className="fas fa-comment-dots" style={{ marginRight: 8, color: 'var(--accent)' }}></i>Mensagem do WhatsApp</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Template da mensagem</label>
              <textarea
                className="form-input"
                rows={6}
                style={{ fontFamily: 'inherit', resize: 'vertical' }}
                value={config.mensagem_template}
                onChange={(e) => handleChange('mensagem_template', e.target.value)}
                placeholder="Olá *{nome}*&#10;Segue em anexo o seu contracheque de *{competencia}*."
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                Use <code>{'{nome}'}</code> para o nome do funcionário e <code>{'{competencia}'}</code> para o mês/ano de referência.
                Use <code>*texto*</code> para deixar um trecho em negrito no WhatsApp.
              </p>
            </div>
            <div>
              <label className="form-label">Prévia (com dados de exemplo)</label>
              <div
                style={{
                  padding: '1rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  minHeight: 120,
                  whiteSpace: 'normal',
                }}
                dangerouslySetInnerHTML={{ __html: renderizarPreview(config.mensagem_template) }}
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
