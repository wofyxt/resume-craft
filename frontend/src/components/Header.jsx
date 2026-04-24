import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header>
      <div className="container">
        <nav className="nav-container">
          <Link to="/" className="logo">
            <i className="fas fa-file-alt"></i>
            <span>ResumeCraft</span>
          </Link>
          <div className="nav-links">
            <a href="/#features">Возможности</a>
            <a href="/#about">О нас</a>
            <a href="/#testimonials">Отзывы</a>
            <a href="/#how-it-works">Как это работает</a>
          </div>
          <div className="auth-buttons">
            {user ? (
              <>
                <Link to="/dashboard" className="btn-profile">
                  <img src={ user.avatar_url } alt="Личный кабинет" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn btn-outline">Войти</Link>
                <Link to="/auth" className="btn btn-primary">Регистрация</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;