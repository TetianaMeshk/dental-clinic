import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaGraduationCap, FaBriefcase, FaFilter } from 'react-icons/fa';
import './Doctors.css';

const API_BASE_URL = 'https://dental-clinic-server-e4mh.onrender.com';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const navigate = useNavigate();

  const saveFilterState = (serviceId) => {
    sessionStorage.setItem('doctors_filter_service', serviceId);
  };

  const loadFilterState = () => {
    return sessionStorage.getItem('doctors_filter_service') || '';
  };

  const applyFilter = async (serviceId) => {
    if (!serviceId) {
      setFilteredDoctors(doctors);
      return;
    }
    
    try {
      setServicesLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/doctors/by-service/${serviceId}`);
      setFilteredDoctors(response.data.doctors);
    } catch (error) {
      console.error('Помилка при фільтрації лікарів:', error);
      setFilteredDoctors(doctors);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const savedServiceId = loadFilterState();
        
        const doctorsResponse = await axios.get(`${API_BASE_URL}/api/doctors`);
        setDoctors(doctorsResponse.data);
        
        const servicesResponse = await axios.get(`${API_BASE_URL}/api/services`);
        setServices(servicesResponse.data);
        
        if (savedServiceId) {
          setSelectedService(savedServiceId);
          
          try {
            setServicesLoading(true);
            const filterResponse = await axios.get(`${API_BASE_URL}/api/doctors/by-service/${savedServiceId}`);
            setFilteredDoctors(filterResponse.data.doctors);
          } catch (filterError) {
            console.error('Помилка при застосуванні збереженого фільтра:', filterError);
            setFilteredDoctors(doctorsResponse.data);
          } finally {
            setServicesLoading(false);
          }
        } else {
          setFilteredDoctors(doctorsResponse.data);
        }
      } catch (error) {
        console.error('Помилка при отриманні даних:', error);
        setDoctors([]);
        setFilteredDoctors([]);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDoctorClick = (doctorId, doctorName) => {
    navigate(`/doctors/${doctorId}`, { state: { doctorName } });
  };

  const handleServiceChange = async (e) => {
    const serviceId = e.target.value;
    setSelectedService(serviceId);
    saveFilterState(serviceId);
    await applyFilter(serviceId);
  };

  const renderStars = (rating) => {
    const stars = [];
    const ratingValue = rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={i <= Math.floor(ratingValue) ? 'star filled' : 'star'}
        />
      );
    }
    
    return stars;
  };

  const getSelectedServiceName = () => {
    if (!selectedService) return '';
    const service = services.find(s => s.id === selectedService);
    return service ? service.name : '';
  };

  if (loading) {
    return (
      <section className="doctors-section">
        <div className="container">
          <h2 className="section-title">Наші лікарі</h2>
          <div className="loading">Завантаження інформації про лікарів...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="doctors-section" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="container">
        <h2 className="section-title">Усі спеціалісти</h2>
        
        <div className="doctors-filter" style={{ backgroundColor: 'white' }}>
          <div className="filter-header">
            <FaFilter className="filter-icon" />
            <h3>Знайти лікаря за послугою:</h3>
          </div>
          
          <div className="filter-controls">
            <div className="filter-select-wrapper">
              <select 
                className="service-filter-select"
                value={selectedService}
                onChange={handleServiceChange}
                disabled={servicesLoading}
              >
                <option value="">Всі послуги</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            
            {servicesLoading && (
              <div className="filter-loading">Завантаження...</div>
            )}
          </div>
          
          {selectedService && (
            <div className="filter-results">
              <p>
                За вибраною послугою "<strong>{getSelectedServiceName()}</strong>" знайдено 
                <strong> {filteredDoctors.length} </strong>
                {filteredDoctors.length === 1 ? 'лікаря' : 
                 filteredDoctors.length > 1 && filteredDoctors.length < 5 ? 'лікарі' : 
                 'лікарів'}
              </p>
            </div>
          )}
        </div>
        
        {filteredDoctors.length === 0 ? (
          <div className="no-doctors-found" style={{ backgroundColor: 'white' }}>
            <p>За обраною послугою лікарів не знайдено.</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setSelectedService('');
                saveFilterState('');
                setFilteredDoctors(doctors);
              }}
            >
              Показати всіх лікарів
            </button>
          </div>
        ) : (
          <div className="doctors-grid">
            {filteredDoctors.map(doctor => (
              <div 
                key={doctor.id} 
                className="doctor-card"
                onClick={() => handleDoctorClick(doctor.id, doctor.name)}
                style={{ 
                  backgroundColor: 'white',
                  background: 'white'
                }}
              >
                <div className="doctor-image" style={{ backgroundColor: 'white' }}>
                  <img 
                    src={doctor.photo || 'https://via.placeholder.com/300x300'} 
                    alt={doctor.name}
                  />
                </div>
                <div className="doctor-info" style={{ backgroundColor: 'white' }}>
                  <h3 className="doctor-name" style={{ backgroundColor: 'white' }}>{doctor.name}</h3>
                  <p className="doctor-specialty" style={{ backgroundColor: 'white' }}>{doctor.specialty}</p>
                  
                  <div className="doctor-rating" style={{ backgroundColor: 'white' }}>
                    {renderStars(doctor.rating)}
                    <span className="rating-value" style={{ backgroundColor: 'white' }}>{doctor.rating ? doctor.rating.toFixed(1) : '5.0'}</span>
                    {doctor.ratingCount && (
                      <span className="rating-count" style={{ backgroundColor: 'white' }}>({doctor.ratingCount})</span>
                    )}
                  </div>
                  
                  <div className="doctor-details" style={{ backgroundColor: 'white' }}>
                    <p style={{ backgroundColor: 'white' }}><FaGraduationCap /> {doctor.education}</p>
                    <p style={{ backgroundColor: 'white' }}><FaBriefcase /> Досвід: {doctor.experience} років</p>
                  </div>
                  
                  <p className="doctor-description" style={{ backgroundColor: 'white' }}>
                    {doctor.description || 'Висококваліфікований спеціаліст з багаторічним досвідом роботи.'}
                  </p>
                  
                  <div className="view-details-btn" style={{ backgroundColor: 'white' }}>
                    <button className="btn btn-primary" style={{ backgroundColor: '#2ecc71' }}>
                      Детальніше
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Doctors;