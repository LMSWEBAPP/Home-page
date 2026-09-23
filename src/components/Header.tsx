'use client';

import React, { useState } from 'react';
import styles from './Header.module.css';
import { Search, ArrowRight } from 'lucide-react';

export default function Header() {
  const [activeNav, setActiveNav] = useState('Home');

  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'Courses', id: 'courses' },
    { label: 'Vedika AI', id: 'vedika-ai' },
    { label: 'Labs', id: 'labs' },
    { label: 'Community', id: 'community' },
    { label: 'Pricing', id: 'pricing' }
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Left Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.starIcon}>
            {/* 4-pointed glowing blue star matching the design */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z"
                fill="url(#starGradient)"
              />
              <defs>
                <linearGradient id="starGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa" />
                  <stop offset="0.5" stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className={styles.brandTexts}>
            <span className={styles.brandTitle}>VEDIKA</span>
            <span className={styles.brandSubtitle}>AI TUTOR</span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className={styles.navMenu} aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = activeNav === item.label;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                onClick={() => setActiveNav(item.label)}
              >
                <span>{item.label}</span>
                {isActive && <span className={styles.activeGlowIndicator}></span>}
              </button>
            );
          })}
        </nav>

        {/* Right Action Items */}
        <div className={styles.rightActions}>
          <button
            type="button"
            className={styles.searchBtn}
            aria-label="Search courses and topics"
          >
            <Search size={16} className={styles.searchIcon} />
          </button>

          <button
            type="button"
            className={styles.getStartedBtn}
          >
            <span>Get Started</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
