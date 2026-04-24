import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Если токена нет в URL — показываем ошибку
  if (!token) {
    return (
      <div className="reset-page">
        <div className="reset-box">
          <h1>Ссылка недействительна</h1>
          <p>Токен сброса пароля отсутствует или истёк. Попробуйте запросить восстановление снова.</p>
          <Link to="/forgot-password" className="btn">Запросить сброс</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');

      setMessage('✅ Пароль успешно изменён! Перенаправляем на вход...');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-box">
        <Link to="/auth" className="home-link">
          <i className="fas fa-arrow-left"></i> На главную
        </Link>

        <h1>Установите новый пароль</h1>
        <p>Придумайте надёжный пароль для вашего аккаунта.</p>

        <form onSubmit={handleSubmit}>
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

        <div className="back-link">
          <Link to="/auth">← Вернуться к входу</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;