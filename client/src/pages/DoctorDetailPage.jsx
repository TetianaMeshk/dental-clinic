import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaGraduationCap, FaBriefcase, FaArrowLeft } from 'react-icons/fa';
import AppointmentComponent from '../components/AppointmentComponent';
import './DoctorDetailPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DoctorDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const doctorNameFromState = location.state?.doctorName;

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/doctors`);
        const foundDoctor = response.data.find(d => d.id === id);
        
        if (foundDoctor) {
          setDoctor(foundDoctor);
        } else if (doctorNameFromState) {
          setDoctor({
            id,
            name: doctorNameFromState,
            specialty: 'Стоматолог',
            description: 'Детальна інформація про лікаря',
            education: 'Медичний університет',
            experience: '10',
            rating: 4.8,
            photo: 'https://via.placeholder.com/400x500',
            services: ['Консультація', 'Лікування']
          });
        }
      } catch (error) {
        console.error('Помилка при отриманні лікаря:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id, doctorNameFromState]);

  const handleBookAppointment = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleBack = () => {
    navigate('/doctors');
  };

  if (loading) {
    return (
      <section className="doctor-detail-section">
        <div className="container">
          <button className="back-btn" onClick={handleBack}>
            <FaArrowLeft /> Назад до лікарів
          </button>
          <div className="loading">Завантаження інформації про лікаря...</div>
        </div>
      </section>
    );
  }

  if (!doctor) {
    return (
      <section className="doctor-detail-section">
        <div className="container">
          <button className="back-btn" onClick={handleBack}>
            <FaArrowLeft /> Назад до лікарів
          </button>
          <div className="loading">Лікар не знайдено</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="doctor-detail-section">
        <div className="container">
          <button className="back-btn" onClick={handleBack}>
            <FaArrowLeft /> Назад до лікарів
          </button>
          
          <div className="doctor-detail-container">
            <div className="doctor-detail-image">
              <img 
                src={doctor.photo || 'https://via.placeholder.com/400x500'} 
                alt={doctor.name}
              />
            </div>
            
            <div className="doctor-detail-info">
              <h1 className="doctor-detail-name">{doctor.name}</h1>
              <p className="doctor-detail-specialty">{doctor.specialty}</p>
              
              <div className="doctor-detail-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={i < Math.floor(doctor.rating || 5) ? 'star filled' : 'star'}
                  />
                ))}
                <span className="rating-value">{doctor.rating || '5.0'}</span>
              </div>
              
              <div className="doctor-detail-education">
                <h3><FaGraduationCap /> Освіта</h3>
                <p>{doctor.education || 'Медичний університет'}</p>
              </div>
              
              <div className="doctor-detail-experience">
                <h3><FaBriefcase /> Досвід роботи</h3>
                <p>{doctor.experience || '10'} років</p>
              </div>
              
              <div className="doctor-detail-description">
                <h3>Про лікаря</h3>
                <p>{doctor.description || 'Висококваліфікований спеціаліст з багаторічним досвідом роботи.'}</p>
              </div>
              
              {doctor.services && doctor.services.length > 0 && (
                <div className="doctor-detail-services">
                  <h3>Надає послуги</h3>
                  <ul>
                    {doctor.services.map((service, index) => (
                      <li key={index}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="doctor-detail-actions">
                <button 
                  className="btn btn-primary appointment-btn"
                  onClick={handleBookAppointment}
                >
                  Записатись на прийом до {doctor.name.split(' ')[2] || 'лікаря'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AppointmentComponent 
              isModal={true}
              selectedDoctor={doctor.name}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorDetailPage;