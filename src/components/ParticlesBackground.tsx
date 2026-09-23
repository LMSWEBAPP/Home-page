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

    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3();
    const binormal = new THREE.Vector3();

    for (let i = 0; i < this.count; i++) {
      // Advance particle along the open curve
      let u = this.particleU[i] + delta * baseFlowSpeed * this.particleSpeedVar[i];
      if (u >= 1.0) u -= 1.0;
      this.particleU[i] = u;

      // Sample curve position and forward tangent
      const spinePos = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u);

      // Compute orthonormal perpendicular frame
      if (Math.abs(tangent.y) > 0.92) {
        normal.set(1, 0, 0).cross(tangent).normalize();
      } else {
        normal.crossVectors(tangent, up).normalize();
      }
      binormal.crossVectors(tangent, normal).normalize();

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

      const px = spinePos.x + (normal.x * Math.cos(spiralTheta) + binormal.x * Math.sin(spiralTheta)) * r;
      const py = spinePos.y + (normal.y * Math.cos(spiralTheta) + binormal.y * Math.sin(spiralTheta)) * r;
      const pz = spinePos.z + (normal.z * Math.cos(spiralTheta) + binormal.z * Math.sin(spiralTheta)) * r;

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
