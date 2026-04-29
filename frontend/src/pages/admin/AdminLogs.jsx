import { useState, useEffect } from 'react';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ userId: '', actionType: '' });
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.actionType) params.append('actionType', filters.actionType);
      
      const res = await fetch(`/api/admin/logs?${params}`, { credentials: 'include' });
      if (res.ok) setLogs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const formatTime = (ts) => new Date(ts).toLocaleString('ru-RU');
  const getActionColor = (action) => {
    const colors = {
      login: '#10b981',
      logout: '#6b7280',
      resume_create: '#3b82f6',
      resume_update: '#f59e0b',
      resume_delete: '#ef4444',
      profile_update: '#8b5cf6',
      avatar_upload: '#06b6d4',
      account_delete: '#dc2626',
      share_create: '#ec4899',
      share_view: '#14b8a6',
    };
    return colors[action] || '#6b7280';
  };

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
      <h2>📋 Журнал действий</h2>
      
      {/* Фильтры */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          placeholder="User ID"
          value={filters.userId}
          onChange={e => setFilters({ ...filters, userId: e.target.value })}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '100px' }}
        />
        <select
          value={filters.actionType}
          onChange={e => setFilters({ ...filters, actionType: e.target.value })}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
        >
          <option value="">Все действия</option>
          <option value="login">Вход</option>
          <option value="resume_create">Создание резюме</option>
          <option value="resume_update">Обновление резюме</option>
          <option value="resume_delete">Удаление резюме</option>
          <option value="profile_update">Обновление профиля</option>
          <option value="account_delete">Удаление аккаунта</option>
          <option value="share_create">Создание ссылки</option>
          <option value="share_view">Просмотр ссылки</option>
        </select>
        <button onClick={fetchLogs} disabled={loading} style={{ padding: '8px 20px', background: '#a78bfa', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {loading ? 'Загрузка...' : 'Применить'}
        </button>
      </div>

      {/* Таблица */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={th}>Время</th>
              <th style={th}>Пользователь</th>
              <th style={th}>Действие</th>
              <th style={th}>Сущность</th>
              <th style={th}>IP</th>
              <th style={th}>Детали</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={td}>{formatTime(log.created_at)}</td>
                <td style={td}>
                  {log.username ? (
                    <span title={log.user_email}>{log.username}</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>
                <td style={td}>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '4px 10px', 
                    background: `${getActionColor(log.action_type)}20`, 
                    color: getActionColor(log.action_type),
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {log.action_type}
                  </span>
                </td>
                <td style={td}>
                  {log.entity_type && log.entity_id 
                    ? `${log.entity_type} #${log.entity_id}` 
                    : '—'}
                </td>
                <td style={td}>{log.ip_address || '—'}</td>
                <td style={td}>
                  {log.metadata ? (
                    <code style={{ fontSize: '11px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                      {JSON.stringify(log.metadata).slice(0, 50)}...
                    </code>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
            Нет записей для отображения
          </p>
        )}
      </div>
    </div>
  );
}

const th = { padding: '12px 16px', fontWeight: '600', fontSize: '13px', color: '#475569' };
const td = { padding: '12px 16px', fontSize: '14px', color: '#1e293b' };