'use client';

import React from 'react';
import Image from 'next/image';
import styles from './Hero.module.css';
import { Sparkles, MessageSquare, ArrowUpRight, Zap, CheckCircle, Brain, Shield, ChevronRight } from 'lucide-react';

interface HeroProps {
  onStartLearning?: () => void;
}

export default function Hero({ onStartLearning }: HeroProps) {
  const scrollToDemo = () => {
    const el = document.getElementById('demo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    if (onStartLearning) onStartLearning();
  };

  return (
    <section id="hero" className={styles.heroSection}>
      <div className={styles.container}>
        {/* Left Column: Hero Typography and Action CTAs */}
        <div className={styles.contentCol}>
          {/* Futuristic Micro Pill Badge */}
          <div className={styles.eyebrowBadge}>
            <span className={styles.badgePulse}></span>
            <span className={styles.badgeText}>NEXT-GEN COGNITIVE COMPANION</span>
            <span className={styles.badgeVersion}>v2.4</span>
          </div>

          {/* Main Title matching the reference layout */}
          <div className={styles.titleWrapper}>
            <h1 className={styles.mainTitle}>VEDIKA</h1>
            <div className={styles.subTitleBadge}>
              <span className={styles.subTitleText}>AI TUTOR</span>
              <span className={styles.titleGlow}></span>
            </div>
          </div>

          {/* Punchy Value Proposition */}
          <p className={styles.description}>
            We Adapt. We Guide. We Accelerate. Step into the frontier of hyper-personalized education
            with an autonomous AI tutor engineered for 24/7 conceptual mastery.
          </p>

          {/* Action CTAs (Directly mirroring reference button style: "Discover ••" & "Connect With Us") */}
          <div className={styles.actionRow}>
            <button
              className={styles.primaryPillBtn}
              onClick={scrollToDemo}
              aria-label="Start Learning with Vedika AI"
            >
              <span className={styles.btnLabel}>Start Learning</span>
              <span className={styles.btnDotPill}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </span>
            </button>

            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryPillBtn}
              aria-label="Connect with our Discord Community"
            >
              <div className={styles.discordIconWrap}>
                <MessageSquare size={16} />
              </div>
              <span>Connect With Us</span>
            </a>
          </div>

          {/* Live User Proof Stats */}
          <div className={styles.proofStrip}>
            <div className={styles.avatars}>
              <div className={`${styles.avatar} ${styles.av1}`}>🎓</div>
              <div className={`${styles.avatar} ${styles.av2}`}>🚀</div>
              <div className={`${styles.avatar} ${styles.av3}`}>⚡</div>
              <div className={`${styles.avatar} ${styles.av4}`}>🔬</div>
            </div>
            <div className={styles.proofText}>
              <div className={styles.stars}>★★★★★ <span>4.98 / 5.0</span></div>
              <p>Trusted by <strong>140,000+</strong> students & researchers worldwide</p>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual with Glowing Ambient Atmosphere & Vedika Bot */}
        <div className={styles.visualCol}>
          {/* Atmospheric Glowing Backdrop */}
          <div className={styles.ambientGlowPrimary}></div>
          <div className={styles.ambientGlowSecondary}></div>
          <div className={styles.concentricRings}>
            <div className={styles.ring1}></div>
            <div className={styles.ring2}></div>
          </div>

          {/* Vedika Robot Container with Floating Physics */}
          <div className={styles.botWrapper}>
            <div className={styles.botImageContainer}>
              <Image
                src="/vedika-bot.png"
                alt="Vedika AI Tutor Robot Companion"
                width={560}
                height={700}
                priority
                className={styles.botImage}
              />
              <div className={styles.botReflection}></div>
            </div>

            {/* Floating HUD Telemetry Badges */}
            <div className={`${styles.hudBadge} ${styles.hudTopLeft}`}>
              <div className={styles.hudIconPulse}>
                <span className={styles.liveGreenDot}></span>
              </div>
              <div className={styles.hudContent}>
                <span className={styles.hudLabel}>Neural Engine</span>
                <span className={styles.hudValue}>Voice & Vision Active</span>
              </div>
            </div>

            <div className={`${styles.hudBadge} ${styles.hudBottomLeft}`}>
              <div className={styles.hudIconWrapCyan}>
                <Zap size={16} />
              </div>
              <div className={styles.hudContent}>
                <span className={styles.hudLabel}>Reasoning Speed</span>
                <span className={styles.hudValue}>18ms Latency • 99.4% Acc</span>
              </div>
            </div>

            <div className={`${styles.hudBadge} ${styles.hudBottomRight}`}>
              <div className={styles.hudIconWrapViolet}>
                <Brain size={16} />
              </div>
              <div className={styles.hudContent}>
                <span className={styles.hudLabel}>Socratic Mode</span>
                <span className={styles.hudValue}>Feynman Technique ON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
