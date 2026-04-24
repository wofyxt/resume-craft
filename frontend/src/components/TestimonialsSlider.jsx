import { useState, useEffect } from 'react';

const TestimonialsSlider = () => {
  const testimonials = [
    {
      name: 'Анна Козлова',
      role: 'Marketing Manager, получила оффер через 2 недели',
      text: 'ResumeCraft полностью изменил мой подход к поиску работы. После использования одного из шаблонов и рекомендаций системы, я получила в 3 раза больше откликов. Сейчас работаю в международной компании на позиции Senior Marketing Manager.',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    },
    {
      name: 'Игорь Васильев',
      role: 'Backend Developer, нашел работу за 3 недели',
      text: 'Как IT-специалист, я ценю удобство и функциональность. Этот сервис превзошел все мои ожидания. Особенно порадовала возможность экспорта в PDF без искажения форматирования. Благодаря ResumeCraft я нашел работу с зарплатой на 40% выше предыдущей.',
      avatar: 'https://randomuser.me/api/portraits/men/54.jpg',
    },
    {
      name: 'Екатерина Соколова',
      role: 'HR Specialist, нашла работу за 10 дней',
      text: 'Переезжала в другой город и нужно было быстро обновить резюме. С ResumeCraft я создала профессиональное резюме за вечер. Подсказки по заполнению помогли правильно описать мой опыт. Уже через 10 дней у меня было 5 приглашений на собеседование!',
      avatar: 'https://randomuser.me/api/portraits/women/67.jpg',
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const goTo = (index) => setCurrent(index);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((current + 1) % testimonials.length);

  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="section-title">
          <h2>Отзывы наших пользователей</h2>
          <p>Узнайте, как ResumeCraft помог тысячам специалистов получить работу мечты</p>
        </div>

        <div className="slider-container">
          <div className="slider-track" style={{ transform: `translateX(-${current * 100}%)` }}>
            {testimonials.map((t, idx) => (
              <div className="slide" key={idx}>
                <div className="user-avatar">
                  <img src={t.avatar} alt={t.name} />
                </div>
                <p className="testimonial-text">{t.text}</p>
                <div className="user-info">
                  <h4>{t.name}</h4>
                  <p>{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="slider-arrow prev" onClick={prev}>
            <i className="fas fa-chevron-left"></i>
          </div>
          <div className="slider-arrow next" onClick={next}>
            <i className="fas fa-chevron-right"></i>
          </div>

        </div>
        <div className="slider-nav">
          {testimonials.map((_, idx) => (
            <div
              key={idx}
              className={`slider-dot ${idx === current ? 'active' : ''}`}
              onClick={() => goTo(idx)}
            ></div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSlider;