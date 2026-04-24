import { useState } from 'react';

export default function AdminTemplates() {
  const [form, setForm] = useState({ name: '', description: '', preview_url: '', css_class: '' });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    });
    if (res.ok) { setMsg('✅ Шаблон добавлен!'); setForm({ name: '', description: '', preview_url: '', css_class: '' }); }
  };

  return (
    <div>
      <h2>🎨 Добавить шаблон</h2>
      {msg && <div style={{ color: 'green', marginBottom: '10px' }}>{msg}</div>}
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '10px', maxWidth: '500px' }}>
        <input placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={input} />
        <input placeholder="CSS класс (например, modern)" value={form.css_class} onChange={e => setForm({...form, css_class: e.target.value})} required style={input} />
        <input placeholder="URL превью" value={form.preview_url} onChange={e => setForm({...form, preview_url: e.target.value})} style={input} />
        <textarea placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" style={input} />
        <button type="submit" style={{ padding: '10px 20px', background: '#a78bfa', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Сохранить</button>
      </form>
    </div>
  );
}
const input = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };