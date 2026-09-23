'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ParticlesBackgroundProps {
  count?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export class ParticlesSwarm {
  count: number;
  canvas: HTMLCanvasElement;
  speedMult: number;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  dummy: THREE.Object3D;
  color: THREE.Color;
  target: THREE.Vector3;
  geometry: THREE.TetrahedronGeometry;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.InstancedMesh;
  positions: THREE.Vector3[];
  clock: THREE.Clock;
  animationFrameId: number | null = null;
  onResizeBound: () => void;

  constructor(canvas: HTMLCanvasElement, count = 7500) {
    this.count = count;
    this.canvas = canvas;
    this.speedMult = 0.85;

    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight;

    // SCENE & CAMERA (No fog to guarantee 100% transparent background)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    this.camera.position.set(0, 0, 110);

    // RENDERER - Pure alpha, completely transparent (no black box overlay)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0); // 100% transparent clear color

    // PARTICLES with Additive Blending for brilliant radiant glow without black box
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.target = new THREE.Vector3();

    this.geometry = new THREE.TetrahedronGeometry(0.32);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.mesh);

    this.positions = [];
    for (let i = 0; i < this.count; i++) {
      this.positions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        )
      );
      this.mesh.setColorAt(i, this.color.setHex(0x38bdf8));
    }

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.onResizeBound = this.onResize.bind(this);
    window.addEventListener('resize', this.onResizeBound);

    this.animate();
  }

  onResize() {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth || this.canvas.parentElement?.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || this.canvas.parentElement?.clientHeight || window.innerHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime() * this.speedMult;

    const s = 50;
    const v = 0.8;
    const h = 1.0;
    const r = 0.8;
    const d = 1.0;

    const n = Math.max(1, this.count);
    const tau = 6.283185307179586;
    const rows = Math.max(1, Math.ceil(n / 10));
    const t = time * v;
    const dt = time * (0.8 + d);
    const tube = s * (0.05 + 0.02 * h);
    const dr = s * (0.18 + 0.03 * r);

    for (let i = 0; i < this.count; i++) {
      const target = this.target;
      const color = this.color;

      const lane = i % 10;
      const row = (i - lane) / 10;

      const dataMask = Math.min(1, Math.floor(lane / 8));
      const energyMask = 1.0 - dataMask;

      const u0 = (row + 0.5) / rows + t * 0.04;
      const u = u0 - Math.floor(u0);
      const a = u * tau;

      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const c2 = Math.cos(a * 2.0);
      const s2 = Math.sin(a * 2.0);

      const top = 0.5 * (sa + Math.abs(sa));
      const bottom = 0.5 * (-sa + Math.abs(sa));

      const cx = s * (1.15 * ca + 0.08 * c2);
      const cy = s * (0.42 * top - 0.28 * bottom + 0.03 * s2);
      const cz = s * 0.72 * sa;

      const lu = (lane + 0.5) / 10.0;

      const spin = lu * tau * 2.0 + a * (1.4 + r * 0.5) - t * (1.2 + h * 0.15);

      const cs = Math.cos(spin);
      const ss = Math.sin(spin);

      const wave = s * 0.012 * Math.sin(a * 6.0 - t * 2.0 + spin);

      const ex = cx + ca * tube * cs - sa * tube * 0.3 * ss;
      const ey = cy + tube * ss + wave;
      const ez = cz + sa * tube * cs + ca * tube * 0.3 * ss;

      const ds = lu * tau * 3.0 + a * (3.0 + d) - dt * 1.5;

      const dc = Math.cos(ds);
      const dn = Math.sin(ds);

      const dx = cx + ca * dr + ca * tube * 0.5 * dc;
      const dy = cy + s * 0.16 + dr * 0.35 * dn;
      const dz = cz + sa * dr + sa * tube * 0.5 * dc;

      const x = ex * energyMask + dx * dataMask;
      const y = ey * energyMask + dy * dataMask;
      const z = ez * energyMask + dz * dataMask;

      // Vertical spiral: Orient the loop vertically along the Y-axis to frame the mascot
      const vertX = -y * 1.35 + 4.5;
      const vertY = x;
      const vertZ = z;

      target.set(vertX, vertY, vertZ);

      const pulse = 0.5 + 0.5 * Math.sin(a * 3.0 - t * 1.8);

      const heatZone = 0.5 - 0.5 * ca;
      const powerZone = 0.5 + 0.5 * sa;

      // Vedika signature palette: Electric Cyan + Amethyst Purple / Violet + Golden Sparkles
      const energyHue = 0.73 + 0.08 * heatZone + 0.04 * powerZone; // Violet & Purple
      const dataHue = 0.54 + 0.04 * (0.5 + 0.5 * dn); // Electric Sky / Cyan

      const hue = energyHue * energyMask + dataHue * dataMask;
      const sat = energyMask * (0.85 + 0.15 * pulse) + dataMask * 0.95;
      const light = energyMask * (0.42 + 0.28 * pulse) + dataMask * (0.55 + 0.2 * (0.5 + 0.5 * dn));

      color.setHSL(
        Math.max(0, Math.min(1, hue % 1)),
        Math.max(0, Math.min(1, sat)),
        Math.max(0, Math.min(1, light))
      );

      // UPDATE
      this.positions[i].lerp(this.target, 0.1);
      this.dummy.position.copy(this.positions[i]);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, this.color);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }

    // Direct render with alpha: true - 100% transparent where no particles exist
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.onResizeBound);
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.mesh);
    this.renderer.dispose();
  }
}

export default function ParticlesBackground({
  count = 7500,
  opacity = 0.85,
  className,
  style,
}: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const swarm = new ParticlesSwarm(canvas, count);

    return () => {
      swarm.dispose();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
        ...style,
      }}
    />
  );
}
