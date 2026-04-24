const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <div className="logo" style={{ color: 'white', marginBottom: '25px' }}>
              <i className="fas fa-file-alt"></i>
              <span>ResumeCraft</span>
            </div>
            <p style={{ color: '#cbd5e0', marginBottom: '20px' }}>Помогаем профессионалам находить работу мечты с 2026 года.</p>
            <div className="social-links">
              <a href="#" className="social-icon"><i className="fab fa-vk"></i></a>
              <a href="#" className="social-icon"><i className="fab fa-telegram"></i></a>
            </div>
          </div>
          <div className="footer-column">
            <h3>Продукт</h3>
            <ul className="footer-links">
              <li><a href="#">Шаблоны резюме</a></li>
              <li><a href="#">Примеры резюме</a></li>
              <li><a href="#">Советы по карьере</a></li>
              <li><a href="#">Частые вопросы</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Компания</h3>
            <ul className="footer-links">
              <li><a href="#">О нас</a></li>
              <li><a href="#">Наша команда</a></li>
              <li><a href="#">Блог</a></li>
              <li><a href="#">Контакты</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Правовая информация</h3>
            <ul className="footer-links">
              <li><a href="#">Политика конфиденциальности</a></li>
              <li><a href="#">Условия использования</a></li>
              <li><a href="#">Пользовательское соглашение</a></li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; 2026 ResumeCraft. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;