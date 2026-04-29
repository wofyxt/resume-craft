import { useState, useEffect } from 'react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const res = await fetch(`/api/admin/reviews?${params}`, { credentials: 'include' });
      if (res.ok) setReviews(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [filter]);

  const moderate = async (id, status) => {
    if (!window.confirm(`🔍 ${status === 'approved' ? 'Одобрить' : 'Отклонить'} этот отзыв?`)) return;
    
    try {
      const res = await fetch(`/api/admin/reviews/${id}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchReviews();
    } catch (err) {
      alert('Ошибка модерации');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e', text: '⏳ На модерации' },
      approved: { bg: '#dcfce7', color: '#166534', text: '✅ Опубликовано' },
      rejected: { bg: '#fee2e2', color: '#dc2626', text: '❌ Отклонено' }
    };
    return styles[status] || styles.pending;
  };

  return (
    <div>
      <h2>⭐ Модерация отзывов</h2>
      
      {/* Фильтры */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: filter === f ? '#a78bfa' : '#e2e8f0',
              color: filter === f ? '#fff' : '#334155',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === f ? '600' : '400'
            }}
          >
            {f === 'all' ? 'Все' : 
             f === 'pending' ? '⏳ Новые' : 
             f === 'approved' ? '✅ Одобрено' : '❌ Отклонено'}
          </button>
        ))}
        <button 
          onClick={fetchReviews} 
          disabled={loading}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
        >
          {loading ? 'Загрузка...' : '🔄 Обновить'}
        </button>
      </div>

      {/* Таблица */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={th}>Автор</th>
              <th style={th}>Оценка</th>
              <th style={th}>Заголовок</th>
              <th style={th}>Текст</th>
              <th style={th}>Статус</th>
              <th style={th}>Дата</th>
              <th style={th}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => {
              const badge = getStatusBadge(r.status);
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                      )}
                      <div>
                        <div style={{ fontWeight: '500' }}>{r.author_name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{r.author_email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ color: '#fbbf24', fontSize: '18px' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                  </td>
                  <td style={td}>{r.title || '—'}</td>
                  <td style={{ ...td, maxWidth: '250px' }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#334155', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {r.content}
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: badge.bg,
                      color: badge.color,
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {badge.text}
                    </span>
                  </td>
                  <td style={td}>{new Date(r.created_at).toLocaleDateString('ru-RU')}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {r.status !== 'approved' && (
                        <button 
                          onClick={() => moderate(r.id, 'approved')}
                          style={{ ...btn, background: '#dcfce7', color: '#166534' }}
                          title="Одобрить"
                        >✅</button>
                      )}
                      {r.status !== 'rejected' && (
                        <button 
                          onClick={() => moderate(r.id, 'rejected')}
                          style={{ ...btn, background: '#fee2e2', color: '#dc2626' }}
                          title="Отклонить"
                        >❌</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {reviews.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
            Нет отзывов для отображения
          </p>
        )}
      </div>
    </div>
  );
}

const th = { padding: '12px 16px', fontWeight: '600', fontSize: '13px', color: '#475569', borderBottom: '2px solid #e2e8f0' };
const td = { padding: '12px 16px', fontSize: '14px', color: '#1e293b' };
const btn = { padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' };