import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';


const Auth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isActive, setIsActive] = useState(false);
  
  // 🔹 Состояния для входа
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // 🔹 CAPTCHA состояния
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // 🔹 Состояния для регистрации
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  // 🔹 Проверка количества неудачных попыток при загрузке
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('login_attempts') || '0');
    if (attempts >= 3) {
      setCaptchaRequired(true);
      generateCaptcha();
    }
  }, []);

  // 🔹 Генерация простой математической капчи
  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`${a} + ${b} = ?`);
    setCaptchaAnswer(a + b);
    setCaptchaInput('');
    setCaptchaError('');
  };

  // 🔹 Сброс счётчика попыток (при успешном входе)
  const resetLoginAttempts = () => {
    localStorage.removeItem('login_attempts');
    setCaptchaRequired(false);
  };

  // 🔹 Увеличение счётчика неудачных попыток
  const incrementLoginAttempts = () => {
    const attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
    localStorage.setItem('login_attempts', attempts.toString());
    
    if (attempts >= 3 && !captchaRequired) {
      setCaptchaRequired(true);
      generateCaptcha();
    }
  };

  const handleShowRegister = () => setIsActive(true);
  const handleShowLogin = () => setIsActive(false);

  // Валидация пароля
  const validatePassword = (password) => {
    if (password.length < 8) return 'Пароль должен содержать не менее 8 символов';
    if (!/\d/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
    if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву';
    return null;
  };

  // 🔑 Обработчик ВХОДА
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    setCaptchaError('');
    setIsLoginLoading(true);

    // 🔹 Проверка CAPTCHA, если она требуется
    if (captchaRequired) {
      if (parseInt(captchaInput) !== captchaAnswer) {
        setCaptchaError('Неверный ответ. Попробуйте ещё раз.');
        generateCaptcha();
        setIsLoginLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        incrementLoginAttempts(); // 🔹 Увеличиваем счётчик при ошибке
        throw new Error(data.error || 'Ошибка входа');
      }

      // ✅ Успешный вход — сбрасываем счётчик
      resetLoginAttempts();
      
      login(data.user);
      setLoginSuccess('Успешный вход! Перенаправление...');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setIsLoginLoading(false);
    }
  };

  // 📝 Обработчик РЕГИСТРАЦИИ (без изменений)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setIsRegLoading(true);

    if (!regUsername || !regEmail || !regPassword) {
      setRegError('Заполните все поля');
      setIsRegLoading(false);
      return;
    }

    const passwordError = validatePassword(regPassword);
    if (passwordError) {
      setRegError(passwordError);
      setIsRegLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');

      setRegSuccess('Регистрация прошла успешно! Перенаправляем на вход...');
      setTimeout(() => {
        setIsActive(false);
        setRegUsername(''); setRegEmail(''); setRegPassword('');
        setLoginSuccess('Аккаунт создан. Теперь войдите.');
      }, 1500);
    } catch (err) {
      setRegError(err.message);
    } finally {
      setIsRegLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="home-link"><i className="bx bx-home-alt"></i> На главную</Link>
      <div className={`auth-container ${isActive ? 'active' : ''}`}>
        
        {/* Форма входа */}
        <div className="form-box login">
          <form onSubmit={handleLoginSubmit}>
            <h1>Вход</h1>
            
            {loginError && <div className="error-message">{loginError}</div>}
            {loginSuccess && <div className="success-message">{loginSuccess}</div>}
            
            <div className="input-box">
              <input 
                type="text" 
                placeholder="Адрес электронной почты" 
                value={loginUsername} 
                onChange={(e) => setLoginUsername(e.target.value)} 
                required 
              />
              <i className="bx bx-user"></i>
            </div>
            
            <div className="input-box">
              <input 
                type="password" 
                placeholder="Пароль" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                required 
              />
              <i className="bx bx-lock-alt"></i>
            </div>

            {/* 🔹 CAPTCHA — показывается после 3 неудачных попыток */}
            {captchaRequired && (
              <div className="captcha-box" style={{ 
                background: '#f8fafc', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                margin: '15px 0',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <span style={{ 
                    fontWeight: '600', 
                    fontSize: '18px', 
                    letterSpacing: '2px',
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    userSelect: 'none'
                  }}>
                    {captchaQuestion}
                  </span>
                  <button 
                    type="button" 
                    onClick={generateCaptcha}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px'
                    }}
                    title="Обновить"
                  >
                    <i className="bx bx-refresh"></i>
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Ваш ответ"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}
                />
                {captchaError && (
                  <span className="error" style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {captchaError}
                  </span>
                )}
              </div>
            )}

            <Link to="/forgot-password" className="forgot-link">Забыли пароль?</Link>
            
            <button type="submit" className="btn" disabled={isLoginLoading}>
              {isLoginLoading ? 'Отправка...' : 'Войти'}
            </button>
          </form>
        </div>

        {/* Форма регистрации */}
        <div className="form-box register">
          <form onSubmit={handleRegisterSubmit}>
            <h1>Регистрация</h1>
            {regError && <div className="error-message">{regError}</div>}
            {regSuccess && <div className="success-message">{regSuccess}</div>}
            
            <div className="input-box">
              <input type="text" placeholder="Имя пользователя" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required />
              <i className="bx bx-user"></i>
            </div>
            <div className="input-box">
              <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              <i className="bx bx-envelope"></i>
            </div>
            <div className="input-box">
              <input type="password" placeholder="Пароль" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
              <i className="bx bx-lock-alt"></i>
            </div>
            <button type="submit" className="btn" disabled={isRegLoading}>{isRegLoading ? 'Отправка...' : 'Зарегистрироваться'}</button>
          </form>
        </div>

        {/* Блок переключателя */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Здравствуйте!</h1>
            <p>Ещё нет аккаунта?</p>
            <button className="btn register-btn" onClick={handleShowRegister}>Регистрация</button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>С возвращением!</h1>
            <p>Уже есть аккаунт?</p>
            <button className="btn login-btn" onClick={handleShowLogin}>Вход</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;