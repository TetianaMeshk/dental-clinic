import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Стоматологічна клініка "Здорова Посмішка"</h1>
            <p className="hero-subtitle">Професійний догляд за вашими зубами з турботою та любов'ю</p>
            <button className="btn btn-primary" onClick={() => {
              document.getElementById('appointment-form')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Записатись на прийом
            </button>
          </div>
        </div>
      </section>
      
      <section className="why-us">
        <div className="container">
          <h2 className="section-title">Чому обирають нас?</h2>
          <div className="reasons-grid">
            <div className="reason-card">
              <div className="reason-icon">👨‍⚕️</div>
              <h3>Досвідчені спеціалісти</h3>
              <p>Наші лікарі мають понад 10 років досвіду та регулярно проходять навчання</p>
            </div>
            
            <div className="reason-card">
              <div className="reason-icon">🦷</div>
              <h3>Сучасне обладнання</h3>
              <p>Використовуємо тільки новітню техніку для якісного та безболісного лікування</p>
            </div>
            
            <div className="reason-card">
              <div className="reason-icon">💳</div>
              <h3>Доступні ціни</h3>
              <p>Пропонуємо гнучкі ціни та можливість оплати частинами</p>
            </div>
            
            <div className="reason-card">
              <div className="reason-icon">🕒</div>
              <h3>Зручний графік</h3>
              <p>Працюємо з понеділка по суботу, приймаємо пацієнтів до 20:00</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;