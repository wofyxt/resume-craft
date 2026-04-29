import { useState, useEffect } from 'react';

export default function ReviewForm({ onSuccess, existingReview }) {
  const [form, setForm] = useState({
    rating: 5,
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Если есть существующий отзыв — заполняем форму
  useEffect(() => {
    if (existingReview) {
      setForm({
        rating: existingReview.rating,
        title: existingReview.title || '',
        content: existingReview.content
      });
    }
  }, [existingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setError('');

    try {
      const method = existingReview ? 'PUT' : 'POST';
      const url = existingReview 
        ? `/api/reviews/${existingReview.id}` 
        : '/api/reviews';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');

      setMsg(existingReview ? '✅ Отзыв обновлён!' : '✅ Спасибо! Ваш отзыв отправлен на модерацию.');
      setForm({ rating: 5, title: '', content: '' });
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '15px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => setForm({ ...form, rating: star })}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: star <= form.rating ? '#fbbf24' : '#d1d5db',
            transition: 'transform 0.1s',
            padding: '0 2px'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ★
        </button>
      ))}
      <span style={{ marginLeft: '10px', color: '#64748b', fontSize: '14px' }}>
        {form.rating} из 5
      </span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ 
      background: '#f8fafc', 
      padding: '24px', 
      borderRadius: '16px',
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '20px' }}>
        {existingReview ? '✏️ Редактировать отзыв' : '⭐ Оставить отзыв'}
      </h3>

      {msg && (
        <div style={{ 
          background: '#dcfce7', 
          color: '#166534', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          {msg}
        </div>
      )}
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <label style={{ display: 'block', marginBottom: '15px', fontWeight: '500' }}>
        Ваша оценка:
      </label>
      {renderStars()}

      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
        Заголовок (необязательно)
      </label>
      <input
        type="text"
        placeholder="Кратко о впечатлении"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        maxLength={150}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '15px',
          fontSize: '14px'
        }}
      />

      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
        Ваш отзыв *
      </label>
      <textarea
        placeholder="Расскажите, как ResumeCraft помог вам..."
        value={form.content}
        onChange={e => setForm({ ...form, content: e.target.value })}
        required
        minLength={20}
        maxLength={1000}
        rows={4}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '15px',
          fontSize: '14px',
          resize: 'vertical',
          fontFamily: 'inherit'
        }}
      />
      <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right', marginBottom: '15px' }}>
        {form.content.length}/1000
      </div>

      <button 
        type="submit" 
        disabled={loading || form.content.length < 20}
        style={{
          width: '100%',
          padding: '12px',
          background: loading || form.content.length < 20 ? '#cbd5e1' : '#a78bfa',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '500',
          cursor: loading || form.content.length < 20 ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s'
        }}
      >
        {loading ? 'Отправка...' : (existingReview ? 'Сохранить изменения' : 'Отправить отзыв')}
      </button>

      {!existingReview && (
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', textAlign: 'center' }}>
          ⏱ Отзывы проходят модерацию и появляются на сайте в течение 24 часов
        </p>
      )}
    </form>
  );
}