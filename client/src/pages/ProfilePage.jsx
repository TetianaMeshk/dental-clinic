import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import axios from 'axios';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendarAlt, 
  FaSignOutAlt, 
  FaEdit,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import UserAppointments from '../components/UserAppointments';
import './ProfilePage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        // Якщо користувач не авторизований - перенаправляємо на головну
        navigate('/');
        return;
      }
      
      setUser(currentUser);
      await fetchUserData(currentUser.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId) => {
    try {
      const userResponse = await axios.get(`http://localhost:5000/api/user/${userId}`);
      
      if (userResponse.data.success) {
        const data = userResponse.data;
        setUserData(data);
        setEditForm({
          name: data.name || '',
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Помилка при отриманні даних:', error);
      
      if (error.response?.status === 404) {
        const defaultUserData = {
          name: user.email.split('@')[0],
          phone: 'Не вказано',
          email: user.email,
          createdAt: user.metadata.creationTime
        };
        setUserData(defaultUserData);
        setEditForm({
          name: defaultUserData.name,
          phone: defaultUserData.phone
        });
        
        try {
          await axios.post('http://localhost:5000/api/user', {
            userId: user.uid,
            ...defaultUserData
          });
        } catch (saveError) {
          console.error('Помилка при збереженні користувача:', saveError);
        }
      }
    }
  };

  const handleEditClick = () => {
    setEditing(true);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditForm({
      name: userData?.name || '',
      phone: userData?.phone || ''
    });
    setError('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      setError('Ім\'я є обов\'язковим полем');
      return;
    }

    if (!editForm.phone.trim()) {
      setError('Номер телефону є обов\'язковим полем');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await axios.post('http://localhost:5000/api/user', {
        userId: user.uid,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: user.email,
        createdAt: userData?.createdAt
      });

      if (response.data.success) {
        // Оновлюємо локальні дані
        const updatedUserData = {
          ...userData,
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          updatedAt: new Date().toISOString()
        };
        setUserData(updatedUserData);
        setEditing(false);
        alert('Профіль успішно оновлено!');
      }
    } catch (error) {
      console.error('Помилка при оновленні профілю:', error);
      setError(error.response?.data?.error || 'Помилка при оновленні профілю');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Помилка при виході:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не вказано';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        Завантаження...
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <section className="profile-page">
      <div className="container">
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {userData.name ? userData.name.charAt(0).toUpperCase() : <FaUser />}
              </div>
              <div className="profile-info">
                <div className="profile-title-section">
                  <h2>Особистий кабінет</h2>
                  {!editing && (
                    <button 
                      className="edit-profile-btn"
                      onClick={handleEditClick}
                    >
                      <FaEdit /> Редагувати профіль
                    </button>
                  )}
                </div>
                <p className="profile-email">
                  <FaEnvelope /> {user.email}
                </p>
              </div>
            </div>
            
            {error && (
              <div className="profile-error">
                {error}
              </div>
            )}
            
            <div className="profile-details">
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-icon">
                    <FaUser />
                  </div>
                  <div>
                    <strong>Ім'я:</strong>
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="edit-input"
                        placeholder="Введіть ваше ім'я"
                      />
                    ) : (
                      <p>{userData.name || 'Не вказано'}</p>
                    )}
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-icon">
                    <FaPhone />
                  </div>
                  <div>
                    <strong>Телефон:</strong>
                    {editing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditChange}
                        className="edit-input"
                        placeholder="Введіть номер телефону"
                        pattern="[0-9]{10,12}"
                        title="Введіть номер телефону у форматі 0671234567"
                      />
                    ) : (
                      <p>{userData.phone || 'Не вказано'}</p>
                    )}
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-icon">
                    <FaEnvelope />
                  </div>
                  <div>
                    <strong>Email:</strong>
                    <p className="email-display">{user.email}</p>
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-icon">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <strong>Дата реєстрації:</strong>
                    <p>{formatDate(userData.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {editing ? (
              <div className="edit-actions">
                <button 
                  className="profile-btn save-btn"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  <FaSave /> {saving ? 'Збереження...' : 'Зберегти зміни'}
                </button>
                <button 
                  className="profile-btn cancel-btn"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <FaTimes /> Скасувати
                </button>
              </div>
            ) : (
              <div className="profile-actions">
                <button 
                  className="profile-btn logout"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt /> Вийти з акаунта
                </button>
              </div>
            )}
          </div>
          
          {user && <UserAppointments userId={user.uid} />}
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;