import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './HomeServices.css';

const HomeServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Отримуємо послуги з сервера
        const response = await axios.get('http://localhost:5000/api/services');
        // Беремо тільки 3 послуги для головної сторінки
        const servicesList = response.data.slice(0, 3);
        setServices(servicesList);
      } catch (error) {
        console.error('Помилка при отриманні послуг:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return <div className="loading">Завантаження послуг...</div>;
  }

  if (services.length === 0) {
    return <div className="loading">Послуги не знайдено</div>;
  }

  return (
    <section className="home-services">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Наші послуги</h2>
          <p className="section-subtitle">Основні послуги, які ми пропонуємо для вашої здорової посмішки</p>
        </div>
        
        <div className="services-preview-grid">
          {services.map(service => (
            <div key={service.id} className="service-preview-card">
              {/* Видалено блок з іконкою */}
              <h3 className="service-preview-title">{service.name}</h3>
              <p className="service-preview-description">
                {service.description && service.description.length > 80 
                  ? `${service.description.substring(0, 80)}...` 
                  : service.description || 'Опис послуги'}
              </p>
              <div className="service-preview-footer">
                <span className="service-preview-price">від {service.price || '0'} грн</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="view-all-container">
          <Link to="/services" className="btn view-all-btn">
            Переглянути всі послуги
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeServices;