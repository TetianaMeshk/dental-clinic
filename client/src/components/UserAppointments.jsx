import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaTooth, 
  FaClock, 
  FaFileMedical,
  FaTimes,
  FaCheckCircle,
  FaCalendarTimes,
  FaStar,
  FaComment,
  FaFilter
} from 'react-icons/fa';
import AppointmentComponent from './AppointmentComponent';
import './UserAppointments.css';

const API_BASE_URL = 'https://dental-clinic-server-e4mh.onrender.com';

const UserAppointments = ({ userId }) => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [ratingAppointments, setRatingAppointments] = useState({});
  const [submittingRating, setSubmittingRating] = useState({});
  const [stats, setStats] = useState({ 
    active: 0, 
    completed: 0, 
    cancelled: 0 
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchAppointments(userId);
    }
  }, [userId]);

  const sortAppointmentsByDateTime = (appointmentsList) => {
    return [...appointmentsList].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      
      if (a.time && b.time) {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        
        if (timeA[0] !== timeB[0]) {
          return timeB[0] - timeA[0];
        }
        
        return timeB[1] - timeA[1];
      }
      
      const createdA = new Date(a.createdAt || 0);
      const createdB = new Date(b.createdAt || 0);
      return createdB - createdA;
    });
  };

  useEffect(() => {
    let filtered = [];
    
    if (filterStatus === 'all') {
      filtered = appointments;
    } else {
      filtered = appointments.filter(appointment => {
        const statusConfig = getStatusConfig(
          appointment.status, 
          appointment.date, 
          appointment.time
        );
        
        if (filterStatus === 'active') {
          return statusConfig.text === 'Активний';
        } else if (filterStatus === 'completed') {
          return statusConfig.text === 'Завершено';
        } else if (filterStatus === 'cancelled') {
          return appointment.status === 'cancelled';
        }
        return true;
      });
    }
    
    const sortedFiltered = sortAppointmentsByDateTime(filtered);
    setFilteredAppointments(sortedFiltered);
  }, [appointments, filterStatus]);

  const fetchAppointments = async (userId) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE_URL}/api/appointments/by-user/${userId}`);
      
      if (response.data.success) {
        const fetchedAppointments = response.data.appointments || [];
        const sortedAppointments = sortAppointmentsByDateTime(fetchedAppointments);
        
        setAppointments(sortedAppointments);
        setFilteredAppointments(sortedAppointments);
        setStats({
          active: response.data.active || 0,
          completed: response.data.completed || 0,
          cancelled: response.data.cancelled || 0
        });
      } else {
        setAppointments([]);
        setFilteredAppointments([]);
      }
    } catch (error) {
      console.error('Помилка при отриманні записів:', error);
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Ви впевнені, що хочете скасувати цей запис?')) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      
      const response = await axios.patch(`${API_BASE_URL}/api/appointments/${appointmentId}`, {
        status: 'cancelled'
      });
      
      if (response.data.success) {
        await fetchAppointments(userId);
        alert('Запис успішно скасовано');
      }
    } catch (error) {
      console.error('Помилка при скасуванні запису:', error);
      alert(error.response?.data?.error || 'Помилка при скасуванні запису');
    } finally {
      setCancellingId(null);
    }
  };

  const handleNewAppointment = () => {
    setShowAppointmentModal(true);
  };

  const handleCloseAppointmentModal = () => {
    setShowAppointmentModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Дата не вказана';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Час не вказаний';
    return timeString;
  };

  const isAppointmentCompleted = (dateString, timeString) => {
    if (!dateString || !timeString) return false;
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const [hours, minutes] = timeString.split(':').map(Number);
      
      const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();
      
      return now > appointmentDateTime;
    } catch (error) {
      console.error('Помилка при перевірці часу запису:', error);
      return false;
    }
  };

  const getStatusConfig = (status, date, time) => {
    if (status === 'completed' || status === 'cancelled') {
      return {
        text: status === 'completed' ? 'Завершено' : 'Скасовано',
        color: status === 'completed' ? 'status-completed' : 'status-cancelled',
        icon: status === 'completed' ? <FaCheckCircle /> : <FaCalendarTimes />
      };
    }
    
    if (status === 'active') {
      const isCompleted = isAppointmentCompleted(date, time);
      
      if (isCompleted) {
        return {
          text: 'Завершено',
          color: 'status-completed',
          icon: <FaCheckCircle />
        };
      } else {
        return {
          text: 'Активний',
          color: 'status-active',
          icon: <FaCalendarAlt />
        };
      }
    }
    
    return {
      text: 'Активний',
      color: 'status-active',
      icon: <FaCalendarAlt />
    };
  };

  const handleStarClick = (appointmentId, rating) => {
    setRatingAppointments(prev => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        rating
      }
    }));
  };

  const handleReviewChange = (appointmentId, review) => {
    setRatingAppointments(prev => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        review
      }
    }));
  };

  const handleSubmitRating = async (appointmentId) => {
    const ratingData = ratingAppointments[appointmentId];
    
    if (!ratingData || !ratingData.rating) {
      alert('Будь ласка, оберіть рейтинг від 1 до 5 зірочок');
      return;
    }

    try {
      setSubmittingRating(prev => ({ ...prev, [appointmentId]: true }));
      
      const response = await axios.post(`${API_BASE_URL}/api/appointments/${appointmentId}/rate`, {
        rating: ratingData.rating,
        review: ratingData.review || ''
      });
      
      if (response.data.success) {
        alert('Дякуємо за вашу оцінку!');
        
        await fetchAppointments(userId);
        
        setRatingAppointments(prev => {
          const newRatings = { ...prev };
          delete newRatings[appointmentId];
          return newRatings;
        });
      }
    } catch (error) {
      console.error('Помилка при відправці оцінки:', error);
      alert(error.response?.data?.error || 'Помилка при відправці оцінки');
    } finally {
      setSubmittingRating(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const renderStarRating = (appointmentId, currentRating = 0, isEditable = false) => {
    const stars = [];
    const ratingValue = isEditable 
      ? (ratingAppointments[appointmentId]?.rating || currentRating)
      : currentRating;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          className={`star-btn ${i <= ratingValue ? 'active' : ''}`}
          onClick={isEditable ? () => handleStarClick(appointmentId, i) : undefined}
          disabled={!isEditable || submittingRating[appointmentId]}
          type="button"
        >
          <FaStar />
        </button>
      );
    }
    
    return (
      <div className="stars-container">
        <div className="star-rating">
          {stars}
        </div>
        <div className="rating-value">
          {ratingValue ? `${ratingValue}/5` : ''}
        </div>
      </div>
    );
  };

  const renderRatingSection = (appointment) => {
    if (appointment.status !== 'completed') {
      return null;
    }
    
    if (appointment.isRated) {
      return (
        <div className="appointment-rating-section">
          <div className="rating-section-title">
            <FaStar /> Ваша оцінка візиту
          </div>
          <div className="existing-rating">
            <div className="existing-rating-stars">
              {renderStarRating(appointment.id, appointment.rating, false)}
            </div>
            <div className="existing-rating-info">
              {appointment.review && (
                <p><strong>Ваш коментар:</strong> {appointment.review}</p>
              )}
              <p className="rating-date">
                Оцінено: {appointment.ratedAt ? new Date(appointment.ratedAt).toLocaleDateString('uk-UA') : 'Н/Д'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="appointment-rating-section">
        <div className="rating-section-title">
          <FaStar /> Оцініть візит
        </div>
        <div className="rating-stars">
          {renderStarRating(appointment.id, 0, true)}
          <div className="rating-text">
            Оберіть кількість зірочок для оцінки якості обслуговування
          </div>
          
          <textarea
            className="review-textarea"
            placeholder="Залиште відгук про ваш візит (необов'язково)"
            value={ratingAppointments[appointment.id]?.review || ''}
            onChange={(e) => handleReviewChange(appointment.id, e.target.value)}
            disabled={submittingRating[appointment.id]}
            rows="3"
          />
          
          <button
            className="submit-rating-btn"
            onClick={() => handleSubmitRating(appointment.id)}
            disabled={submittingRating[appointment.id] || !ratingAppointments[appointment.id]?.rating}
          >
            {submittingRating[appointment.id] ? (
              'Відправка...'
            ) : (
              <>
                <FaComment /> Надіслати оцінку
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
  };

  const clearFilter = () => {
    setFilterStatus('all');
  };

  if (loading) {
    return (
      <div className="appointments-loading">
        Завантаження записів...
      </div>
    );
  }

  return (
    <>
      <div className="user-appointments">
        <div className="appointments-header">
          <h2>Мої записи на прийом</h2>
          <button 
            className="btn btn-primary"
            onClick={handleNewAppointment}
          >
            Новий запис
          </button>
        </div>

        <div className="appointments-stats">
          <div 
            className={`stat-card ${filterStatus === 'active' ? 'active-filter' : ''}`}
            onClick={() => handleStatusFilter('active')}
          >
            <div className="stat-icon active">
              <FaCalendarAlt />
            </div>
            <div className="stat-info">
              <h3>{stats.active}</h3>
              <p>Активних</p>
            </div>
          </div>
          
          <div 
            className={`stat-card ${filterStatus === 'completed' ? 'active-filter' : ''}`}
            onClick={() => handleStatusFilter('completed')}
          >
            <div className="stat-icon completed">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <h3>{stats.completed}</h3>
              <p>Завершених</p>
            </div>
          </div>
          
          <div 
            className={`stat-card ${filterStatus === 'cancelled' ? 'active-filter' : ''}`}
            onClick={() => handleStatusFilter('cancelled')}
          >
            <div className="stat-icon cancelled">
              <FaCalendarTimes />
            </div>
            <div className="stat-info">
              <h3>{stats.cancelled}</h3>
              <p>Скасованих</p>
            </div>
          </div>
        </div>

        {filterStatus !== 'all' && (
          <div className="status-filter">
            <div className="status-filter-header">
              <FaFilter />
              <h3>Фільтр за статусом</h3>
            </div>
            <div className="status-filter-options">
              <button 
                className={`status-filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('active')}
              >
                Активні ({stats.active})
              </button>
              <button 
                className={`status-filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('completed')}
              >
                Завершені ({stats.completed})
              </button>
              <button 
                className={`status-filter-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('cancelled')}
              >
                Скасовані ({stats.cancelled})
              </button>
            </div>
            <button 
              className="filter-clear-btn"
              onClick={clearFilter}
            >
              Показати всі записи
            </button>
          </div>
        )}

        {filteredAppointments.length === 0 ? (
          <div className="no-appointments">
            <div className="no-appointments-icon">
              {filterStatus === 'all' ? (
                <FaCalendarAlt />
              ) : filterStatus === 'active' ? (
                <FaCalendarAlt />
              ) : filterStatus === 'completed' ? (
                <FaCheckCircle />
              ) : (
                <FaCalendarTimes />
              )}
            </div>
            <h3>
              {filterStatus === 'all' 
                ? 'У вас ще немає записів' 
                : 'Записів з таким статусом не знайдено'}
            </h3>
            <p>
              {filterStatus === 'all' 
                ? 'Запишіться на прийом, щоб побачити їх тут' 
                : 'Змініть фільтр або створіть новий запис'}
            </p>
            <button 
              className="btn btn-primary"
              onClick={filterStatus === 'all' ? handleNewAppointment : clearFilter}
            >
              {filterStatus === 'all' ? 'Записатись на прийом' : 'Показати всі записи'}
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px', color: '#666', fontSize: '0.95rem' }}>
              Показано {filteredAppointments.length} {filteredAppointments.length === 1 ? 'запис' : 
                filteredAppointments.length > 1 && filteredAppointments.length < 5 ? 'записи' : 
                'записів'}
              {filterStatus !== 'all' && ` зі статусом "${filterStatus}"`}
            </div>
            <div className="appointments-list">
              {filteredAppointments.map((appointment) => {
                const statusConfig = getStatusConfig(
                  appointment.status, 
                  appointment.date, 
                  appointment.time
                );
                
                return (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-main-info">
                      <div className="service-info">
                        <h3>
                          <FaTooth /> {appointment.service || 'Послуга не вказана'}
                        </h3>
                      </div>
                      
                      <div className="reference-number">
                        <FaFileMedical />
                        <span>Номер направлення: <strong>{appointment.referenceNumber || 'Н/Д'}</strong></span>
                      </div>
                      
                      <div className="datetime-info">
                        <div className="date-info">
                          <FaCalendarAlt />
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                        <div className="time-info">
                          <FaClock />
                          <span>{formatTime(appointment.time)}</span>
                        </div>
                      </div>
                      
                      {appointment.doctor && (
                        <div className="doctor-info">
                          <FaUserMd />
                          <span><strong>Лікар:</strong> {appointment.doctor}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="appointment-details">
                      <div className="patient-details">
                        <h4>Інформація про пацієнта</h4>
                        <div className="patient-info-grid">
                          <div className="info-item">
                            <strong>Ім'я:</strong>
                            <span>{appointment.name}</span>
                          </div>
                          <div className="info-item">
                            <strong>Телефон:</strong>
                            <span>{appointment.phone}</span>
                          </div>
                          {appointment.email && (
                            <div className="info-item">
                              <strong>Email:</strong>
                              <span>{appointment.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {appointment.message && (
                        <div className="appointment-message">
                          <h4>Коментар:</h4>
                          <p>{appointment.message}</p>
                        </div>
                      )}
                      
                      {renderRatingSection(appointment)}
                      
                      <div className="appointment-footer">
                        <div className={`appointment-status ${statusConfig.color}`}>
                          {statusConfig.icon}
                          <span>{statusConfig.text}</span>
                        </div>
                        
                        <div className="appointment-actions">
                          {appointment.status === 'active' && !isAppointmentCompleted(appointment.date, appointment.time) && (
                            <button 
                              className="btn btn-danger"
                              onClick={() => handleCancelAppointment(appointment.id)}
                              disabled={cancellingId === appointment.id}
                            >
                              {cancellingId === appointment.id ? (
                                'Скасування...'
                              ) : (
                                <>
                                  <FaTimes /> Скасувати
                                </>
                              )}
                            </button>
                          )}
                          
                          <div className="appointment-meta">
                            <small>
                              {appointment.status === 'active' && isAppointmentCompleted(appointment.date, appointment.time) ? (
                                'Візит пройшов'
                              ) : (
                                `Створено: ${appointment.createdAt ? new Date(appointment.createdAt).toLocaleDateString('uk-UA') : 'Н/Д'}`
                              )}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showAppointmentModal && (
        <div className="modal-overlay" onClick={handleCloseAppointmentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AppointmentComponent 
              isModal={true}
              onClose={() => {
                handleCloseAppointmentModal();
                fetchAppointments(userId);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UserAppointments;