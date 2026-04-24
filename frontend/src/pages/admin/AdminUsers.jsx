import { useEffect, useState } from 'react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    const res = await fetch(`/api/admin/users?search=${search}`, { credentials: 'include' });
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const toggleBlock = async (id) => {
    const res = await fetch(`/api/admin/users/${id}/block`, { method: 'PUT', credentials: 'include' });
    if (res.ok) fetchUsers();
  };

  return (
    <div>
      <h2>👥 Управление пользователями</h2>
      <input placeholder="Поиск по имени/email..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
      <table style={{ width: '100%', marginTop: '20px', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <thead><tr style={{ background: '#f1f5f9', textAlign: 'left' }}><th style={th}>ID</th><th style={th}>Имя</th><th style={th}>Email</th><th style={th}>Статус</th><th style={th}>Действие</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={td}>{u.id}</td>
              <td style={td}>{u.name}</td>
              <td style={td}>{u.email}</td>
              <td style={td}>{u.is_blocked ? '🔴 Заблок.' : '🟢 Активен'}</td>
              <td style={td}>
                <button onClick={() => toggleBlock(u.id)} style={u.is_blocked ? btnUnblock : btnBlock}>
                  {u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const inputStyle = { padding: '10px', width: '300px', borderRadius: '6px', border: '1px solid #ccc' };
const th = { padding: '12px' }; const td = { padding: '12px' };
const btnBlock = { padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const btnUnblock = { padding: '6px 12px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '4px', cursor: 'pointer' };