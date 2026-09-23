'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './InteractiveBotReveal.module.css';
import { Sparkles, ArrowUpRight, MessageSquare, Compass } from 'lucide-react';

interface TrailPoint {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  decay: number;
  wobblePhase: number;
}

export default function InteractiveBotReveal() {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const humanImgRef = useRef<HTMLImageElement | null>(null);
  const robotImgRef = useRef<HTMLImageElement | null>(null);

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [cursorInStage, setCursorInStage] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Fixed configuration: 25px reveal radius & automatic fluid dissolve
  const FIXED_RADIUS = 25;
  const DECAY_RATE = 0.018; // smooth, elegant dissolve-back

  // Animation references
  const trailRef = useRef<TrailPoint[]>([]);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload images
  useEffect(() => {
    if (!mounted) return;

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        setImagesLoaded(true);
      }
    };

    const humanImg = new window.Image();
    humanImg.src = '/vedika-human-clean.png';
    humanImg.onload = () => {
      humanImgRef.current = humanImg;
      checkLoaded();
    };

    const robotImg = new window.Image();
    robotImg.src = '/vedika-bot.png';
    robotImg.onload = () => {
      robotImgRef.current = robotImg;
      checkLoaded();
    };

    return () => {
      humanImgRef.current = null;
      robotImgRef.current = null;
    };
  }, [mounted]);

  // Main canvas render loop
  useEffect(() => {
    if (!mounted || !imagesLoaded) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderLoop = () => {
      timeRef.current += 0.04;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw the Base Happy Student Layer
      if (humanImgRef.current) {
        const img = humanImgRef.current;
        const imgRatio = img.width / img.height;
        const stageRatio = w / h;
        let dw = w;
        let dh = h;
        let dx = 0;
        let dy = 0;

        if (imgRatio > stageRatio) {
          dw = w;
          dh = w / imgRatio;
          dy = (h - dh) / 2;
        } else {
          dh = h;
          dw = h * imgRatio;
          dx = (w - dw) / 2;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
      }

      // 2. Erase the fluid trail using 'destination-out' to reveal the inner robot
      ctx.globalCompositeOperation = 'destination-out';

      const points = trailRef.current;
      for (let i = points.length - 1; i >= 0; i--) {
        const pt = points[i];

        // Non-circular organic fluid wave shape
        ctx.beginPath();
        const steps = 18;
        const baseR = pt.radius;
        const timeOffset = timeRef.current * 1.6 + pt.wobblePhase;

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

        // Soft fluid gradient
        const grad = ctx.createRadialGradient(
          pt.x,
          pt.y,
          Math.max(0, baseR * 0.1),
          pt.x,
          pt.y,
          baseR * 1.15
        );
        grad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, pt.alpha)})`);
        grad.addColorStop(0.7, `rgba(0, 0, 0, ${Math.min(1, pt.alpha * 0.85)})`);
        grad.addColorStop(0.95, `rgba(0, 0, 0, ${Math.min(1, pt.alpha * 0.3)})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fill();

        // Dissolve back automatically
        pt.alpha -= pt.decay;
        pt.radius += 0.12;
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

  // Pointer movement: dense interpolation with fixed 25px radius
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorPos({ x, y });

    if (!lastMousePosRef.current) {
      lastMousePosRef.current = { x, y };
      trailRef.current.push({
        x,
        y,
        radius: FIXED_RADIUS,
        alpha: 1.0,
        decay: DECAY_RATE,
        wobblePhase: Math.random() * Math.PI * 2
      });
      return;
    }

    const prev = lastMousePosRef.current;
    const dist = Math.hypot(x - prev.x, y - prev.y);

    const stepDist = 6;
    const steps = Math.max(1, Math.floor(dist / stepDist));

    for (let i = 1; i <= steps; i++) {
      const ix = prev.x + (x - prev.x) * (i / steps);
      const iy = prev.y + (y - prev.y) * (i / steps);
      const rVar = FIXED_RADIUS * (0.92 + Math.sin(trailRef.current.length * 0.8) * 0.16);

      trailRef.current.push({
        x: ix,
        y: iy,
        radius: rVar,
        alpha: 1.0,
        decay: DECAY_RATE,
        wobblePhase: Math.random() * Math.PI * 2
      });
    }

    if (trailRef.current.length > 300) {
      trailRef.current = trailRef.current.slice(-300);
    }

    lastMousePosRef.current = { x, y };
  };

  const handlePointerEnter = () => {
    setCursorInStage(true);
  };

  const handlePointerLeave = () => {
    setCursorInStage(false);
    lastMousePosRef.current = null;
  };

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        {/* Left Column: Clean, Elegant Landing Page Content */}
        <div className={styles.contentCol}>
          {/* Eyebrow badge */}
          <div className={styles.eyebrowBadge}>
            <span className={styles.badgeDot}></span>
            <span className={styles.badgeText}>NEXT-GEN COGNITIVE MENTOR</span>
          </div>

          {/* Main Display Title */}
          <div className={styles.titleWrapper}>
            <h1 className={styles.brandTitle}>VEDIKA</h1>
            <span className={styles.categoryPill}>AI TUTOR</span>
          </div>

          {/* Rewritten Catchy Quote Hook */}
          <div className={styles.quoteBlock}>
            <p className={styles.quoteLead}>
              &ldquo;Every fearless smile begins the moment curiosity feels understood.&rdquo;
            </p>
            <p className={styles.quoteSub}>
              Meet the quiet intelligence turning everyday questions into lifelong breakthroughs.
            </p>
          </div>

          {/* Clean Value Proposition */}
          <p className={styles.description}>
            We adapt to how each mind learns. Explore concepts at your own pace with a companion
            built for patient explanations, instant clarity, and pure joy.
          </p>

          {/* Action CTAs (Reference Design layout) */}
          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                // Focus interaction on the mascot
                containerRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Explore Vedika</span>
              <span className={styles.btnDotPill}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </span>
            </button>

            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryBtn}
            >
              <MessageSquare size={15} />
              <span>Connect With Us</span>
            </a>
          </div>

          {/* Subtle Interaction Hint */}
          <div className={styles.interactionHint}>
            <Sparkles size={13} className={styles.hintIcon} />
            <span>Glide across the student to dissolve the surface and glimpse the neural core</span>
          </div>
        </div>

        {/* Right Column: Clean Mascot Stage */}
        <div className={styles.stageCol}>
          <div className={styles.ambientGlowPrimary}></div>
          <div className={styles.ambientGlowSecondary}></div>

          <div
            ref={containerRef}
            className={styles.mascotStage}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            {/* Layer 1: Inner Mechanical Robot (vedika-bot.png) */}
            <div className={styles.robotLayer}>
              <Image
                src="/vedika-bot.png"
                alt="Vedika Inner Mechanical Robot Core"
                width={560}
                height={750}
                priority
                className={styles.botImage}
              />
            </div>

            {/* Layer 2: Fluid Canvas Layer displaying Happy Student */}
            <canvas ref={canvasRef} className={styles.flowCanvas} />

            {/* Fine 25px Glowing Pointer Dot */}
            <div
              className={styles.fluidPointerDot}
              style={{
                transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
                opacity: cursorInStage ? 1 : 0
              }}
            >
              <div className={styles.pointerHalo}></div>
              <div className={styles.pointerCore}></div>
            </div>

            {/* Subtle Guide prompt when idle */}
            <div
              className={styles.idlePrompt}
              style={{ opacity: cursorInStage ? 0 : 1 }}
            >
              <Compass size={13} className={styles.promptIcon} />
              <span>Glide pointer to reveal</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
