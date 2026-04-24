import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Dashboard.css';
// 🔥 Добавь этот импорт
import ResumeList from '../components/ResumeList';

const Dashboard = () => {
  const { user, logout, updateAvatar, removeAvatar } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');

  // 🔹 Состояния для аватара
  const [isUploading, setIsUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // 🔹 Состояния для формы профиля
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState('');
const [isDeleting, setIsDeleting] = useState(false);
  // Инициализация формы данными из user
  useEffect(() => {
    if (user) {
      setEditUsername(user.username || '');
      setEditEmail(user.email || '');
    }
  }, [user]);

  // 🔹 Обработчик загрузки аватара
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setAvatarError('');
    setAvatarMessage('');

    try {
      await updateAvatar(file);
      setAvatarMessage('✅ Аватар обновлён');
      e.target.value = null; // сброс input для повторной загрузки
    } catch (err) {
      setAvatarError(err.message || 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };

  // 🔹 Обработчик удаления аватара
  const handleRemoveAvatar = async () => {
    if (!window.confirm('Удалить аватар?')) return;
    try {
      await removeAvatar();
      setAvatarMessage('🗑️ Аватар удалён');
    } catch (err) {
      setAvatarError(err.message || 'Ошибка удаления');
    }
  };

  // 🔹 Обработчик сохранения профиля
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setIsSaving(true);

    // Валидация
    if (editPassword && editPassword !== editConfirmPassword) {
      setProfileError('Пароли не совпадают');
      setIsSaving(false);
      return;
    }
    if (editPassword && editPassword.length < 8) {
      setProfileError('Пароль должен содержать минимум 8 символов');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
          password: editPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');

      setProfileMessage('✅ Профиль обновлён');
      // Очищаем поля пароля после успеха
      setEditPassword('');
      setEditConfirmPassword('');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 🔹 Выход из аккаунта
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Если пользователь не загружен — показываем загрузку
  if (!user) {
    return (
      <div className="dashboard-container">
        <Header />
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p>Загрузка данных профиля...</p>
        </div>
        <Footer />
      </div>
    );
  }
// 🔥 Удаление аккаунта
const handleDeleteAccount = async () => {
  if (!window.confirm('⚠️ Вы уверены? Все данные будут удалены навсегда.')) return;
  
  setIsDeleting(true);
  setDeleteError('');
  
  try {
    const res = await fetch('/api/users/account', {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка удаления');
    
    logout();
    navigate('/');
    alert('✅ Аккаунт удалён');
  } catch (err) {
    setDeleteError(err.message);
  } finally {
    setIsDeleting(false);
  }
};
  return (
    <div className="dashboard-container">
      <Header />

      <div className="container">
        <div className="dashboard-header">
          <h1>Личный кабинет</h1>
          <div className="user-info">
            <span>Привет, { user.username }!</span>
            <button onClick={handleLogout} className="btn btn-outline">
              Выйти
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Сайдбар */}
          <aside className="sidebar">
            <div className="user-profile">
              <div className="avatar">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Avatar" 
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      objectFit: 'cover' 
                    }} 
                  />
                ) : (
                  <i className="fas fa-user" style={{ fontSize: '80px' }}></i>
                )}
              </div>
              <h3>{user.username}</h3>
              <p>{user.email}</p>
            </div>

            <nav className="dashboard-nav">
              <ul>
                <li 
                  className={activeSection === 'profile' ? 'active' : ''}
                  onClick={() => setActiveSection('profile')}
                >
                  <i className="fas fa-user-edit"></i> Профиль
                </li>
                <li 
                  className={activeSection === 'resumes' ? 'active' : ''}
                  onClick={() => setActiveSection('resumes')}
                >
                  <i className="fas fa-file-alt"></i> Мои резюме
                </li>
                <li 
                  className={activeSection === 'settings' ? 'active' : ''}
                  onClick={() => setActiveSection('settings')}
                >
                  <i className="fas fa-cog"></i> Настройки
                </li>
              </ul>
            </nav>
          </aside>

          {/* Основной контент */}
          <main className="main-content">
            {/* 🔹 СЕКЦИЯ ПРОФИЛЯ */}
            {activeSection === 'profile' && (
              <div className="profile-section">
                <h2>Редактирование профиля</h2>

                {/* Блок загрузки аватара */}
                <div className="avatar-upload-section" style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div className="avatar-preview" style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0 auto 15px',
                    border: '3px solid var(--highlight)',
                    background: '#f0f0f0'
                  }}>
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt="Avatar" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                        color: 'var(--highlight)'
                      }}>
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                  </div>
                
                  <input
                    type="file"
                    id="avatar-input"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button 
                      type="button"
                      onClick={() => document.getElementById('avatar-input').click()}
                      className="btn btn-outline"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                      disabled={isUploading}
                    >
                      <>
                        <i className="fas fa-upload"></i> {isUploading ? 'Загрузка...' : 'Загрузить аватар'}
                      </>
                    </button>
                  
                    {user.avatar_url && (
                      <button 
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="btn btn-danger"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                        disabled={isUploading}
                      >
                        <>
                          <i className="fas fa-trash"></i> Удалить
                        </>
                      </button>
                    )}
                  </div>
                
                  {avatarMessage && (
                    <div className="success-message" style={{ marginTop: '10px', textAlign: 'left' }}>
                      {avatarMessage}
                    </div>
                  )}
                  {avatarError && (
                    <div className="error-message" style={{ marginTop: '10px', textAlign: 'left' }}>
                      {avatarError}
                    </div>
                  )}
                </div>

                {/* Форма профиля */}
                <form onSubmit={handleProfileSave} className="profile-form">
                  <div className="form-group">
                    <label>Имя пользователя</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Новый пароль (оставьте пустым, если не меняете)</label>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Подтвердите новый пароль</label>
                    <input
                      type="password"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                    />
                  </div>
                  {profileError && <div className="error-message">{profileError}</div>}
                  {profileMessage && <div className="success-message">{profileMessage}</div>}
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </form>
                {/* 🔥 Опасная зона — кнопка удаления */}
{deleteError && <div className="error-message" style={{marginTop: '15px'}}>{deleteError}</div>}

<div style={{ 
  marginTop: '40px', 
  paddingTop: '20px', 
  borderTop: '2px solid #fee2e2' 
}}>

  <p style={{ 
    fontSize: '14px', 
    color: '#64748b', 
    marginBottom: '15px', 
    lineHeight: '1.5' 
  }}>
    После удаления аккаунта все ваши данные, резюме и история действий будут <strong>безвозвратно удалены</strong>.
  </p>
  <button
    type="button"
    onClick={handleDeleteAccount}
    disabled={isDeleting}
    className="btn"
    style={{
      background: '#fee2e2',
      color: '#dc2626',
      border: '1px solid #fecaca',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: isDeleting ? 'not-allowed' : 'pointer',
      opacity: isDeleting ? 0.7 : 1,
      transition: '0.2s'
    }}
  >
    {isDeleting ? '⏳ Удаление...' : ' Удалить аккаунт'}
  </button>
</div>
              </div>
            )}

            {/* 🔹 СЕКЦИЯ РЕЗЮМЕ */}
            {activeSection === 'resumes' && (
              <div className="resumes-section">
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => navigate('/editor/new')}>
                    <i className="fas fa-plus"></i> Создать резюме
                  </button>
                </div>
                <div className="resumes-list">
                  <h2>Мои резюме</h2>
                  <div className="resume-cards">
        <ResumeList userId={user?.id} /> {/* 🔥 Новый компонент */}
      </div>
                </div>
              </div>
            )}

            {/* 🔹 СЕКЦИЯ НАСТРОЕК */}
            {activeSection === 'settings' && (
              <div className="settings-section">
                <h2>Настройки</h2>
                <p>Функционал настроек будет добавлен позже.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;