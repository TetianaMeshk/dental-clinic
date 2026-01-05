import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import AppointmentComponent from './AppointmentComponent';
import './Services.css';

const API_BASE_URL = 'https://dental-clinic-server-e4mh.onrender.com';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/services`);
        setServices(response.data);
      } catch (error) {
        console.error('Помилка при отриманні послуг:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    
    if (location.state?.selectedService) {
      setSelectedService(location.state.selectedService);
      setShowModal(true);
    }
  }, [location.state]);

  const handleBookAppointment = (serviceName) => {
    setSelectedService(serviceName);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedService('');
  };

  if (loading) {
    return (
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">Повний перелік послуг</h2>
          <div className="loading">Завантаження послуг...</div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return (
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">Повний перелік послуг</h2>
          <div className="loading">Послуги не знайдено</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">Повний перелік послуг</h2>
          <div className="services-grid">
            {services.map(service => (
              <div key={service.id} className="service-card">
                <h3 className="service-title">{service.name}</h3>
                <p className="service-description">{service.description || 'Опис послуги'}</p>
                
                {service.details && Array.isArray(service.details) && service.details.length > 0 && (
                  <div className="service-details">
                    <h4>Процедура включає:</h4>
                    <ul>
                      {service.details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="service-price">
                  <div className="price-info">
                    <span className="price">від {service.price || '0'} грн</span>
                    <span className="duration">{service.duration || '30 хв'}</span>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleBookAppointment(service.name)}
                  >
                    Записатись на прийом
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AppointmentComponent 
              isModal={true}
              selectedService={selectedService}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Services;