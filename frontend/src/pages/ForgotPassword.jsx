import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Определяем режим: 'forgot' или 'reset'
  const mode = searchParams.get('token') ? 'reset' : 'forgot';
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔹 Отправка запроса на сброс (режим forgot)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setMessage('✅ Проверьте почту. Ссылка для сброса отправлена!');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Установка нового пароля (режим reset)
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
      return;
    }
    
    setLoading(true);
    const token = searchParams.get('token');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      
      setMessage('✅ Пароль успешно изменён! Перенаправляем на вход...');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-box">
        <Link to="/auth" className="home-link">
          <i className="fas fa-arrow-left"></i> На главную
        </Link>

        {mode === 'forgot' ? (
          // 📧 ФОРМА ЗАПРОСА СБРОСА
          <>
            <h1>Забыли пароль?</h1>
            <p>Введите ваш email, и мы отправим инструкции для восстановления.</p>
            
            <form onSubmit={handleForgotSubmit}>
              <div className="input-box">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <i className="bx bx-envelope"></i>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}
              
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить инструкции'}
              </button>
            </form>
          </>
        ) : (
          // 🔐 ФОРМА УСТАНОВКИ НОВОГО ПАРОЛЯ
          <>
            <h1>Новый пароль</h1>
            <p>Придумайте надёжный пароль для вашего аккаунта.</p>
            
            <form onSubmit={handleResetSubmit}>
              <div className="input-box">
                <input
                  type="password"
                  placeholder="Новый пароль (мин. 8 символов)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <i className="bx bx-lock-alt"></i>
              </div>
              
              <div className="input-box">
                <input
                  type="password"
                  placeholder="Подтвердите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <i className="bx bx-lock-alt"></i>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}
              
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
              </button>
            </form>
          </>
        )}

        <div className="back-link">
          <Link to="/auth">← Вернуться к входу</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;