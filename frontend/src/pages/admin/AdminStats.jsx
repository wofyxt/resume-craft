import { useEffect, useState } from 'react';

export default function AdminStats() {
  const [stats, setStats] = useState({ totalUsers: 0, totalResumes: 0 });

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(r => r.json()).then(d => setStats(d));
  }, []);

  return (
    <div>
      <h2>📈 Статистика платформы</h2>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={cardStyle}>👥 Пользователей: <strong>{stats.totalUsers}</strong></div>
        <div style={cardStyle}>📄 Резюме создано: <strong>{stats.totalResumes}</strong></div>
      </div>
    </div>
  );
}
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', minWidth: '200px' };