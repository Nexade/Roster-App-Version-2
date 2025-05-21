import React from 'react';
import '../styles/LoadScreen.css';
import logoImg from '../assets/logo-placeholder.jpg';

const LoadScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo-container">
          <img src={logoImg} alt="App Logo" className="logo-image" />
          <div className='circle'/>
          {/*
          <div className="loading-ring">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="loading-ring-circle" />
            ))}
          </div>*/}
        </div>
        <p className="loading-text">Loading...</p>
      </div>
    </div>
  );
};

export default LoadScreen;