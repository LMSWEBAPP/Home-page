'use client';

import React from 'react';
import styles from './Navbar.module.css';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function Navbar() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <header className={styles.header}>
      <div className={styles.navContainer}>
        {/* Brand Pill (inspired by reference layout) */}
        <div className={styles.brandPill} onClick={handleReload}>
          <span className={styles.brandDot}></span>
          <span className={styles.brandName}>VEDIKA</span>
          <span className={styles.badgeText}>AI</span>
        </div>

        {/* Right Navigation Controls */}
        <div className={styles.rightControls}>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.discordPill}
            title="Join Community Discord"
          >
            <MessageSquare size={14} className={styles.iconCyan} />
            <span>Community</span>
          </a>

          <a
            href="#experience"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={styles.ctaPill}
          >
            <Sparkles size={13} className={styles.sparkleIcon} />
            <span>Try Vedika</span>
          </a>
        </div>
      </div>
    </header>
  );
}
