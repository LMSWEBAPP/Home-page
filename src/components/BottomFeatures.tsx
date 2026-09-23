'use client';

import React from 'react';
import styles from './BottomFeatures.module.css';
import { User, Zap, BarChart3, MessageCircle } from 'lucide-react';

export default function BottomFeatures() {
  const features = [
    {
      icon: <User size={20} className={styles.iconLight} />,
      title: 'Personalized Learning',
      subtitle: 'Built around you',
      badgeClass: styles.badgeViolet
    },
    {
      icon: <Zap size={20} className={styles.iconLight} />,
      title: 'Instant Explanations',
      subtitle: 'Clear and simple',
      badgeClass: styles.badgePurple
    },
    {
      icon: <BarChart3 size={20} className={styles.iconLight} />,
      title: 'Track Progress',
      subtitle: 'See your growth',
      badgeClass: styles.badgeIndigo
    },
    {
      icon: <MessageCircle size={20} className={styles.iconLight} />,
      title: 'AI Companion',
      subtitle: 'Always by your side',
      badgeClass: styles.badgeLavender
    }
  ];

  return (
    <section className={styles.bottomSection}>
      <div className={styles.container}>
        <div className={styles.cardsGrid}>
          {features.map((feat, idx) => (
            <div key={idx} className={styles.card}>
              <div className={`${styles.iconBox} ${feat.badgeClass}`}>
                {feat.icon}
              </div>
              <div className={styles.textWrap}>
                <h3 className={styles.cardTitle}>{feat.title}</h3>
                <p className={styles.cardSubtitle}>{feat.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
