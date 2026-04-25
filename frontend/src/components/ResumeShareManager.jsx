import { useState, useEffect } from 'react';

export default function ResumeShareManager({ resumeId, onClose }) {
  const [shares, setShares] = useState([]);
  const [form, setForm] = useState({ expiresAt: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchShares();
  }, [resumeId]);

  const fetchShares = async () => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/shares`, { credentials: 'include' });
      if (res.ok) setShares(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/resumes/${resumeId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          expiresAt: form.expiresAt || null,
          password: form.password || null
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setMsg(`✅ Ссылка создана: ${window.location.origin}${data.link}`);
      setForm({ expiresAt: '', password: '' });
      fetchShares();
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('Удалить эту ссылку?')) return;
    await fetch(`/api/resumes/shares/${slug}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    fetchShares();
  };

  const copyLink = (slug) => {
    const fullLink = `${window.location.origin}/s/${slug}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '∞';
    return new Date(dateStr).toLocaleString('ru-RU');
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-header">
          <h3>🔗 Публичная ссылка</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {msg && (
          <div className={`share-msg ${msg.startsWith('✅') ? 'success' : 'error'}`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleCreate} className="share-form">
          <label>
            Срок действия (опционально)
            <input 
              type="datetime-local" 
              value={form.expiresAt}
              onChange={e => setForm({...form, expiresAt: e.target.value})}
            />
          </label>
          <label>
            Пароль (опционально)
            <input 
              type="password" 
              placeholder="Защитить паролем"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Создаю...' : 'Создать ссылку'}
          </button>
        </form>

        <div className="shares-list">
          <h4>Активные ссылки</h4>
          {shares.length === 0 && <p className="text-muted">Нет активных ссылок</p>}
          {shares.map(share => (
            <div key={share.id} className="share-item">
              <div className="share-info">
                <code>/s/{share.slug}</code>
                <small>
                  👁 {share.views_count} просмотров • 
                  Истекает: {formatDate(share.expires_at)}
                </small>
              </div>
              <div className="share-actions">
                <button 
                  onClick={() => copyLink(share.slug)}
                  className="btn-sm"
                  title="Копировать"
                >
                  {copied ? '✓' : '📋'}
                </button>
                <a 
                  href={`/s/${share.slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-sm"
                  title="Открыть"
                >
                  🔗
                </a>
                <button 
                  onClick={() => handleDelete(share.slug)}
                  className="btn-sm btn-danger"
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}