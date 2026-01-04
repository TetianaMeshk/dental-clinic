import React from 'react';
import Doctors from '../components/Doctors';

const DoctorsPage = () => {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Наші лікарі</h1>
          <p className="page-subtitle">Професійна команда стоматологів з багаторічним досвідом</p>
        </div>
      </section>
      <Doctors />
    </>
  );
};

export default DoctorsPage;