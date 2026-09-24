'use client';

import React, { useState } from 'react';
import styles from './ParticleController.module.css';
import { Sliders, Copy, Check, X, RotateCcw } from 'lucide-react';
import { ParticleTransformProps } from './ParticlesBackground';

interface ParticleControllerProps {
  values: ParticleTransformProps;
  onChange: (newValues: ParticleTransformProps) => void;
}

export default function ParticleController({ values, onChange }: ParticleControllerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const presets = [
    {
      name: 'User Custom (Saved)',
      vals: { posX: 6, posY: 15, posZ: -31, scale: 1.0, rotX: 115, rotY: 5, rotZ: -40 },
    },
    {
      name: 'Human Right Side',
      vals: { posX: 24, posY: 2, posZ: -20, scale: 0.95, rotX: 0, rotY: 15, rotZ: 0 },
    },
    {
      name: 'Human Left Side',
      vals: { posX: -24, posY: 2, posZ: -20, scale: 0.95, rotX: 0, rotY: -15, rotZ: 0 },
    },
    {
      name: 'High Halo Behind',
      vals: { posX: 0, posY: 16, posZ: -28, scale: 1.15, rotX: 12, rotY: 0, rotZ: 0 },
    },
    {
      name: 'Original Center',
      vals: { posX: 0, posY: 0, posZ: 0, scale: 1.0, rotX: 0, rotY: 0, rotZ: 0 },
    },
  ];

  const handleSlider = (key: keyof ParticleTransformProps, val: number) => {
    onChange({
      ...values,
      [key]: val,
    });
  };

  const copyToClipboard = () => {
    const formatted = JSON.stringify(values, null, 2);
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.tunerWrapper}>
      {/* Floating Toggle Pill Button */}
      <button
        type="button"
        className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Adjust Particle Swarm Position"
      >
        <Sliders size={15} className={styles.sliderIcon} />
        <span className={styles.toggleBtnLabel}>Tune Particles</span>
        <span className={styles.miniCoords}>
          X:{values.posX} Y:{values.posY} Z:{values.posZ}
        </span>
      </button>

      {/* Floating Control HUD Panel */}
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleRow}>
              <Sliders size={16} className={styles.headerIcon} />
              <span className={styles.panelTitle}>Particle Position Tuner</span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close tuner"
            >
              <X size={16} />
            </button>
          </div>

          <p className={styles.instructions}>
            Move the sliders to position particles where you want, then copy values and paste to lock it in.
          </p>

          {/* Quick Presets */}
          <div className={styles.presetsSection}>
            <span className={styles.sectionLabel}>Quick Presets</span>
            <div className={styles.presetButtonsRow}>
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => onChange(p.vals)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders Grid */}
          <div className={styles.controlsList}>
            {/* Position X */}
            <div className={styles.controlRow}>
              <div className={styles.controlLabelRow}>
                <span className={styles.controlName}>Position X (Horizontal)</span>
                <span className={styles.controlVal}>{values.posX}</span>
              </div>
              <input
                type="range"
                min="-80"
                max="80"
                step="1"
                value={values.posX ?? 0}
                onChange={(e) => handleSlider('posX', parseFloat(e.target.value))}
                className={styles.sliderInput}
              />
            </div>

            {/* Position Y */}
            <div className={styles.controlRow}>
              <div className={styles.controlLabelRow}>
                <span className={styles.controlName}>Position Y (Vertical)</span>
                <span className={styles.controlVal}>{values.posY}</span>
              </div>
              <input
                type="range"
                min="-80"
                max="80"
                step="1"
                value={values.posY ?? 2}
                onChange={(e) => handleSlider('posY', parseFloat(e.target.value))}
                className={styles.sliderInput}
              />
            </div>

            {/* Position Z (Depth) */}
            <div className={styles.controlRow}>
              <div className={styles.controlLabelRow}>
                <span className={styles.controlName}>Position Z (Depth / Behind)</span>
                <span className={styles.controlVal}>{values.posZ}</span>
              </div>
              <input
                type="range"
                min="-120"
                max="40"
                step="1"
                value={values.posZ ?? -22}
                onChange={(e) => handleSlider('posZ', parseFloat(e.target.value))}
                className={styles.sliderInput}
              />
            </div>

            {/* Scale */}
            <div className={styles.controlRow}>
              <div className={styles.controlLabelRow}>
                <span className={styles.controlName}>Scale (Size)</span>
                <span className={styles.controlVal}>{values.scale?.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.05"
                value={values.scale ?? 1.0}
                onChange={(e) => handleSlider('scale', parseFloat(e.target.value))}
                className={styles.sliderInput}
              />
            </div>

            {/* Rotation X */}
            <div className={styles.controlRow}>
              <div className={styles.controlLabelRow}>
                <span className={styles.controlName}>Rotation X</span>
                <span className={styles.controlVal}>{values.rotX}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={values.rotX ?? 0}
                onChange={(e) => handleSlider('rotX', parseFloat(e.target.value))}
                className={styles.sliderInput}
              />
            </div>

            {/* Rotation Y */}
            <div className={styles.controlRow}>
              <div className={styles.controlLabelRow}>
                <span className={styles.controlName}>Rotation Y</span>
                <span className={styles.controlVal}>{values.rotY}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={values.rotY ?? 0}
                onChange={(e) => handleSlider('rotY', parseFloat(e.target.value))}
                className={styles.sliderInput}
              />
            </div>

            {/* Rotation Z */}
            <div className={styles.controlRow}>
              <div className={styles.controlLabelRow}>
                <span className={styles.controlName}>Rotation Z</span>
                <span className={styles.controlVal}>{values.rotZ}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={values.rotZ ?? 0}
                onChange={(e) => handleSlider('rotZ', parseFloat(e.target.value))}
                className={styles.sliderInput}
              />
            </div>
          </div>

          {/* Copy Values Section */}
          <div className={styles.copyBox}>
            <pre className={styles.codeSnippet}>
              {`{ posX: ${values.posX}, posY: ${values.posY}, posZ: ${values.posZ}, scale: ${values.scale?.toFixed(2)}, rotX: ${values.rotX}, rotY: ${values.rotY}, rotZ: ${values.rotZ} }`}
            </pre>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}
                onClick={copyToClipboard}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Coordinates'}</span>
              </button>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() =>
                  onChange({
                    posX: 6,
                    posY: 15,
                    posZ: -31,
                    scale: 1.0,
                    rotX: 115,
                    rotY: 5,
                    rotZ: -40,
                  })
                }
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
