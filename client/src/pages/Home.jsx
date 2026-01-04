import React from 'react';
import Hero from '../components/Hero';
import HomeServices from '../components/HomeServices';
import DoctorsHome from '../components/DoctorsHome';
import AppointmentComponent from '../components/AppointmentComponent';

const Home = () => {
  return (
    <>
      <Hero />
      <HomeServices />
      <DoctorsHome />
      <AppointmentComponent />
    </>
  );
};

export default Home;