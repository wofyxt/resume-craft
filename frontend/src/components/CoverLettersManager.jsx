import { useState, useEffect } from 'react';

export default function CoverLettersManager() {
  const [letters, setLetters] = useState([]);
  const [resumes, setResumes] = useState([]);
  // 🔹 Инициализируем форму с пустыми строками (не null!)
  const [form, setForm] = useState({ 
    id: null, 
    title: '', 
    content: '', 
    resume_id: '' 
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lettersRes, resumesRes] = await Promise.all([
        fetch('/api/cover-letters', { credentials: 'include' }),
        fetch('/api/resumes', { credentials: 'include' })
      ]);
      if (lettersRes.ok) setLetters(await lettersRes.json());
      if (resumesRes.ok) setResumes(await resumesRes.json());
    } catch (e) { 
      console.error('Fetch error:', e); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/cover-letters/${form.id}` : '/api/cover-letters';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title || '',
          content: form.content || '',
          resume_id: form.resume_id || null
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Ошибка');
      // 🔹 Сбрасываем форму в безопасное состояние
      setForm({ id: null, title: '', content: '', resume_id: '' });
      fetchData();
      setMsg('✅ Письмо сохранено');
    } catch (err) { 
      setMsg('❌ ' + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleEdit = (cl) => {
    // 🔹 Гарантируем, что все поля — строки, а не null/undefined
    setForm({ 
      id: cl.id, 
      title: cl.title || '', 
      content: cl.content || '', 
      resume_id: cl.resume_id || '' 
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить письмо?')) return;
    await fetch(`/api/cover-letters/${id}`, { 
      method: 'DELETE', 
      credentials: 'include' 
    });
    fetchData();
  };

  return (
    <div className="cover-letters-section">
      <h2>📝 Сопроводительные письма</h2>
      {msg && (
        <div className={msg.startsWith('✅') ? 'success-message' : 'error-message'}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="cl-form">
        <input 
          placeholder="Заголовок письма" 
          // 🔹 Всегда строка, никогда null
          value={form.title || ''} 
          onChange={e => setForm({...form, title: e.target.value})} 
          required 
        />
        <select 
          value={form.resume_id || ''} 
          onChange={e => setForm({...form, resume_id: e.target.value})}
        >
          <option value="">Не привязывать к резюме</option>
          {resumes.map(r => (
            <option key={r.id} value={r.id}>
              {r.title || 'Без названия'}
            </option>
          ))}
        </select>
        <textarea 
          placeholder="Текст сопроводительного письма..." 
          // 🔹 Всегда строка
          value={form.content || ''} 
          onChange={e => setForm({...form, content: e.target.value})} 
          rows="5" 
          required 
        />
        <div className="cl-form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Сохранение...' : (form.id ? 'Обновить' : 'Создать')}
          </button>
          {form.id && (
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setForm({id: null, title: '', content: '', resume_id: ''})}
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <div className="cl-list">
        {letters.length === 0 && (
          <p className="text-muted">У вас пока нет сопроводительных писем.</p>
        )}
        {letters.map(cl => (
          <div key={cl.id} className="cl-card">
            <div className="cl-info">
              <h3>{cl.title || 'Без заголовка'}</h3>
              {cl.resume_title && (
                <span className="cl-tag">📎 {cl.resume_title}</span>
              )}
              {/* 🔹 Безопасный доступ: ?.substring() + fallback на пустую строку */}
              <p>{(cl.content || '').substring(0, 100)}{cl.content?.length > 100 ? '...' : ''}</p>
              <small>
                Изменено: {cl.updated_at ? new Date(cl.updated_at).toLocaleString() : '—'}
              </small>
            </div>
            <div className="cl-actions">
              <button onClick={() => handleEdit(cl)} className="btn-sm">✏️</button>
              <button onClick={() => handleDelete(cl.id)} className="btn-sm btn-danger">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}