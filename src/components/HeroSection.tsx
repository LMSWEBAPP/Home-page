'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './HeroSection.module.css';
import { BookOpen, Lightbulb, Target } from 'lucide-react';
import ParticlesBackground from './ParticlesBackground';

interface TrailPoint {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  decay: number;
  wobblePhase: number;
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);
  const humanImgRef = useRef<HTMLImageElement | null>(null);

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [cursorInStage, setCursorInStage] = useState(false);
  const [stageCursorPos, setStageCursorPos] = useState({ x: 0, y: 0 });
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Fluid reveal parameters (faster skin restore fallback)
  const FIXED_RADIUS = 44;
  const DECAY_RATE = 0.038;

  const trailRef = useRef<TrailPoint[]>([]);
  const lastMascotPosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const cursorInMascotRef = useRef(false);
  const mascotPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload top human student image
  useEffect(() => {
    if (!mounted) return;

    const humanImg = new window.Image();
    humanImg.src = '/vedika-human-clean.png';
    humanImg.onload = () => {
      humanImgRef.current = humanImg;
      setImagesLoaded(true);
    };

    return () => {
      humanImgRef.current = null;
    };
  }, [mounted]);

  // Canvas animation and fluid reveal loop
  useEffect(() => {
    if (!mounted || !imagesLoaded) return;
    const canvas = canvasRef.current;
    const mascot = mascotRef.current;
    if (!canvas || !mascot) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const handleResize = () => {
      if (!mascot || !canvas) return;
      const rect = mascot.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderLoop = () => {
      timeRef.current += 0.04;
      if (!mascot) return;
      const rect = mascot.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw top human student layer (100% visible by default)
      if (humanImgRef.current) {
        ctx.drawImage(humanImgRef.current, 0, 0, w, h);
      }

      // 2. Fluid destination-out erasure to reveal the underlying bot seamlessly
      ctx.globalCompositeOperation = 'destination-out';

      // 2a. Active focus aperture directly under cursor when hovering over the mascot
      if (cursorInMascotRef.current) {
        const mx = mascotPosRef.current.x;
        const my = mascotPosRef.current.y;
        const activeR = FIXED_RADIUS * 1.05;

        const activeGrad = ctx.createRadialGradient(mx, my, activeR * 0.1, mx, my, activeR * 1.15);
        activeGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        activeGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.88)');
        activeGrad.addColorStop(0.92, 'rgba(0, 0, 0, 0.3)');
        activeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = activeGrad;
        ctx.beginPath();
        ctx.arc(mx, my, activeR * 1.15, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2b. Lingering fluid organic wave trail points
      const points = trailRef.current;
      for (let i = points.length - 1; i >= 0; i--) {
        const pt = points[i];

        // Sinusoidal organic fluid contour
        ctx.beginPath();
        const steps = 18;
        const baseR = pt.radius;
        const timeOffset = timeRef.current * 1.5 + pt.wobblePhase;

        for (let j = 0; j <= steps; j++) {
          const theta = (j / steps) * Math.PI * 2;
          const wave =
            Math.sin(theta * 3 + timeOffset) * 0.14 +
            Math.cos(theta * 5 - timeOffset * 0.8) * 0.1;
          const r = baseR * (1 + wave);
          const px = pt.x + Math.cos(theta) * r;
          const py = pt.y + Math.sin(theta) * r;

          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        // Soft fluid radial gradient for seamless transition
        const grad = ctx.createRadialGradient(
          pt.x,
          pt.y,
          Math.max(0, baseR * 0.1),
          pt.x,
          pt.y,
          baseR * 1.2
        );
        grad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, pt.alpha)})`);
        grad.addColorStop(0.7, `rgba(0, 0, 0, ${Math.min(1, pt.alpha * 0.85)})`);
        grad.addColorStop(0.95, `rgba(0, 0, 0, ${Math.min(1, pt.alpha * 0.3)})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fill();

        // Smoothly dissolve back to human layer
        pt.alpha -= pt.decay;
        pt.radius += 0.08;
        if (pt.alpha <= 0) {
          points.splice(i, 1);
        }
      }

      ctx.globalCompositeOperation = 'source-over';

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [mounted, imagesLoaded]);

  // Pointer movement tracking with fluid interpolation
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const sx = e.clientX - stageRect.left;
    const sy = e.clientY - stageRect.top;
    setStageCursorPos({ x: sx, y: sy });

    if (!mascotRef.current) return;
    const mascotRect = mascotRef.current.getBoundingClientRect();
    const mx = e.clientX - mascotRect.left;
    const my = e.clientY - mascotRect.top;

    const isInside =
      mx >= -25 &&
      mx <= mascotRect.width + 25 &&
      my >= -25 &&
      my <= mascotRect.height + 25;

    cursorInMascotRef.current = isInside;
    mascotPosRef.current = { x: mx, y: my };

    if (!isInside) {
      lastMascotPosRef.current = null;
      return;
    }

    if (!lastMascotPosRef.current) {
      lastMascotPosRef.current = { x: mx, y: my };
      trailRef.current.push({
        x: mx,
        y: my,
        radius: FIXED_RADIUS,
        alpha: 1.0,
        decay: DECAY_RATE,
        wobblePhase: Math.random() * Math.PI * 2
      });
      return;
    }

    const prev = lastMascotPosRef.current;
    const dist = Math.hypot(mx - prev.x, my - prev.y);

    const stepDist = 8;
    const steps = Math.max(1, Math.floor(dist / stepDist));

    for (let i = 1; i <= steps; i++) {
      const ix = prev.x + (mx - prev.x) * (i / steps);
      const iy = prev.y + (my - prev.y) * (i / steps);
      const rVar = FIXED_RADIUS * (0.94 + Math.sin(trailRef.current.length * 0.7) * 0.12);

      trailRef.current.push({
        x: ix,
        y: iy,
        radius: rVar,
        alpha: 1.0,
        decay: DECAY_RATE,
        wobblePhase: Math.random() * Math.PI * 2
      });
    }

    if (trailRef.current.length > 250) {
      trailRef.current = trailRef.current.slice(-250);
    }

    lastMascotPosRef.current = { x: mx, y: my };
  };

  const handlePointerEnter = () => {
    setCursorInStage(true);
  };

  const handlePointerLeave = () => {
    setCursorInStage(false);
    cursorInMascotRef.current = false;
    lastMascotPosRef.current = null;
  };

  return (
    <section className={styles.heroSection}>
      {/* Subtle Three.js Background Particle Swarm */}
      <ParticlesBackground count={8000} opacity={0.34} />
      <div className={styles.container}>
        {/* Left Content Column */}
        <div className={styles.contentCol}>
          {/* Headline - Prioritising VEDIKA AI TUTOR with typography animation */}
          <h1 className={styles.mainTitle}>
            <span className={styles.titleLead}>MEET YOUR PERSONAL</span>
            <span className={styles.vedikaTutorText}>VEDIKA AI TUTOR</span>
            <span className={styles.titleSubline}>Learn Smarter. Go Further.</span>
          </h1>

          {/* Subtitle - Clean & Impactful */}
          <p className={styles.description}>
            Personalized intelligence and real-time concept mastery &mdash; built for every curious mind.
          </p>
        </div>

        {/* Right Visual Stage */}
        <div className={styles.visualCol}>
          <div
            ref={stageRef}
            className={styles.stageFrame}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            {/* Space Backdrop */}
            <div className={styles.spaceBackdrop}>
              <Image
                src="/vedika_space_backdrop.jpg"
                alt="Cosmic Space Backdrop"
                fill
                priority
                className={styles.spaceBackdropImg}
              />
            </div>

            {/* Central Mascot Container: Perfectly aligned Human & Bot */}
            <div ref={mascotRef} className={styles.mascotContainer}>
              {/* Layer 1 (Underneath): Vedika AI Bot Companion (fitted & masked) */}
              <div className={styles.innerRobotLayer}>
                <Image
                  src="/vedika-bot-fitted.png"
                  alt="Vedika AI Bot Companion"
                  fill
                  priority
                  className={styles.botImage}
                />
              </div>

              {/* Layer 2 (On Top): Human Student Canvas with fluid hover reveal */}
              <canvas ref={canvasRef} className={styles.sceneCanvas} />
            </div>

            {/* Glowing Pointer Cursor */}
            <div
              className={styles.fluidPointerDot}
              style={{
                transform: `translate3d(${stageCursorPos.x}px, ${stageCursorPos.y}px, 0)`,
                opacity: cursorInStage ? 1 : 0
              }}
            >
              <div className={styles.pointerHalo}></div>
              <div className={styles.pointerCore}></div>
            </div>

            {/* Idle Interaction Hint */}
            <div
              className={styles.idleHint}
              style={{ opacity: cursorInStage ? 0 : 1 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.idleHintIcon}>
                <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" fill="currentColor"/>
              </svg>
              <span>Glide cursor over Vedika to reveal AI Bot</span>
            </div>

            {/* ========================================================= */}
            {/* 4 REAL GLASSMORPHISM INTERACTIVE FLOATING BOXES          */}
            {/* ========================================================= */}

            {/* Box 1: Learn Concepts (Top-Left) */}
            <div
              className={`${styles.glassCard} ${styles.cardLearnConcepts} ${
                activeCard === 'concepts' ? styles.activeCard : ''
              }`}
              onClick={() => setActiveCard(activeCard === 'concepts' ? null : 'concepts')}
            >
              {/* 3D Physically Curved Glass Plate SVG - NO GLOW */}
              <svg className={styles.curvedPlateSvg} viewBox="0 0 160 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="glassBg1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1a2544" stopOpacity="0.85" />
                    <stop offset="25%" stopColor="#101830" stopOpacity="0.75" />
                    <stop offset="50%" stopColor="#1e2d52" stopOpacity="0.7" />
                    <stop offset="78%" stopColor="#0a1024" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#040612" stopOpacity="0.94" />
                  </linearGradient>
                  <linearGradient id="glassStroke1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="rimGleam1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="sheenGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Curved Panel Body */}
                <path
                  d="M 8,20 Q 80,7 152,16 C 158,18 158,110 152,112 L 152,112 Q 80,103 8,116 C 2,114 2,22 8,20 Z"
                  fill="url(#glassBg1)"
                  stroke="url(#glassStroke1)"
                  strokeWidth="1.2"
                  className={styles.curvedPlatePath}
                />
                {/* Subtle White Specular Top Rim */}
                <path
                  d="M 10,19 Q 80,6 150,15"
                  fill="none"
                  stroke="url(#rimGleam1)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
                {/* Curved Surface Glass Sheen */}
                <path
                  d="M 14,35 Q 80,22 146,31"
                  fill="none"
                  stroke="url(#sheenGrad1)"
                  strokeWidth="1.0"
                  strokeLinecap="round"
                />
                {/* Subtle HUD Latitude Guide Arc */}
                <path
                  d="M 14,56 Q 80,43 146,52"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
              </svg>

              <div className={`${styles.cardIconBox} ${styles.cardIconBoxLeft} ${styles.iconBoxCyan}`}>
                <BookOpen size={20} className={styles.cyanIconSvg} />
              </div>
              <div className={`${styles.cardTextCol} ${styles.cardTextColLeft}`}>
                <span className={`${styles.cardWord} ${styles.curvedWordLine1}`}>Learn</span>
                <span className={`${styles.cardWord} ${styles.curvedWordLine2}`}>Concepts</span>
              </div>
              <div className={styles.cardShine}></div>
            </div>

            {/* Box 2: Practice & Solve (Mid-Left) */}
            <div
              className={`${styles.glassCard} ${styles.cardPracticeSolve} ${
                activeCard === 'practice' ? styles.activeCard : ''
              }`}
              onClick={() => setActiveCard(activeCard === 'practice' ? null : 'practice')}
            >
              {/* 3D Physically Curved Glass Plate SVG - NO GLOW */}
              <svg className={styles.curvedPlateSvg} viewBox="0 0 160 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="glassBg2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#122438" stopOpacity="0.85" />
                    <stop offset="25%" stopColor="#0b1724" stopOpacity="0.75" />
                    <stop offset="50%" stopColor="#162e48" stopOpacity="0.7" />
                    <stop offset="78%" stopColor="#07101a" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#02060c" stopOpacity="0.94" />
                  </linearGradient>
                  <linearGradient id="glassStroke2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="rimGleam2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="sheenGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Curved Panel Body */}
                <path
                  d="M 8,20 Q 80,7 152,16 C 158,18 158,110 152,112 L 152,112 Q 80,103 8,116 C 2,114 2,22 8,20 Z"
                  fill="url(#glassBg2)"
                  stroke="url(#glassStroke2)"
                  strokeWidth="1.2"
                  className={styles.curvedPlatePath}
                />
                {/* Subtle White Specular Top Rim */}
                <path
                  d="M 10,19 Q 80,6 150,15"
                  fill="none"
                  stroke="url(#rimGleam2)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
                {/* Curved Surface Glass Sheen */}
                <path
                  d="M 14,35 Q 80,22 146,31"
                  fill="none"
                  stroke="url(#sheenGrad2)"
                  strokeWidth="1.0"
                  strokeLinecap="round"
                />
                {/* Subtle HUD Latitude Guide Arc */}
                <path
                  d="M 14,56 Q 80,43 146,52"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
              </svg>

              <div className={`${styles.cardIconBox} ${styles.cardIconBoxLeft} ${styles.iconBoxElectricCyan}`}>
                <Lightbulb size={20} className={styles.cyanIconSvg} />
              </div>
              <div className={`${styles.cardTextCol} ${styles.cardTextColLeft}`}>
                <span className={`${styles.cardWord} ${styles.curvedWordLine1}`}>Practice</span>
                <span className={`${styles.cardWord} ${styles.curvedWordLine2}`}>& Solve</span>
              </div>
              <div className={styles.cardShine}></div>
            </div>

            {/* Box 3: Achieve Your Goals (Bottom-Left) */}
            <div
              className={`${styles.glassCard} ${styles.cardAchieveGoals} ${
                activeCard === 'goals' ? styles.activeCard : ''
              }`}
              onClick={() => setActiveCard(activeCard === 'goals' ? null : 'goals')}
            >
              {/* 3D Physically Curved Glass Plate SVG - NO GLOW */}
              <svg className={styles.curvedPlateSvg} viewBox="0 0 160 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="glassBg3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#221238" stopOpacity="0.85" />
                    <stop offset="25%" stopColor="#160924" stopOpacity="0.75" />
                    <stop offset="50%" stopColor="#2c1448" stopOpacity="0.7" />
                    <stop offset="78%" stopColor="#0e0418" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#06020c" stopOpacity="0.94" />
                  </linearGradient>
                  <linearGradient id="glassStroke3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="rimGleam3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="sheenGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Curved Panel Body */}
                <path
                  d="M 8,20 Q 80,7 152,16 C 158,18 158,110 152,112 L 152,112 Q 80,103 8,116 C 2,114 2,22 8,20 Z"
                  fill="url(#glassBg3)"
                  stroke="url(#glassStroke3)"
                  strokeWidth="1.2"
                  className={styles.curvedPlatePath}
                />
                {/* Subtle White Specular Top Rim */}
                <path
                  d="M 10,19 Q 80,6 150,15"
                  fill="none"
                  stroke="url(#rimGleam3)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
                {/* Curved Surface Glass Sheen */}
                <path
                  d="M 14,35 Q 80,22 146,31"
                  fill="none"
                  stroke="url(#sheenGrad3)"
                  strokeWidth="1.0"
                  strokeLinecap="round"
                />
                {/* Subtle HUD Latitude Guide Arc */}
                <path
                  d="M 14,56 Q 80,43 146,52"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
              </svg>

              <div className={`${styles.cardIconBox} ${styles.cardIconBoxLeft} ${styles.iconBoxPurple}`}>
                <Target size={20} className={styles.purpleIconSvg} />
              </div>
              <div className={`${styles.cardTextCol} ${styles.cardTextColLeft}`}>
                <span className={`${styles.cardWord} ${styles.curvedWordLine1}`}>Achieve</span>
                <span className={`${styles.cardWord} ${styles.curvedWordLine2}`}>Your Goals</span>
              </div>
              <div className={styles.cardShine}></div>
            </div>

            {/* Box 4: Track Progress (Mid-Right) */}
            <div
              className={`${styles.glassCard} ${styles.cardTrackProgress} ${
                activeCard === 'progress' ? styles.activeCard : ''
              }`}
              onClick={() => setActiveCard(activeCard === 'progress' ? null : 'progress')}
            >
              {/* 3D Physically Curved Glass Plate SVG - Mirrored, NO GLOW */}
              <svg className={styles.curvedPlateSvg} viewBox="0 0 160 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="glassBg4" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#1e1438" stopOpacity="0.85" />
                    <stop offset="25%" stopColor="#120b24" stopOpacity="0.75" />
                    <stop offset="50%" stopColor="#261a48" stopOpacity="0.7" />
                    <stop offset="78%" stopColor="#0b0618" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#04020a" stopOpacity="0.94" />
                  </linearGradient>
                  <linearGradient id="glassStroke4" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="rimGleam4" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="sheenGrad4" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Curved Panel Body - Mirrored */}
                <path
                  d="M 8,16 Q 80,7 152,20 C 158,22 158,114 152,116 L 152,116 Q 80,103 8,112 C 2,110 2,18 8,16 Z"
                  fill="url(#glassBg4)"
                  stroke="url(#glassStroke4)"
                  strokeWidth="1.2"
                  className={styles.curvedPlatePath}
                />
                {/* Subtle White Specular Top Rim */}
                <path
                  d="M 10,15 Q 80,6 150,19"
                  fill="none"
                  stroke="url(#rimGleam4)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
                {/* Curved Surface Glass Sheen */}
                <path
                  d="M 14,31 Q 80,22 146,35"
                  fill="none"
                  stroke="url(#sheenGrad4)"
                  strokeWidth="1.0"
                  strokeLinecap="round"
                />
                {/* Subtle HUD Latitude Guide Arc */}
                <path
                  d="M 14,54 Q 80,43 146,58"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
              </svg>

              <div className={`${styles.cardIconBox} ${styles.cardIconBoxRight} ${styles.iconBoxIndigo}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="14" width="4.5" height="7" rx="1.5" fill="url(#barG1)" />
                  <rect x="9.75" y="9" width="4.5" height="12" rx="1.5" fill="url(#barG2)" />
                  <rect x="16.5" y="4" width="4.5" height="17" rx="1.5" fill="url(#barG3)" />
                  <defs>
                    <linearGradient id="barG1" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#38bdf8" />
                      <stop offset="1" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="barG2" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#818cf8" />
                      <stop offset="1" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="barG3" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#c084fc" />
                      <stop offset="1" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className={`${styles.cardTextCol} ${styles.cardTextColRight}`}>
                <span className={`${styles.cardWord} ${styles.curvedWordLine1Right}`}>Track</span>
                <span className={`${styles.cardWord} ${styles.curvedWordLine2Right}`}>Progress</span>
              </div>
              <div className={styles.cardShine}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
