import React from 'react';
import Services from '../components/Services';

const ServicesPage = () => {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Наші послуги</h1>
          <p className="page-subtitle">Повний спектр стоматологічних послуг для всієї родини</p>
        </div>
      </section>
      <Services />
    </>
  );
};

export default ServicesPage;