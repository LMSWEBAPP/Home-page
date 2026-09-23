'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

interface ParticlesBackgroundProps {
  count?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export class ParticlesSwarm {
  count: number;
  container: HTMLElement;
  speedMult: number;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
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

  constructor(container: HTMLElement, count = 8000) {
    this.count = count;
    this.container = container;
    this.speedMult = 0.85;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // SETUP
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.008);
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    this.camera.position.set(0, 0, 110);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    // POST PROCESSING - ethereal bloom
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.0, 0.4, 0.85);
    bloomPass.strength = 1.35;
    bloomPass.radius = 0.4;
    bloomPass.threshold = 0.08;
    this.composer.addPass(bloomPass);

    // OBJECTS
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.target = new THREE.Vector3();

    this.geometry = new THREE.TetrahedronGeometry(0.24);
    this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });

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
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime() * this.speedMult;

    const PARAMS: Record<string, number> = { s: 50, v: 0.8, h: 1, r: 0.8, d: 1 };
    const addControl = (id: string, _l: string, _min: number, _max: number, val: number) => {
      return PARAMS[id] !== undefined ? PARAMS[id] : val;
    };

    const s = addControl('s', 'Scale', 20, 90, 50);
    const v = addControl('v', 'Flow Speed', 0, 3, 0.8);
    const h = addControl('h', 'Heat', 0.2, 2, 1.0);
    const r = addControl('r', 'Recovery', 0, 1, 0.8);
    const d = addControl('d', 'Data Flow', 0, 2, 1.0);

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

      target.set(x, y, z);

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

    this.composer.render();
  }

  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResizeBound);
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.mesh);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

export default function ParticlesBackground({
  count = 8000,
  opacity = 0.7,
  className,
  style,
}: ParticlesBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const swarm = new ParticlesSwarm(containerRef.current, count);

    return () => {
      swarm.dispose();
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}
