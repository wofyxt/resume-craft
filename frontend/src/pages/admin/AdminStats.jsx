import { useEffect, useState } from 'react';

export default function AdminStats() {
  const [stats, setStats] = useState({ totalUsers: 0, totalResumes: 0 });
  const [professionStats, setProfessionStats] = useState([]);
  const [loadingProfessions, setLoadingProfessions] = useState(true);

  useEffect(() => {
    // 🔹 Старая статистика
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(console.error);

    // 🔹 Новая статистика по профессиям
    fetch('/api/admin/profession-stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setProfessionStats(d);
        setLoadingProfessions(false);
      })
      .catch(() => setLoadingProfessions(false));
  }, []);

  // Для масштабирования прогресс-баров
  const maxCount = Math.max(...professionStats.map(p => p.user_count), 1);

  return (
    <div>
      <h2>📈 Статистика платформы</h2>
      
      {/* 🔹 Блок базовой статистики */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        <div style={cardStyle}>👥 Пользователей: <strong>{stats.totalUsers}</strong></div>
        <div style={cardStyle}>📄 Резюме создано: <strong>{stats.totalResumes}</strong></div>
      </div>

      {/* 🔹 Блок статистики по профессиям */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ marginBottom: '16px' }}>🎓 Распределение по профессиям</h3>
        
        {loadingProfessions ? (
          <p style={{ color: '#64748b' }}>Загрузка данных...</p>
        ) : professionStats.length === 0 ? (
          <p style={{ color: '#64748b' }}>Пока нет данных. Пользователи должны указать профессию в резюме.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {professionStats.map((p, idx) => {
              const percent = (p.user_count / maxCount) * 100;
              return (
                <div key={p.name || idx} style={{ 
                  background: '#fff', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: '#1e293b' }}>{p.name || 'Не указано'}</strong>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>
                      👤 {p.user_count} чел. • 📄 {p.resume_count} рез.
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${percent}%`, 
                      background: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = { 
  background: '#fff', 
  padding: '20px', 
  borderRadius: '10px', 
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
  minWidth: '200px' 
};