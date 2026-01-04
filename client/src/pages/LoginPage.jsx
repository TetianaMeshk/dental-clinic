import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup 
} from 'firebase/auth';
import axios from 'axios';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaUserPlus, FaSignInAlt, FaTimes } from 'react-icons/fa';
import './LoginPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LoginPage = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const saveUserToDatabase = async (userId, userEmail, userName, userPhone) => {
    try {
      await axios.post(`${API_BASE_URL}/api/user`, {
        userId,
        email: userEmail,
        name: userName,
        phone: userPhone
      });
    } catch (error) {
      console.error('Помилка при збереженні користувача в БД:', error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userName = user.displayName || user.email.split('@')[0];
      const userPhone = user.phoneNumber || '';
      
      await saveUserToDatabase(user.uid, user.email, userName, userPhone);
      
      onClose();
      navigate('/profile');
    } catch (error) {
      console.error('Помилка автентифікації через Google:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
        navigate('/profile');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await saveUserToDatabase(user.uid, user.email, name, phone);
        onClose();
        navigate('/profile');
      }
    } catch (error) {
      console.error('Помилка автентифікації:', error);
      setError(getErrorMessage(error.code));
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Цей email вже зареєстрований';
      case 'auth/invalid-email':
        return 'Невірний формат email';
      case 'auth/weak-password':
        return 'Пароль повинен містити щонайменше 6 символів';
      case 'auth/user-not-found':
        return 'Користувача з таким email не знайдено';
      case 'auth/wrong-password':
        return 'Невірний пароль';
      case 'auth/network-request-failed':
        return 'Проблема з мережевим з\'єднанням';
      case 'auth/popup-closed-by-user':
        return 'Вікно авторизації було закрито';
      case 'auth/popup-blocked':
        return 'Спробуйте вимкнути блокувальник спливаючих вікон';
      default:
        return 'Сталася помилка. Спробуйте ще раз';
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay') && !loading) {
      handleClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isLogin ? 'Вхід в акаунт' : 'Реєстрація'}</h2>
          <button className="close-btn" onClick={handleClose} disabled={loading || googleLoading}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-content">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>
                    <FaUser className="input-icon" />
                    Ваше ім'я *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Введіть ваше повне ім'я"
                    required={!isLogin}
                    disabled={loading || googleLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <FaPhone className="input-icon" />
                    Номер телефону *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Введіть номер телефону"
                    required={!isLogin}
                    disabled={loading || googleLoading}
                  />
                </div>
              </>
            )}
            
            <div className="form-group">
              <label>
                <FaEnvelope className="input-icon" />
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введіть ваш email"
                required
                disabled={loading || googleLoading}
              />
            </div>
            
            <div className="form-group">
              <label>
                <FaLock className="input-icon" />
                Пароль *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть пароль"
                required
                minLength="6"
                disabled={loading || googleLoading}
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || googleLoading}
            >
              {loading ? (
                'Завантаження...'
              ) : isLogin ? (
                <>
                  <FaSignInAlt />
                  Увійти
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Зареєструватися
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>або</span>
          </div>

          <button 
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            type="button"
          >
            <div className="google-icon"></div>
            {googleLoading ? 'Завантаження...' : 'Увійти через Google'}
          </button>
          
          <div className="auth-switch">
            <p>
              {isLogin ? 'Ще не маєте акаунту?' : 'Вже маєте акаунт?'}
              <button 
                className="switch-btn"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading || googleLoading}
                type="button"
              >
                {isLogin ? 'Зареєструватися' : 'Увійти'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;