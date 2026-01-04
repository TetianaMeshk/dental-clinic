import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import './AppointmentComponent.css';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AppointmentComponent = ({ 
  isModal = false, 
  selectedService = '', 
  selectedDoctor = '', 
  onClose = () => {} 
}) => {
  const [allServices, setAllServices] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: selectedService || '',
    doctor: selectedDoctor || '',
    date: '',
    time: '',
    message: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Часи прийому
  const allTimes = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Функція для перевірки, чи час вже пройшов для поточної дати
  const isTimeInPast = (dateString, timeString) => {
    if (!dateString || !timeString) return false;
    
    const today = new Date().toISOString().split('T')[0];
    if (dateString !== today) return false;
    
    const now = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const timeToCheck = new Date();
    timeToCheck.setHours(hours, minutes, 0, 0);
    
    return now > timeToCheck;
  };

  // Завантаження даних користувача при авторизації
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Отримуємо додаткові дані користувача з сервера
          const response = await axios.get(`http://localhost:5000/api/user/${currentUser.uid}`);
          if (response.data.success) {
            const userDataFromServer = response.data;
            setUserData(userDataFromServer);
            
            // Автоматично заповнюємо форму даними користувача
            setFormData(prev => ({
              ...prev,
              name: userDataFromServer.name || '',
              phone: userDataFromServer.phone || '',
              email: currentUser.email || ''
            }));
          }
        } catch (error) {
          console.error('Помилка при отриманні даних користувача:', error);
          // Якщо не вдалося отримати дані з сервера, використовуємо дані з Firebase
          setFormData(prev => ({
            ...prev,
            email: currentUser.email || ''
          }));
        }
      } else {
        setUser(null);
        setUserData(null);
        // Якщо користувач не авторизований, очищаємо поля
        setFormData(prev => ({
          ...prev,
          name: '',
          phone: '',
          email: ''
        }));
      }
      setUserLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Завантажуємо всі дані
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesResponse, doctorsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/services'),
          axios.get('http://localhost:5000/api/doctors')
        ]);
        
        setAllServices(servicesResponse.data);
        setAllDoctors(doctorsResponse.data);
        
        if (selectedService) {
          const selectedServiceObj = servicesResponse.data.find(s => s.name === selectedService);
          if (selectedServiceObj) {
            setSelectedServiceId(selectedServiceObj.id);
            await fetchDoctorsForService(selectedServiceObj.id);
            setFilteredServices(servicesResponse.data);
          }
        } else if (selectedDoctor) {
          const selectedDoctorObj = doctorsResponse.data.find(d => d.name === selectedDoctor);
          if (selectedDoctorObj) {
            setFormData(prev => ({ ...prev, doctor: selectedDoctor }));
            await fetchServicesForDoctor(selectedDoctorObj.id);
            setFilteredDoctors(doctorsResponse.data);
          }
        } else {
          setFilteredServices(servicesResponse.data);
          setFilteredDoctors(doctorsResponse.data);
        }
      } catch (error) {
        console.error('Помилка при отриманні даних:', error);
        setFilteredServices(allServices);
        setFilteredDoctors(allDoctors);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setAvailableTimes(allTimes);
  }, [selectedService, selectedDoctor]);

  // Функція для завантаження лікарів за послугою
  const fetchDoctorsForService = async (serviceId) => {
    try {
      setFetchingData(true);
      const response = await axios.get(`http://localhost:5000/api/doctors/by-service/${serviceId}`);
      setFilteredDoctors(response.data.doctors);
      
      if (formData.doctor) {
        const currentDoctor = response.data.doctors.find(d => d.name === formData.doctor);
        if (!currentDoctor) {
          setFormData(prev => ({ ...prev, doctor: '' }));
        }
      }
    } catch (error) {
      console.error('Помилка при отриманні лікарів які надають послуги:', error);
      setFilteredDoctors(allDoctors);
    } finally {
      setFetchingData(false);
    }
  };

  // Функція для завантаження послуг за лікарем
  const fetchServicesForDoctor = async (doctorId) => {
    try {
      setFetchingData(true);
      const response = await axios.get(`http://localhost:5000/api/services/by-doctor/${doctorId}`);
      setFilteredServices(response.data.services);
      
      if (formData.service) {
        const currentService = response.data.services.find(s => s.name === formData.service);
        if (!currentService) {
          setFormData(prev => ({ ...prev, service: '' }));
        }
      }
    } catch (error) {
      console.error('Помилка при отриманні послуг для лікаря:', error);
      setFilteredServices(allServices);
    } finally {
      setFetchingData(false);
    }
  };

  // Ефект для завантаження зайнятих слотів та перевірки доступності
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (formData.doctor && formData.date) {
        try {
          setCheckingAvailability(true);
          const response = await axios.get(
            `http://localhost:5000/api/booked-slots/${encodeURIComponent(formData.doctor)}`, 
            { params: { date: formData.date } }
          );
          
          setBookedSlots(response.data.bookedSlots);
          
          const bookedTimes = response.data.bookedSlots
            .filter(slot => slot.date === formData.date)
            .map(slot => slot.time);
          
          // Фільтруємо часи: прибираємо заброньовані та пройдені (для поточної дати)
          const today = new Date().toISOString().split('T')[0];
          const available = allTimes.filter(time => {
            const isBooked = bookedTimes.includes(time);
            const isPast = formData.date === today && isTimeInPast(formData.date, time);
            return !isBooked && !isPast;
          });
          
          setAvailableTimes(available);
          
          // Якщо вибраний час зайнятий або пройшов, скидаємо його
          if (formData.time && (bookedTimes.includes(formData.time) || 
              (formData.date === today && isTimeInPast(formData.date, formData.time)))) {
            setFormData(prev => ({ ...prev, time: '' }));
          }
        } catch (error) {
          console.error('Помилка при отриманні зайнятих слотів:', error);
          setAvailableTimes(allTimes);
        } finally {
          setCheckingAvailability(false);
        }
      } else {
        // Якщо дата вибрана, але лікаря немає, фільтруємо тільки пройдені часи
        if (formData.date) {
          const today = new Date().toISOString().split('T')[0];
          if (formData.date === today) {
            const available = allTimes.filter(time => !isTimeInPast(formData.date, time));
            setAvailableTimes(available);
            
            // Якщо вибраний час пройшов, скидаємо його
            if (formData.time && isTimeInPast(formData.date, formData.time)) {
              setFormData(prev => ({ ...prev, time: '' }));
            }
          } else {
            setAvailableTimes(allTimes);
          }
        } else {
          setAvailableTimes(allTimes);
        }
        setBookedSlots([]);
      }
    };

    fetchBookedSlots();
  }, [formData.doctor, formData.date, formData.time]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    if (name === 'service' && value) {
      const selectedService = allServices.find(s => s.name === value);
      if (selectedService) {
        setSelectedServiceId(selectedService.id);
        await fetchDoctorsForService(selectedService.id);
        
        if (formData.doctor) {
          const currentDoctor = filteredDoctors.find(d => d.name === formData.doctor);
          if (!currentDoctor) {
            newFormData.doctor = '';
          }
        }
      }
    } else if (name === 'doctor' && value) {
      const selectedDoctor = allDoctors.find(d => d.name === value);
      if (selectedDoctor) {
        await fetchServicesForDoctor(selectedDoctor.id);
        
        if (formData.service) {
          const currentService = filteredServices.find(s => s.name === formData.service);
          if (!currentService) {
            newFormData.service = '';
          }
        }
      }
    } else if (name === 'doctor' && value === '') {
      setFilteredServices(allServices);
      setFilteredDoctors(allDoctors);
    } else if (name === 'service' && value === '') {
      setSelectedServiceId('');
      setFilteredDoctors(allDoctors);
      setFilteredServices(allServices);
    }
    
    if (name === 'doctor' || name === 'date') {
      newFormData.time = '';
    }
    
    setFormData(newFormData);
  };

  const isTimeBooked = (time) => {
    if (!formData.doctor || !formData.date) return false;
    return bookedSlots.some(slot => 
      slot.date === formData.date && slot.time === time
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Якщо користувач авторизований, додаємо його ID до даних запису
      const appointmentData = { ...formData };
      if (user) {
        appointmentData.userId = user.uid;
      }
      
      const response = await axios.post('http://localhost:5000/api/appointments', appointmentData);
      
      if (response.data.success) {
        // Показуємо повідомлення з номером направлення
        if (response.data.referenceNumber) {
          setSubmitStatus(`success:${response.data.referenceNumber}`);
        } else {
          setSubmitStatus('success');
        }
        
        // Скидаємо форму (але зберігаємо дані користувача, якщо він авторизований)
        const resetData = {
          name: user ? formData.name : '',
          phone: user ? formData.phone : '',
          email: user ? formData.email : '',
          service: '',
          doctor: '',
          date: '',
          time: '',
          message: ''
        };
        
        setFormData(resetData);
        setSelectedServiceId('');
        setFilteredServices(allServices);
        setFilteredDoctors(allDoctors);
        
        // Закриваємо модальне вікно через 2 секунди
        if (isModal) {
          setTimeout(() => {
            setFormData(resetData);
            setSubmitStatus(null);
            onClose();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Помилка при відправці форми:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setSubmitStatus(`error:${error.response.data.error}`);
      } else {
        setSubmitStatus('error');
      }
    } finally {
      setSubmitting(false);
      if (!isModal) {
        setTimeout(() => setSubmitStatus(null), 8000);
      }
    }
  };

  // Мінімальна дата - сьогодні
  const today = new Date().toISOString().split('T')[0];

  // Функція для визначення, чи час доступний (не заброньований і не пройшов)
  const isTimeAvailable = (time) => {
    const isBooked = isTimeBooked(time);
    const isPast = formData.date === today && isTimeInPast(formData.date, time);
    return !isBooked && !isPast;
  };

  const appointmentForm = (
    <form className={`appointment-form ${isModal ? 'appointment-form-modal' : ''}`} onSubmit={handleSubmit}>
      {submitStatus && submitStatus.startsWith('error') && (
        <div className="alert alert-error">
          {submitStatus === 'error' 
            ? 'Виникла помилка. Будь ласка, спробуйте ще раз.' 
            : submitStatus.split(':')[1]}
        </div>
      )}
      
      {submitStatus && submitStatus.startsWith('success') && (
        <div className="alert alert-success">
          {submitStatus === 'success' 
            ? 'Дякуємо! Ваш запис відправлено. Ми зв\'яжемося з вами найближчим часом.' 
            : `Дякуємо! Запис успішно створено. Номер направлення: ${submitStatus.split(':')[1]}`}
        </div>
      )}
      
      {/* Інформація про авторизованого користувача */}
      {user && (
        <div className="user-info-notice">
          <div className="user-info-header">
            <div className="user-avatar">
              {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info-text">
              <p><strong>Запис користувача:</strong> {userData?.name || user.email}</p>
              <p className="user-info-hint">Ваші дані заповнені автоматично</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="form-group">
        <input
          type="text"
          name="name"
          placeholder="Ваше ім'я *"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={userLoading || (user && userData?.name)}
          className={user && userData?.name ? 'auto-filled-field' : ''}
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <input
            type="tel"
            name="phone"
            placeholder="Телефон *"
            value={formData.phone}
            onChange={handleChange}
            required
            pattern="[0-9]{10,12}"
            title="Вкажіть номер телефону у форматі 0671234567"
            disabled={userLoading || (user && userData?.phone)}
            className={user && userData?.phone ? 'auto-filled-field' : ''}
          />
        </div>
        
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            disabled={userLoading || user}
            className={user ? 'auto-filled-field' : ''}
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <select
            name="service"
            value={formData.service}
            onChange={handleChange}
            required
            disabled={loading || fetchingData}
          >
            <option value="">Оберіть послугу *</option>
            {filteredServices.map(service => (
              <option key={service.id} value={service.name}>
                {service.name}
              </option>
            ))}
          </select>
          {fetchingData && formData.service && (
            <div className="info-message">Завантаження доступних лікарів...</div>
          )}
          {formData.doctor && filteredServices.length === 0 && (
            <div className="info-message">Цей лікар не надає доступних послуг</div>
          )}
        </div>
        
        <div className="form-group">
          <select
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            disabled={fetchingData}
          >
            <option value="">Будь-який лікар</option>
            {filteredDoctors.map(doctor => (
              <option key={doctor.id} value={doctor.name}>
                {doctor.name} ({doctor.specialty})
              </option>
            ))}
          </select>
          {fetchingData && formData.doctor && (
            <div className="info-message">Завантаження доступних послуг...</div>
          )}
          {formData.service && filteredDoctors.length === 0 && (
            <div className="info-message">Для цієї послуги немає доступних лікарів</div>
          )}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            min={today}
            disabled={checkingAvailability}
          />
        </div>
        
        <div className="form-group">
          <div className="time-select-wrapper">
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              disabled={checkingAvailability || availableTimes.length === 0}
            >
              <option value="">Оберіть час *</option>
              {availableTimes.map(time => {
                const isAvailable = isTimeAvailable(time);
                const isBooked = isTimeBooked(time);
                const isPast = formData.date === today && isTimeInPast(formData.date, time);
                
                return (
                  <option 
                    key={time} 
                    value={time}
                    disabled={!isAvailable}
                    className={!isAvailable ? 'disabled-option' : ''}
                  >
                    {time}
                  </option>
                );
              })}
            </select>
            {checkingAvailability && (
              <div className="loading-indicator">Перевірка доступності...</div>
            )}
            {formData.date && availableTimes.length === 0 && !checkingAvailability && (
              <div className="info-message">
                {formData.doctor 
                  ? 'Немає доступного часу для вибраного лікаря та дати' 
                  : 'Немає доступного часу для вибраної дати'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <textarea
          name="message"
          placeholder="Додаткові побажання або коментарі"
          value={formData.message}
          onChange={handleChange}
          rows={isModal ? "3" : "4"}
        />
      </div>
      
      {isModal ? (
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Скасувати
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={submitting || loading || checkingAvailability || fetchingData || userLoading}
          >
            {submitting ? 'Відправка...' : 'Записатись на прийом'}
          </button>
        </div>
      ) : (
        <>
          <button 
            type="submit" 
            className="btn btn-primary submit-btn"
            disabled={submitting || loading || checkingAvailability || fetchingData || userLoading}
          >
            {submitting ? 'Відправка...' : 'Записатись на прийом'}
          </button>
        </>
      )}
    </form>
  );

  if (isModal) {
    return (
      <div className="appointment-modal">
        <div className="modal-header">
          <h2>Запис на прийом</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        {appointmentForm}
      </div>
    );
  }

  return (
    <section id="appointment-form" className="appointment-section">
      <div className="container">
        <div className="appointment-wrapper">
          <div className="appointment-info">
            <h2>Запис на прийом</h2>
            <p>Заповніть форму для отрмання запису до лікаря</p>
            <div className="contact-details">
              <p><strong>Телефон:</strong> +38 (099) 123-45-67</p>
              <p><strong>Email:</strong> info@dentalclinic.com</p>
              <p><strong>Адреса:</strong> м. Київ, вул. Здоров'я, 123</p>
            </div>
          </div>
          {appointmentForm}
        </div>
      </div>
    </section>
  );
};

export default AppointmentComponent;