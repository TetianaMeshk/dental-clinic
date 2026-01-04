import React from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Контакти</h3>
            <div className="contact-info">
              <p><FaPhone /> +38 (099) 123-45-67</p>
              <p><FaEnvelope /> info@dentalclinic.com</p>
              <p><FaMapMarkerAlt /> м. Київ, вул. Здоров'я, 123</p>
              <p><FaClock /> Пн-Пт: 9:00-20:00, Сб: 10:00-18:00</p>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Швидкі посилання</h3>
            <ul className="footer-links">
              <li><a href="/services">Послуги</a></li>
              <li><a href="/doctors">Лікарі</a></li>
              <li><a href="#appointment-form">Запис на прийом</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Про клініку</h3>
            <p>Сучасна стоматологічна клініка з висококваліфікованими спеціалістами та новітнім обладнанням.</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Dental Clinic. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;