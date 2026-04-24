import Header from '../components/Header';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import TestimonialsSlider from '../components/TestimonialsSlider';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    { icon: 'fas fa-palette', title: '30+ профессиональных шаблонов', desc: 'Выбирайте из современных дизайнов, которые подходят для любой сферы деятельности' },
    { icon: 'fas fa-magic', title: 'Умные подсказки', desc: 'Наш AI анализирует ваши данные и предлагает оптимальные формулировки для вашего опыта' },
    { icon: 'fas fa-file-export', title: 'Экспорт в один клик', desc: 'Скачайте готовое резюме в PDF, Word или поделитесь прямой ссылкой с работодателем' },
    { icon: 'fas fa-chart-line', title: 'Аналитика просмотров', desc: 'Узнайте, сколько раз просмотрели ваше резюме и кто из работодателей проявил интерес' },
    { icon: 'fas fa-mobile-alt', title: 'Полная мобильная версия', desc: 'Редактируйте и создавайте резюме прямо с вашего смартфона в любое время' },
    { icon: 'fas fa-lock', title: 'Конфиденциальность', desc: 'Ваши данные защищены и никогда не передаются третьим лицам без вашего согласия' },
  ];

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <div className="hero-text">
                <h1>Создайте <span>идеальное резюме</span> за несколько минут</h1>
                <p>ResumeCraft поможет вам выделиться среди сотен кандидатов. Профессиональные шаблоны, умные подсказки и экспорт в один клик. Начните бесплатно и получите работу мечты!</p>
                <Link to="/editor" className="btn btn-primary">Создать резюме сейчас</Link>
              </div>
              <div className="hero-image">
                <div className="floating-card card-1">
                  <h3>Алексей Петров</h3>
                  <p>Frontend Developer</p>
                  <p>5 лет опыта</p>
                </div>
                <div className="floating-card card-2">
                  <h3>Мария Иванова</h3>
                  <p>Project Manager</p>
                  <p>8 лет опыта</p>
                </div>
                <div className="floating-card card-3">
                  <h3>Дмитрий Смирнов</h3>
                  <p>Data Scientist</p>
                  <p>4 года опыта</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features" id="features">
          <div className="container">
            <div className="section-title">
              <h2>Что вы получите после регистрации</h2>
              <p>Все инструменты для создания профессионального резюме, которое заметят рекрутеры</p>
            </div>
            <div className="features-grid">
              {features.map((f, i) => (
                <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialsSlider />

        {/* About */}
        <section className="about" id="about">
          <div className="container">
            <div className="about-content">
              <div className="about-text">
                <h2>О компании ResumeCraft</h2>
                <p>ResumeCraft был основан в 2026 году командой HR-специалистов и разработчиков, которые заметили проблему: большинство соискателей используют устаревшие шаблоны резюме, которые не проходят через системы автоматического отбора (ATS).</p>
                <p>Наша миссия - помочь каждому специалисту представить свои навыки и опыт в самом выгодном свете, используя современные форматы и рекомендации экспертов по подбору персонала.</p>
                <p>Сегодня ResumeCraft используют более 500 000 специалистов по всему миру, и мы продолжаем развивать платформу, добавляя новые функции и шаблоны.</p>
                <div className="stats">
                  <div className="stat-item">
                    <div className="stat-number">500K+</div>
                    <div className="stat-label">Пользователей</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">30+</div>
                    <div className="stat-label">Шаблонов</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">95%</div>
                    <div className="stat-label">Довольных клиентов</div>
                  </div>
                </div>
              </div>
              <div className="about-visual">
                <div className="visual-element visual-1">
                  <i className="fas fa-users"></i>
                </div>
                <div className="visual-element visual-2">
                  <i className="fas fa-trophy"></i>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="container">
            <h2>Готовы создать резюме, которое выделит вас?</h2>
            <p>Присоединяйтесь к 500 000+ профессионалов, которые уже используют ResumeCraft для развития своей карьеры. Начните бесплатно — никаких скрытых платежей.</p>
            <Link to="/editor" className="btn btn-primary" style={{ backgroundColor: 'white', color: 'var(--highlight)' }}>
              Начать бесплатно <i className="fas fa-arrow-right" style={{ marginLeft: '10px' }}></i>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;