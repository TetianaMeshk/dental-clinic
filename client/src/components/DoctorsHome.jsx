import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DoctorsHome.css';

const API_BASE_URL = 'https://dental-clinic-server-e4mh.onrender.com';

const DoctorsHome = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/doctors`);
        const sortedDoctors = response.data.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        });
        const topDoctors = sortedDoctors.slice(0, 3);
        setDoctors(topDoctors);
      } catch (error) {
        console.error('Помилка при отриманні лікарів:', error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleDoctorClick = (doctorId, doctorName) => {
    navigate(`/doctors/${doctorId}`, { state: { doctorName } });
  };

  if (loading) {
    return <div className="loading">Завантаження інформації про лікарів...</div>;
  }

  if (doctors.length === 0) {
    return <div className="loading">Лікарів не знайдено</div>;
  }

  return (
    <section className="doctors-home-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Наші лікарі</h2>
          <p className="section-subtitle">Професійна команда стоматологів з багаторічним досвідом</p>
        </div>
        
        <div className="doctors-home-grid">
          {doctors.map(doctor => (
            <div 
              key={doctor.id} 
              className="doctor-home-card"
              onClick={() => handleDoctorClick(doctor.id, doctor.name)}
            >
              <div className="doctor-home-image">
                <img 
                  src={doctor.photo || 'https://via.placeholder.com/300x300'} 
                  alt={doctor.name}
                />
              </div>
              <div className="doctor-home-info">
                <h3 className="doctor-home-name">{doctor.name}</h3>
                <p className="doctor-home-specialty">{doctor.specialty}</p>
                <div className="doctor-home-rating">
                  {'★'.repeat(Math.floor(doctor.rating || 5))}
                  {'☆'.repeat(5 - Math.floor(doctor.rating || 5))}
                  <span className="rating-value">{doctor.rating ? doctor.rating.toFixed(1) : '5.0'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="view-all-container">
          <Link to="/doctors" className="btn view-all-btn">
            Переглянути всіх спеціалістів
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DoctorsHome;