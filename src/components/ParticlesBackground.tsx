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
  geometry: THREE.TetrahedronGeometry;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.InstancedMesh;
  clock: THREE.Clock;
  animationFrameId: number | null = null;
  onResizeBound: () => void;

  // Broken open spiral curve
  curve: THREE.CatmullRomCurve3;
  LUT_SAMPLES = 1000;
  lutPos: Float32Array;
  lutTan: Float32Array;

  // Reusable vectors (zero-allocation per frame)
  spinePos = new THREE.Vector3();
  tangent = new THREE.Vector3();
  up = new THREE.Vector3(0, 1, 0);
  normal = new THREE.Vector3();
  binormal = new THREE.Vector3();

  particleU: Float32Array;
  particleLane: Uint8Array;
  particleRadiusVar: Float32Array;
  particleSpeedVar: Float32Array;

  constructor(canvas: HTMLCanvasElement, count = 7500) {
    this.count = count;
    this.canvas = canvas;
    this.speedMult = 0.95;

    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight;

    // SCENE & CAMERA - 100% transparent background
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    this.camera.position.set(0, 0, 110);

    // RENDERER - Pure alpha, zero black box
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);

    // OPEN 3D SPIRAL CURVE
    // Originates from the faded edge of Earth, spirals in 3D around the mascot, and exits the viewport
    this.curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(36, -28, -10),  // 0: Starts at the faded atmospheric edge of Earth
      new THREE.Vector3(26, -18, -18),  // 1: Ascends from Earth atmosphere into space
      new THREE.Vector3(-14, -8, -26),  // 2: Sweeping behind mascot waist
      new THREE.Vector3(-28, 8, -16),   // 3: Spiraling up the left flank
      new THREE.Vector3(2, 24, -24),    // 4: Cresting behind mascot head
      new THREE.Vector3(28, 20, -14),   // 5: Upper S-curve spiral loop
      new THREE.Vector3(-28, 34, 0),    // 6: Flowing outward across the scene
      new THREE.Vector3(-95, 48, 18),   // 7: Soaring out of the viewport on the other side!
    ]);
    this.curve.curveType = 'catmullrom';
    this.curve.tension = 0.5;

    // Pre-sample curve into high-precision lookup table for 100% stability and zero allocation
    this.lutPos = new Float32Array(this.LUT_SAMPLES * 3);
    this.lutTan = new Float32Array(this.LUT_SAMPLES * 3);

    for (let s = 0; s < this.LUT_SAMPLES; s++) {
      const uSample = Math.min(0.9999, Math.max(0, s / (this.LUT_SAMPLES - 1)));
      const p = this.curve.getPointAt(uSample);
      const t = this.curve.getTangentAt(uSample);
      this.lutPos[s * 3 + 0] = p.x;
      this.lutPos[s * 3 + 1] = p.y;
      this.lutPos[s * 3 + 2] = p.z;
      this.lutTan[s * 3 + 0] = t.x;
      this.lutTan[s * 3 + 1] = t.y;
      this.lutTan[s * 3 + 2] = t.z;
    }

    // PARTICLES with Additive Blending for celestial luminous bloom
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();

    this.geometry = new THREE.TetrahedronGeometry(0.34);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.mesh);

    // Particle distribution along the curve
    this.particleU = new Float32Array(this.count);
    this.particleLane = new Uint8Array(this.count);
    this.particleRadiusVar = new Float32Array(this.count);
    this.particleSpeedVar = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      this.particleU[i] = (i / this.count) + (Math.random() - 0.5) * (1 / this.count);
      this.particleLane[i] = i % 8;
      this.particleRadiusVar[i] = 0.75 + Math.random() * 0.5;
      this.particleSpeedVar[i] = 0.88 + Math.random() * 0.24;
      this.mesh.setColorAt(i, this.color.setHex(0x38bdf8));
    }

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.onResizeBound = this.onResize.bind(this);
    window.addEventListener('resize', this.onResizeBound);

    this.animate();
  }

  sampleCurve(u: number) {
    const clampedU = Math.max(0, Math.min(0.99999, u));
    const f = clampedU * (this.LUT_SAMPLES - 1);
    const idx = Math.floor(f);
    const frac = f - idx;
    const idx2 = Math.min(this.LUT_SAMPLES - 1, idx + 1);

    const i1 = idx * 3;
    const i2 = idx2 * 3;

    this.spinePos.x = this.lutPos[i1 + 0] + (this.lutPos[i2 + 0] - this.lutPos[i1 + 0]) * frac;
    this.spinePos.y = this.lutPos[i1 + 1] + (this.lutPos[i2 + 1] - this.lutPos[i1 + 1]) * frac;
    this.spinePos.z = this.lutPos[i1 + 2] + (this.lutPos[i2 + 2] - this.lutPos[i1 + 2]) * frac;

    this.tangent.x = this.lutTan[i1 + 0] + (this.lutTan[i2 + 0] - this.lutTan[i1 + 0]) * frac;
    this.tangent.y = this.lutTan[i1 + 1] + (this.lutTan[i2 + 1] - this.lutTan[i1 + 1]) * frac;
    this.tangent.z = this.lutTan[i1 + 2] + (this.lutTan[i2 + 2] - this.lutTan[i1 + 2]) * frac;
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
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.getElapsedTime();
    const baseFlowSpeed = 0.085 * this.speedMult;

    for (let i = 0; i < this.count; i++) {
      // Advance particle along the open curve
      let u = this.particleU[i] + delta * baseFlowSpeed * this.particleSpeedVar[i];
      if (u >= 1.0) u -= 1.0;
      if (u < 0) u = 0;
      this.particleU[i] = u;

      // Sample precomputed curve LUT - 100% crash-proof & zero garbage allocation
      this.sampleCurve(u);

      // Compute orthonormal perpendicular frame
      if (Math.abs(this.tangent.y) > 0.92) {
        this.normal.set(1, 0, 0).cross(this.tangent).normalize();
      } else {
        this.normal.crossVectors(this.tangent, this.up).normalize();
      }
      this.binormal.crossVectors(this.tangent, this.normal).normalize();

      // Smooth taper: emerge from Earth's fade at u=0, exit viewport smoothly at u=1
      let taper = 1.0;
      if (u < 0.12) {
        taper = u / 0.12; // Fade in from Earth atmosphere
      } else if (u > 0.84) {
        taper = Math.max(0, (1.0 - u) / 0.16); // Fade out as it exits the viewport
      }

      // Spiral twist along the stream + rotation over time
      const lane = this.particleLane[i];
      const strandAngle = lane * (Math.PI * 2 / 8);
      const spiralTheta = strandAngle + u * Math.PI * 14.0 + time * 1.6;

      const baseR = 3.6 * this.particleRadiusVar[i];
      const wave = Math.sin(u * 12.0 + lane + time * 2.0) * 0.4;
      const r = (baseR + wave) * Math.max(0.04, taper);

      const px = this.spinePos.x + (this.normal.x * Math.cos(spiralTheta) + this.binormal.x * Math.sin(spiralTheta)) * r;
      const py = this.spinePos.y + (this.normal.y * Math.cos(spiralTheta) + this.binormal.y * Math.sin(spiralTheta)) * r;
      const pz = this.spinePos.z + (this.normal.z * Math.cos(spiralTheta) + this.binormal.z * Math.sin(spiralTheta)) * r;

      this.dummy.position.set(px, py, pz);

      // Scale particle based on taper
      const scale = 0.32 * Math.max(0.01, taper);
      this.dummy.scale.set(scale, scale, scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);

      // Color: Electric Cyan / Sky Blue and Royal Amethyst / Magenta with luminance scaling
      const isDataLane = lane % 2 === 0;
      let hue: number;
      let sat: number;
      let light: number;

      if (isDataLane) {
        hue = 0.54 + 0.04 * Math.sin(u * 6.0); // Electric Cyan to Sky Blue
        sat = 0.95;
        light = 0.58 * taper;
      } else {
        hue = 0.75 + 0.06 * Math.cos(u * 5.0); // Amethyst Purple to Magenta
        sat = 0.92;
        light = 0.50 * taper;
      }

      this.color.setHSL(hue, sat, Math.max(0, Math.min(1, light)));
      this.mesh.setColorAt(i, this.color);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }

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
  opacity = 0.9,
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
