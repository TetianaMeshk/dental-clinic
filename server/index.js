const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { db, admin } = require('./firebase-admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Генерація унікального 6-значного номера направлення
const generateReferenceNumber = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Основний маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Dental Clinic API', 
    version: '1.0.0',
    endpoints: {
      services: '/api/services',
      doctors: '/api/doctors',
      doctorsByService: '/api/doctors/by-service/:serviceId',
      servicesByDoctor: '/api/services/by-doctor/:doctorId',
      checkAvailability: '/api/check-availability',
      bookedSlots: '/api/booked-slots/:doctor',
      appointments: {
        post: '/api/appointments',
        getByUser: '/api/appointments/by-user/:userId',
        update: '/api/appointments/:appointmentId',
        rate: '/api/appointments/:appointmentId/rate'
      },
      users: {
        getUser: '/api/user/:userId',
        createUpdateUser: '/api/user'
      }
    }
  });
});

// Маршрут для отримання послуг
app.get('/api/services', async (req, res) => {
  try {
    const servicesRef = db.collection('services');
    const snapshot = await servicesRef.orderBy('name').get();
    const services = [];
    
    snapshot.forEach(doc => {
      services.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(services);
  } catch (error) {
    console.error('Помилка при отриманні послуг:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Маршрут для отримання лікарів
app.get('/api/doctors', async (req, res) => {
  try {
    const doctorsRef = db.collection('doctors');
    const snapshot = await doctorsRef.orderBy('name').get();
    const doctors = [];
    
    snapshot.forEach(doc => {
      doctors.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(doctors);
  } catch (error) {
    console.error('Помилка при отриманні лікарів:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Маршрут для оновлення рейтингу лікаря
const updateDoctorRating = async (doctorName, newRating) => {
  try {
    // Знаходимо лікаря за іменем
    const doctorsRef = db.collection('doctors');
    const snapshot = await doctorsRef.where('name', '==', doctorName).get();
    
    if (!snapshot.empty) {
      const doctorDoc = snapshot.docs[0];
      const doctorData = doctorDoc.data();
      
      // Оновлюємо рейтинг
      const currentRating = doctorData.rating || 0;
      const currentRatingCount = doctorData.ratingCount || 0;
      
      // Розраховуємо новий середній рейтинг
      const totalRating = currentRating * currentRatingCount;
      const newTotalRating = totalRating + newRating;
      const newRatingCount = currentRatingCount + 1;
      const updatedRating = newTotalRating / newRatingCount;
      
      await doctorDoc.ref.update({
        rating: parseFloat(updatedRating.toFixed(1)),
        ratingCount: newRatingCount
      });
      
      console.log(`Рейтинг лікаря ${doctorName} оновлено: ${updatedRating.toFixed(1)} (${newRatingCount} оцінок)`);
    }
  } catch (error) {
    console.error('Помилка при оновленні рейтингу лікаря:', error);
  }
};

// Маршрут для отримання лікарів за послугою
app.get('/api/doctors/by-service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    // Отримуємо послугу
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Послуга не знайдена' });
    }
    
    const service = serviceDoc.data();
    
    // Отримуємо всіх лікарів
    const doctorsRef = db.collection('doctors');
    const snapshot = await doctorsRef.get();
    const doctors = [];
    
    // Фільтруємо лікарів, які надають цю послугу
    snapshot.forEach(doc => {
      const doctor = {
        id: doc.id,
        ...doc.data()
      };
      
      // Перевіряємо, чи лікар надає цю послугу
      const doctorServices = doctor.services || [];
      const doctorServiceIds = doctor.serviceIds || [];
      
      // Перевіряємо за назвою послуги або ID
      if (doctorServices.includes(service.name) || 
          doctorServiceIds.includes(serviceId) ||
          (service.specialties && service.specialties.includes(doctor.specialty))) {
        doctors.push(doctor);
      }
    });
    
    res.json({
      service: service.name,
      doctors
    });
    
  } catch (error) {
    console.error('Помилка при отриманні лікарів:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Маршрут для отримання послуг за лікарем
app.get('/api/services/by-doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Отримуємо лікаря
    const doctorDoc = await db.collection('doctors').doc(doctorId).get();
    if (!doctorDoc.exists) {
      return res.status(404).json({ error: 'Лікар не знайдений' });
    }
    
    const doctor = doctorDoc.data();
    const doctorName = doctor.name;
    const doctorServices = doctor.services || [];
    const doctorServiceIds = doctor.serviceIds || [];
    
    // Отримуємо всі послуги
    const servicesRef = db.collection('services');
    const snapshot = await servicesRef.get();
    const services = [];
    
    // Фільтруємо послуги, які надає цей лікар
    snapshot.forEach(doc => {
      const service = {
        id: doc.id,
        ...doc.data()
      };
      
      // Перевіряємо за назвою послуги, ID або спеціалізації
      const isServiceInDoctorList = doctorServices.includes(service.name);
      const isServiceIdInDoctorList = doctorServiceIds.includes(service.id);
      const isSpecialtyMatch = service.specialties && service.specialties.includes(doctor.specialty);
      
      if (isServiceInDoctorList || isServiceIdInDoctorList || isSpecialtyMatch) {
        services.push(service);
      }
    });
    
    res.json({
      doctor: doctorName,
      services
    });
    
  } catch (error) {
    console.error('Помилка при отриманні послуг:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Маршрут для перевірки доступності лікаря
app.get('/api/check-availability', async (req, res) => {
  try {
    const { doctor, date, time } = req.query;
    
    if (!doctor || !date || !time) {
      return res.status(400).json({ error: 'Необхідно вказати лікаря, дату та час' });
    }
    
    // Перевіряємо, чи час вже пройшов для поточної дати
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      const timeToCheck = new Date();
      timeToCheck.setHours(hours, minutes, 0, 0);
      
      if (now > timeToCheck) {
        return res.json({ 
          available: false,
          doctor,
          date,
          time,
          reason: 'Цей час вже пройшов для сьогодні'
        });
      }
    }
    
    const appointmentsRef = db.collection('appointments');
    const snapshot = await appointmentsRef
      .where('doctor', '==', doctor)
      .where('date', '==', date)
      .where('time', '==', time)
      .where('status', 'in', ['active', 'confirmed'])
      .get();
    
    const isAvailable = snapshot.empty;
    
    res.json({ 
      available: isAvailable,
      doctor,
      date,
      time
    });
    
  } catch (error) {
    console.error('Помилка при перевірці доступності:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Маршрут для отримання зайнятих слотів лікаря
app.get('/api/booked-slots/:doctor', async (req, res) => {
  try {
    const { doctor } = req.params;
    const { date } = req.query;
    
    if (!doctor) {
      return res.status(400).json({ error: 'Необхідно вказати лікаря' });
    }
    
    const appointmentsRef = db.collection('appointments');
    let query = appointmentsRef.where('doctor', '==', doctor);
    
    if (date) {
      query = query.where('date', '==', date);
    }
    
    // Беремо записи за останні 30 днів
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    query = query.where('createdAt', '>=', thirtyDaysAgo.toISOString());
    
    const snapshot = await query.get();
    const bookedSlots = [];
    
    snapshot.forEach(doc => {
      const appointment = doc.data();
      if (appointment.status !== 'cancelled') {
        bookedSlots.push({
          date: appointment.date,
          time: appointment.time
        });
      }
    });
    
    res.json({ 
      doctor,
      bookedSlots,
      count: bookedSlots.length
    });
    
  } catch (error) {
    console.error('Помилка при отриманні зайнятих слотів:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Функція для перевірки, чи запис вже пройшов
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

// Маршрут для запису на прийом
app.post('/api/appointments', async (req, res) => {
  try {
    const appointmentData = req.body;
    
    // Перевіряємо, чи час вже пройшов для поточної дати
    const today = new Date().toISOString().split('T')[0];
    if (appointmentData.date === today && appointmentData.time) {
      const now = new Date();
      const [hours, minutes] = appointmentData.time.split(':').map(Number);
      const timeToCheck = new Date();
      timeToCheck.setHours(hours, minutes, 0, 0);
      
      if (now > timeToCheck) {
        return res.status(400).json({ 
          success: false, 
          error: 'Неможливо записатись на час, який вже пройшов' 
        });
      }
    }
    
    // Перевіряємо доступність лікаря
    if (appointmentData.doctor && appointmentData.doctor !== '') {
      const appointmentsRef = db.collection('appointments');
      const snapshot = await appointmentsRef
        .where('doctor', '==', appointmentData.doctor)
        .where('date', '==', appointmentData.date)
        .where('time', '==', appointmentData.time)
        .where('status', 'in', ['active', 'confirmed'])
        .get();
      
      if (!snapshot.empty) {
        return res.status(400).json({ 
          success: false, 
          error: 'Цей час вже зайнятий для вибраного лікаря' 
        });
      }
    }
    
    // Додаємо timestamp та генерацію номера направлення
    appointmentData.createdAt = new Date().toISOString();
    appointmentData.updatedAt = new Date().toISOString();
    appointmentData.referenceNumber = generateReferenceNumber();
    
    // Додаємо поля для рейтингу
    appointmentData.isRated = false;
    appointmentData.rating = null;
    appointmentData.review = null;
    appointmentData.ratedAt = null;
    
    // Визначаємо початковий статус
    // Перевіряємо, чи запис вже пройшов за часом
    if (isAppointmentCompleted(appointmentData.date, appointmentData.time)) {
      appointmentData.status = 'completed';
    } else {
      appointmentData.status = 'active';
    }
    
    // Зберігаємо в Firebase
    const docRef = await db.collection('appointments').add(appointmentData);
    
    res.status(200).json({ 
      success: true, 
      message: 'Запис успішно створено', 
      id: docRef.id,
      referenceNumber: appointmentData.referenceNumber
    });
    
  } catch (error) {
    console.error('Помилка при створенні запису:', error);
    res.status(500).json({ 
      success: false,
      error: 'Помилка сервера' 
    });
  }
});

// Маршрут для оцінки запису
app.post('/api/appointments/:appointmentId/rate', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { rating, review } = req.body;
    
    if (!appointmentId || !rating) {
      return res.status(400).json({ 
        success: false,
        error: 'Необхідні ID запису та рейтинг' 
      });
    }
    
    // Перевіряємо рейтинг (від 1 до 5)
    const ratingValue = parseInt(rating);
    if (ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ 
        success: false,
        error: 'Рейтинг повинен бути від 1 до 5' 
      });
    }
    
    // Перевіряємо, чи існує запис
    const appointmentDoc = await db.collection('appointments').doc(appointmentId).get();
    
    if (!appointmentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Запис не знайдено' 
      });
    }
    
    const appointmentData = appointmentDoc.data();
    
    // Перевіряємо, чи запис вже оцінений
    if (appointmentData.isRated) {
      return res.status(400).json({ 
        success: false,
        error: 'Цей запис вже оцінений' 
      });
    }
    
    // Перевіряємо, чи запис завершений
    if (appointmentData.status !== 'completed') {
      return res.status(400).json({ 
        success: false,
        error: 'Можна оцінювати тільки завершені записи' 
      });
    }
    
    // Оновлюємо запис з оцінкою
    const updatedAt = new Date().toISOString();
    await db.collection('appointments').doc(appointmentId).update({
      isRated: true,
      rating: ratingValue,
      review: review || '',
      ratedAt: updatedAt,
      updatedAt: updatedAt
    });
    
    // Оновлюємо рейтинг лікаря
    if (appointmentData.doctor) {
      await updateDoctorRating(appointmentData.doctor, ratingValue);
    }
    
    res.json({
      success: true,
      message: 'Дякуємо за вашу оцінку!',
      appointmentId,
      rating: ratingValue,
      review: review || ''
    });
    
  } catch (error) {
    console.error('Помилка при оцінці запису:', error);
    res.status(500).json({ 
      success: false,
      error: 'Помилка сервера' 
    });
  }
});

// Маршрут для отримання записів користувача
app.get('/api/appointments/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Отримуємо користувача з колекції users
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Якщо користувача немає в БД
      return res.json({
        success: true,
        userId,
        appointments: [],
        count: 0,
        active: 0,
        completed: 0,
        cancelled: 0
      });
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email;
    
    if (!userEmail) {
      return res.status(400).json({ 
        success: false,
        error: 'Email користувача не знайдено' 
      });
    }
    
    // Отримуємо всі записи з БД
    const appointmentsRef = db.collection('appointments');
    const snapshot = await appointmentsRef.orderBy('date', 'desc').get();
    
    const allAppointments = [];
    snapshot.forEach(doc => {
      allAppointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Фільтруємо записи: порівнюємо email з запису з email користувача
    const userAppointments = allAppointments.filter(appointment => {
      return appointment.email === userEmail;
    });
    
    // Автоматично оновлюємо статуси на основі дати та часу
    const updatedAppointments = [];
    
    for (const appointment of userAppointments) {
      let updatedAppointment = { ...appointment };
      
      // Автоматично змінюємо статус на "завершено", якщо запис вже пройшов
      if (appointment.status === 'active' && 
          isAppointmentCompleted(appointment.date, appointment.time)) {
        updatedAppointment.status = 'completed';
        updatedAppointment.updatedAt = new Date().toISOString();
        
        // Оновлюємо в базі даних
        await db.collection('appointments').doc(appointment.id).update({
          status: 'completed',
          updatedAt: updatedAppointment.updatedAt
        });
      }
      
      updatedAppointments.push(updatedAppointment);
    }
    
    // Розраховуємо статистику
    const active = updatedAppointments.filter(app => app.status === 'active').length;
    const completed = updatedAppointments.filter(app => app.status === 'completed').length;
    const cancelled = updatedAppointments.filter(app => app.status === 'cancelled').length;
    
    res.json({
      success: true,
      userId,
      email: userEmail,
      appointments: updatedAppointments,
      count: updatedAppointments.length,
      active,
      completed,
      cancelled
    });
    
  } catch (error) {
    console.error('Помилка при отриманні записів користувача:', error);
    res.status(500).json({ 
      success: false,
      error: 'Помилка сервера' 
    });
  }
});

// Маршрут для оновлення статусу запису (скасування)
app.patch('/api/appointments/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Необхідний ID запису' 
      });
    }
    
    if (!status || !['cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Невірний статус. Дозволено тільки "cancelled"' 
      });
    }
    
    // Перевіряємо, чи існує запис
    const appointmentDoc = await db.collection('appointments').doc(appointmentId).get();
    
    if (!appointmentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Запис не знайдено' 
      });
    }
    
    const appointmentData = appointmentDoc.data();
    
    // Перевіряємо, чи запис ще активний (можна скасувати тільки активні записи)
    if (appointmentData.status !== 'active') {
      return res.status(400).json({ 
        success: false,
        error: 'Можна скасувати тільки активні записи' 
      });
    }
    
    // Перевіряємо, чи запис вже не пройшов
    if (isAppointmentCompleted(appointmentData.date, appointmentData.time)) {
      return res.status(400).json({ 
        success: false,
        error: 'Не можна скасувати запис, який вже пройшов' 
      });
    }
    
    // Оновлюємо статус запису
    const updatedAt = new Date().toISOString();
    await db.collection('appointments').doc(appointmentId).update({
      status: status,
      updatedAt: updatedAt
    });
    
    res.json({
      success: true,
      message: 'Запис успішно скасовано',
      appointmentId,
      status: status
    });
    
  } catch (error) {
    console.error('Помилка при скасуванні запису:', error);
    res.status(500).json({ 
      success: false,
      error: 'Помилка сервера' 
    });
  }
});

// Маршрут для отримання інформації про користувача
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Користувача не знайдено' 
      });
    }
    
    res.json({
      success: true,
      id: userDoc.id,
      ...userDoc.data()
    });
  } catch (error) {
    console.error('Помилка при отриманні користувача:', error);
    res.status(500).json({ 
      success: false,
      error: 'Помилка сервера' 
    });
  }
});

// Маршрут для створення/оновлення користувача
app.post('/api/user', async (req, res) => {
  try {
    const userData = req.body;
    const { userId, ...userInfo } = userData;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Необхідний ID користувача' 
      });
    }
    
    // Додаємо timestamp
    const timestamp = new Date().toISOString();
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      // Оновлюємо існуючого користувача
      await db.collection('users').doc(userId).update({
        ...userInfo,
        updatedAt: timestamp
      });
      
      res.status(200).json({ 
        success: true, 
        message: 'Дані користувача оновлено',
        userId 
      });
    } else {
      // Створюємо нового користувача
      await db.collection('users').doc(userId).set({
        ...userInfo,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      
      res.status(201).json({ 
        success: true, 
        message: 'Користувача створено',
        userId 
      });
    }
    
  } catch (error) {
    console.error('Помилка при збереженні користувача:', error);
    res.status(500).json({ 
      success: false,
      error: 'Помилка сервера' 
    });
  }
});

// Маршрут для перевірки статусу запису (публічний)
app.get('/api/appointments/:referenceNumber/status', async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    
    if (!referenceNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'Необхідний номер направлення' 
      });
    }
    
    const appointmentsRef = db.collection('appointments');
    const snapshot = await appointmentsRef
      .where('referenceNumber', '==', referenceNumber)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ 
        success: false,
        error: 'Запис з таким номером направлення не знайдено' 
      });
    }
    
    const appointment = snapshot.docs[0].data();
    const appointmentId = snapshot.docs[0].id;
    
    // Перевіряємо, чи запис вже пройшов
    let updatedAppointment = { ...appointment };
    if (appointment.status === 'active' && 
        isAppointmentCompleted(appointment.date, appointment.time)) {
      updatedAppointment.status = 'completed';
      updatedAppointment.updatedAt = new Date().toISOString();
      
      // Оновлюємо в базі даних
      await db.collection('appointments').doc(appointmentId).update({
        status: 'completed',
        updatedAt: updatedAppointment.updatedAt
      });
    }
    
    res.json({
      success: true,
      id: appointmentId,
      referenceNumber: updatedAppointment.referenceNumber,
      service: updatedAppointment.service,
      doctor: updatedAppointment.doctor,
      date: updatedAppointment.date,
      time: updatedAppointment.time,
      status: updatedAppointment.status,
      name: updatedAppointment.name,
      phone: updatedAppointment.phone,
      createdAt: updatedAppointment.createdAt
    });
    
  } catch (error) {
    console.error('Помилка при перевірці статусу запису:', error);
    res.status(500).json({ 
      success: false,
      error: 'Помилка сервера' 
    });
  }
});

// Маршрут для автоматичного оновлення статусів всіх записів (адміністративний)
app.post('/api/appointments/update-statuses', async (req, res) => {
  try {
    // Цей маршрут можна викликати через cron або вручну для оновлення всіх статусів
    
    const appointmentsRef = db.collection('appointments');
    const snapshot = await appointmentsRef.get();
    
    let updatedCount = 0;
    
    for (const doc of snapshot.docs) {
      const appointment = doc.data();
      const appointmentId = doc.id;
      
      // Перевіряємо, чи активний запис вже пройшов
      if (appointment.status === 'active' && 
          isAppointmentCompleted(appointment.date, appointment.time)) {
        
        await db.collection('appointments').doc(appointmentId).update({
          status: 'completed',
          updatedAt: new Date().toISOString()
        });
        
        updatedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Статуси оновлено для ${updatedCount} записів`,
      updatedCount
    });
    
  } catch (error) {
    console.error('Помилка при оновленні статусів записів:', error);
    res.status(500).json({ 
      success: false,
      error: 'Помилка сервера' 
    });
  }
});

// Обробка 404 - маршрут не знайдено
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Маршрут не знайдено',
    path: req.path,
    method: req.method
  });
});

// Обробка глобальних помилок
app.use((err, req, res, next) => {
  console.error('Глобальна помилка:', err);
  res.status(500).json({ 
    success: false,
    error: 'Внутрішня помилка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порті ${PORT}`);
});