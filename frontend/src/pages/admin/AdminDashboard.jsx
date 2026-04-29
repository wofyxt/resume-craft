import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 🔥 Для подсветки активной ссылки

  const handleLogout = () => { logout(); navigate('/admin-login'); };

  // 🔹 Хелпер для определения активной ссылки
  const isActive = (path) => location.pathname === path;

  // 🔹 Стили для ссылок (вынесены для чистоты кода)
  const getLinkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    color: isActive(path) ? '#181818' : 'rgba(24, 24, 24, 0.85)',
    background: isActive(path) ? '#f4f3ec' : 'transparent',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: isActive(path) ? '600' : '500',
    fontSize: '15px',
    transition: 'all 0.2s ease',
    borderLeft: isActive(path) ? '4px solid #a78bfa' : '4px solid transparent',
    boxShadow: isActive(path) ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
  });

  const handleLinkHover = (e) => {
    e.currentTarget.style.background = 'rgba(244, 243, 236, 0.6)';
    e.currentTarget.style.transform = 'translateX(4px)';
  };
  
  const handleLinkLeave = (e) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.transform = 'translateX(0)';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* 🎨 SIDEBAR */}
      <aside style={{
        width: '260px',
        background: 'linear-gradient(180deg, #a78bfa 0%, #9375db 100%)',
        color: '#fff',
        padding: '24px 20px',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Заголовок */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          marginBottom: '36px', 
          paddingBottom: '20px',
          borderBottom: '2px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', letterSpacing: '0.3px' }}>
            Админ-панель
          </h3>
        </div>

        {/* Навигация */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Link 
            to="/admin/stats" 
            style={getLinkStyle('/admin/stats')}
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            <span style={{ fontSize: '18px' }}>📊</span>
            Статистика
          </Link>
          
          <Link 
            to="/admin/users" 
            style={getLinkStyle('/admin/users')}
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            <span style={{ fontSize: '18px' }}>👥</span>
            Пользователи
          </Link>
          
          <Link 
            to="/admin/templates" 
            style={getLinkStyle('/admin/templates')}
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            <span style={{ fontSize: '18px' }}>🎨</span>
            Шаблоны
          </Link>

         
<Link 
  to="/admin/logs" 
  style={getLinkStyle('/admin/logs')}
  onMouseEnter={handleLinkHover}
  onMouseLeave={handleLinkLeave}
>
  <span style={{ fontSize: '18px' }}>📋</span>
  Логи
</Link>
{/* В навигации сайдбара, после Templates */}
<Link 
  to="/admin/reviews" 
  style={getLinkStyle('/admin/reviews')}
  onMouseEnter={handleLinkHover}
  onMouseLeave={handleLinkLeave}
>
  <span style={{ fontSize: '18px' }}>⭐</span>
  Отзывы
</Link>
        </nav>

        {/* Кнопка выхода — внизу сайдбара */}
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            marginTop: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '18px' }}>🚪</span>
          Выйти из админки
        </button>
      </aside>

      {/* 📄 MAIN CONTENT */}
      <main style={{ 
        flex: 1, 
        padding: '40px', 
        background: '#f8fafc',
        overflowY: 'auto'
      }}>
        <Outlet />
      </main>
    </div>
  );
}