import { useState, useEffect } from 'react';

export default function ResumeVersionHistory({ resumeId, onClose, onRefresh }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/resumes/${resumeId}/versions`, { credentials: 'include' })
      .then(r => r.json())
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [resumeId]);

  const handleSaveVersion = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/save-version`, {
        method: 'POST', credentials: 'include'
      });
      if (res.ok) {
        const r = await fetch(`/api/resumes/${resumeId}/versions`, { credentials: 'include' });
        setVersions(await r.json());
      }
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleRestore = async (verId) => {
    if (!window.confirm('⚠️ Восстановить эту версию? Текущие несохранённые изменения будут потеряны.')) return;
    try {
      const res = await fetch(`/api/resumes/${resumeId}/versions/${verId}/restore`, {
        method: 'POST', credentials: 'include'
      });
      if (res.ok) {
        alert('✅ Резюме успешно восстановлено!');
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (e) { alert('Ошибка восстановления'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>📜 История версий</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>
        
        <button 
          onClick={handleSaveVersion} 
          disabled={saving}
          className="btn btn-outline" 
          style={{ marginBottom: '15px', width: '100%', fontSize: '14px' }}
        >
          {saving ? 'Сохранение...' : '💾 Сохранить текущую версию'}
        </button>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Загрузка...</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            {versions.length === 0 && (
              <p style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>Нет сохраненных версий</p>
            )}
            {versions.map(v => (
              <div key={v.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '12px', borderBottom: '1px solid #f1f5f9' 
              }}>
                <div>
                  <strong style={{ color: '#7c3aed' }}>v{v.version_number}</strong>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(v.created_at).toLocaleString('ru-RU')}
                  </span>
                  <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>{v.title}</div>
                </div>
                <button 
                  onClick={() => handleRestore(v.id)} 
                  className="btn-sm"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  🔄 Восстановить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}