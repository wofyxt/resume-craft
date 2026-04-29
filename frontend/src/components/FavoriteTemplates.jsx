import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FavoriteTemplates() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/favorites', { credentials: 'include' })
      .then(r => r.json())
      .then(setFavorites)
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (templateId) => {
    await fetch(`/api/favorites/${templateId}`, { 
      method: 'DELETE', 
      credentials: 'include' 
    });
    setFavorites(prev => prev.filter(f => f.id !== templateId));
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</p>;
  if (favorites.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
        <p style={{ fontSize: '48px', marginBottom: '10px' }}>💔</p>
        <h3 style={{ margin: '0 0 10px', color: '#334155' }}>Избранного пока нет</h3>
        <p style={{ color: '#64748b' }}>Добавляйте шаблоны в избранное прямо в редакторе или при создании нового резюме.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '24px' }}>❤️ Избранные шаблоны</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {favorites.map(f => (
          <div key={f.id} style={{ 
            background: '#fff', borderRadius: '16px', padding: '16px', 
            border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s', position: 'relative'
          }}>
            <div style={{ 
              width: '100%', height: '180px', borderRadius: '12px', marginBottom: '12px', 
              background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {f.preview_url ? (
                <img src={f.preview_url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '32px', color: '#94a3b8' }}>📄</span>
              )}
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#1e293b' }}>{f.name}</h3>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                onClick={() => navigate(`/editor/new?template=${f.css_class}`)} 
                className="btn-sm" 
                style={{ flex: 1, background: '#a78bfa', color: '#fff' }}
              >
                Использовать
              </button>
              <button 
                onClick={() => handleRemove(f.id)} 
                className="btn-sm btn-danger" 
                style={{ padding: '8px 10px' }}
                title="Удалить из избранного"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}