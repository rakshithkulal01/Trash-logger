import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">Community Trash Logger</h1>
        
        <button 
          className="menu-toggle" 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <span className="menu-icon"></span>
          <span className="menu-icon"></span>
          <span className="menu-icon"></span>
        </button>

        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
            onClick={closeMenu}
          >
            Log Trash
          </Link>
          <Link 
            to="/map" 
            className={`nav-link ${isActive('/map') ? 'nav-link-active' : ''}`}
            onClick={closeMenu}
          >
            Map
          </Link>
          <Link 
            to="/report" 
            className={`nav-link ${isActive('/report') ? 'nav-link-active' : ''}`}
            onClick={closeMenu}
          >
            Report
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
