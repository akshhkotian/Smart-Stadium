import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-secondary py-4 mt-auto border-top border-secondary">
      <div className="container text-center">
        <p className="mb-1 text-white">&copy; {new Date().getFullYear()} Smart Stadium and Tournament Operation System.</p>
        <p className="small mb-0">Designed for ultimate sports tournament scheduling and stadium management.</p>
      </div>
    </footer>
  );
};

export default Footer;
