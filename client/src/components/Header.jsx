import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTooth, FaBars, FaTimes, FaUser } from 'react-icons/fa';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LoginPage from '../pages/LoginPage';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const menuRef = useRef(null);
  const menuToggleRef = useRef(null);
  const logoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && showLoginModal) {
        setShowLoginModal(false);
      }
    });

    // Закриваємо меню при кліку поза ним
    const handleClickOutside = (event) => {
      const isMenuOpenCondition = isMenuOpen;
      const menuElement = menuRef.current;
      const toggleElement = menuToggleRef.current;
      const logoElement = logoRef.current;
      
      if (isMenuOpenCondition && 
          menuElement && 
          !menuElement.contains(event.target) &&
          toggleElement && 
          !toggleElement.contains(event.target) &&
          logoElement && 
          !logoElement.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    // Закриваємо меню при зміні розміру вікна
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMenuOpen, showLoginModal]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (showLoginModal) {
      setShowLoginModal(false);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
    setIsMenuOpen(false);
    setShowLoginModal(false);
  };

  const handleBookAppointment = () => {
    setIsMenuOpen(false);
    setShowLoginModal(false);
    
    if (window.location.pathname === '/') {
      document.getElementById('appointment-form')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('appointment-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleUserClick = () => {
    setIsMenuOpen(false);
    
    if (user) {
      navigate('/profile');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleNavLinkClick = () => {
    setIsMenuOpen(false);
    setShowLoginModal(false);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div 
              className="logo" 
              onClick={handleLogoClick}
              ref={logoRef}
              style={{ cursor: 'pointer' }}
            >
              <FaTooth className="logo-icon" />
              <span className="logo-text">Dental Clinic</span>
            </div>
            
            <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`} ref={menuRef}>
              <Link to="/services" className="nav-link" onClick={handleNavLinkClick}>
                Послуги
              </Link>
              <Link to="/doctors" className="nav-link" onClick={handleNavLinkClick}>
                Лікарі
              </Link>
              
              <div className="nav-actions">
                <button 
                  className="btn btn-primary appointment-btn" 
                  onClick={handleBookAppointment}
                >
                  Записатись на прийом
                </button>

                <div className="user-section">
                  <button className="user-icon-btn" onClick={handleUserClick}>
                    <FaUser />
                  </button>
                </div>
              </div>
            </nav>
            
            <button 
              className="menu-toggle" 
              onClick={toggleMenu}
              ref={menuToggleRef}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </header>

      {/* Модальне вікно автентифікації */}
      {showLoginModal && (
        <LoginPage onClose={handleCloseLoginModal} />
      )}
    </>
  );
};

export default Header;