'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './InteractiveDemo.module.css';
import { Send, Sparkles, Volume2, RotateCcw, Copy, Check, Terminal, BookOpen, Lightbulb, Compass } from 'lucide-react';

interface PromptPreset {
  id: string;
  category: string;
  question: string;
  badge: string;
  response: {
    tutorThought: string;
    headline: string;
    points: string[];
    codeOrFormula?: string;
    intuition: string;
  };
}

export default function InteractiveDemo() {
  const presets: PromptPreset[] = [
    {
      id: 'quantum',
      category: 'Quantum Physics',
      question: 'Explain Quantum Superposition with an intuitive real-world analogy.',
      badge: 'Physics',
      response: {
        tutorThought: 'Analyzing mental models... Selecting dynamic spinning coin analogy for intuitive conceptual anchoring.',
        headline: 'Think of a Spinning Coin on a Table',
        points: [
          'When a coin sits flat on a table, it is in a definite state: strictly Heads or Tails (a classical bit: 0 or 1).',
          'While spinning rapidly, it is neither purely Heads nor purely Tails—it is an active blur containing probabilities of both states at once.',
          'Superposition is this spinning state. Only when you slap your hand down to measure it does it collapse into one definite reality.'
        ],
        codeOrFormula: '|Ψ⟩ = α|0⟩ + β|1⟩  where  |α|² + |β|² = 1',
        intuition: 'Vedika Key Takeaway: Particles don’t have hidden "secret answers" before observation; reality itself holds multiple potential outcomes simultaneously.'
      }
    },
    {
      id: 'calculus',
      category: 'Calculus & ML',
      question: 'Why does the chain rule matter in neural network backpropagation?',
      badge: 'Mathematics',
      response: {
        tutorThought: 'Connecting composite derivatives to gradient attribution across deep multi-layer tensors.',
        headline: 'Gradients Flowing Backwards through Linked Levers',
        points: [
          'A neural network is essentially a nested chain of functions: y = f(g(h(x))).',
          'To know how a tiny twitch in early weights influences final loss, we multiply local sensitivities at each layer.',
          'The Chain Rule is the mathematical gearbox that converts high-level prediction error into precise millimeter adjustments for billions of parameters.'
        ],
        codeOrFormula: '∂L/∂w₁ = (∂L/∂y) × (∂y/∂h) × (∂h/∂w₁)',
        intuition: 'Vedika Key Takeaway: Without the chain rule, deep learning would be blind guesswork. It gives every hidden neuron its precise credit for the error.'
      }
    },
    {
      id: 'cs-algo',
      category: 'Algorithms',
      question: 'Why does Binary Search require O(log N) instead of O(N)?',
      badge: 'Computer Science',
      response: {
        tutorThought: 'Evaluating logarithmic halving mechanics via phonebook search metaphor.',
        headline: 'The Power of Discarding 50% of the Universe per Step',
        points: [
          'In a sorted list of 1,000,000 items, sequential search might inspect all 1,000,000 one by one.',
          'Binary search tests the middle item. In a single step, 500,000 items are permanently eliminated.',
          'After just 20 comparisons (2²⁰ ≈ 1,048,576), you have isolated any single element among a million.'
        ],
        codeOrFormula: 'low, high = 0, len(arr) - 1\nwhile low <= high:\n    mid = (low + high) // 2\n    if arr[mid] == target: return mid\n    elif arr[mid] < target: low = mid + 1\n    else: high = mid - 1',
        intuition: 'Vedika Key Takeaway: Logarithmic time means doubling your input data only adds a single extra question to the search.'
      }
    },
    {
      id: 'socratic',
      category: 'Socratic Dialogue',
      question: 'Can you challenge my understanding of why heavy objects fall at the same speed as light ones?',
      badge: 'Intuition Challenge',
      response: {
        tutorThought: 'Initiating Galileo Thought Experiment: tethering two masses to test for paradoxes.',
        headline: 'The Galileo Thought Experiment Paradox',
        points: [
          'Suppose heavier objects fell faster. If you tie an 8kg stone to a 2kg stone with a rope, what happens?',
          'Prediction A: The 2kg stone acts like a parachute, slowing the 8kg stone down (speed < 8kg alone).',
          'Prediction B: Together they weigh 10kg, so the combined object must fall faster than the 8kg stone alone (speed > 8kg alone).',
          'Contradiction! Both cannot be true. Therefore, acceleration under gravity must be completely independent of mass: a = F/m = (G*M*m/r²)/m = G*M/r².'
        ],
        codeOrFormula: 'a = F_gravity / m_object = (G × M_Earth) / r²',
        intuition: 'Vedika Socratic Prompt: Did you notice how mass cancels out completely in the formula? The heavier object is pulled harder, but has precisely that much more inertia resisting motion!'
      }
    }
  ];

  const [activePreset, setActivePreset] = useState<PromptPreset>(presets[0]);
  const [customInput, setCustomInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${activePreset.response.headline}\n\n${activePreset.response.points.join('\n')}\n\n${activePreset.response.codeOrFormula || ''}`
    );
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    // Switch to a dynamic response for customized prompt
    setActivePreset({
      id: 'custom-' + Date.now(),
      category: 'Live Query',
      question: customInput,
      badge: 'Custom Inquiry',
      response: {
        tutorThought: `Synthesizing conceptual model for: "${customInput.slice(0, 45)}..." with multi-tier pedagogical scaffolding.`,
        headline: `Understanding: ${customInput}`,
        points: [
          'Vedika breaks this question into three fundamental primitives: first principles, mathematical foundations, and intuitive real-world mechanisms.',
          'By analyzing how this connects to your existing knowledge graph, we isolate the exact conceptual bridge needed for instant clarity.',
          'Practice challenge: Can you explain this concept back to me in your own words to verify zero retention loss?'
        ],
        codeOrFormula: '// Vedika Active Socratic Loop:\ncomprehension_score = evaluate_feynman_response(user_input);\nadapt_difficulty_vector(comprehension_score);',
        intuition: 'Vedika Adaptive Insight: Active synthesis is 4x more effective than passive reading. Every inquiry refines your learning roadmap.'
      }
    });
    setCustomInput('');
  };

  const toggleVoice = () => {
    setVoicePlaying(!voicePlaying);
    if (!voicePlaying) {
      setTimeout(() => setVoicePlaying(false), 4000);
    }
  };

  return (
    <section id="demo" className={styles.demoSection}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <div className={styles.tag}>
            <Sparkles size={14} />
            <span>INTERACTIVE SIMULATION</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Experience <span className={styles.glowText}>Vedika’s</span> Neural Dialogue
          </h2>
          <p className={styles.sectionSubtitle}>
            Select a complex challenge below or test your own question. Watch how Vedika constructs
            intuitive first-principles explanations in milliseconds.
          </p>
        </div>

        {/* Preset Prompt Selector Chips */}
        <div className={styles.promptChips}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset)}
              className={`${styles.chip} ${activePreset.id === preset.id ? styles.activeChip : ''}`}
            >
              <span className={styles.chipBadge}>{preset.badge}</span>
              <span className={styles.chipText}>{preset.category}</span>
            </button>
          ))}
        </div>

        {/* Interactive Chat Console Window */}
        <div className={styles.consoleWindow}>
          {/* Top Window Bar */}
          <div className={styles.windowHeader}>
            <div className={styles.windowDots}>
              <span className={`${styles.dot} ${styles.dotRed}`}></span>
              <span className={`${styles.dot} ${styles.dotYellow}`}></span>
              <span className={`${styles.dot} ${styles.dotGreen}`}></span>
            </div>
            <div className={styles.windowTitle}>
              <Terminal size={14} className={styles.terminalIcon} />
              <span>vedika-cognitive-kernel // active-session</span>
            </div>
            <div className={styles.windowControls}>
              <button
                className={`${styles.voiceBtn} ${voicePlaying ? styles.voiceActive : ''}`}
                onClick={toggleVoice}
                title="Synthesize Voice Explanation"
              >
                <Volume2 size={15} />
                <span>{voicePlaying ? 'Streaming Voice...' : 'Listen Audio'}</span>
                {voicePlaying && <span className={styles.audioWave}></span>}
              </button>
              <button className={styles.iconBtn} onClick={handleCopy} title="Copy explanation">
                {isCopied ? <Check size={15} className={styles.checkIcon} /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* Console Body */}
          <div className={styles.consoleBody}>
            {/* User Inquiry Bubble */}
            <div className={styles.userMessage}>
              <div className={styles.userAvatar}>You</div>
              <div className={styles.userBubble}>
                <p>{activePreset.question}</p>
              </div>
            </div>

            {/* Vedika Response Container */}
            <div className={styles.tutorMessage}>
              <div className={styles.tutorAvatar}>
                <Image
                  src="/vedika-bot.png"
                  alt="Vedika Avatar"
                  width={40}
                  height={50}
                  className={styles.miniBotImg}
                />
              </div>

              <div className={styles.tutorBubble}>
                {/* Real-time internal reasoning trace */}
                <div className={styles.reasoningTrace}>
                  <Sparkles size={13} className={styles.traceSparkle} />
                  <span>{activePreset.response.tutorThought}</span>
                </div>

                {/* Main Headline */}
                <h4 className={styles.responseHeadline}>{activePreset.response.headline}</h4>

                {/* Explanation Bullet Points */}
                <ul className={styles.pointList}>
                  {activePreset.response.points.map((pt, idx) => (
                    <li key={idx} className={styles.pointItem}>
                      <span className={styles.bulletIdx}>{idx + 1}</span>
                      <p>{pt}</p>
                    </li>
                  ))}
                </ul>

                {/* Code or Formula Snippet */}
                {activePreset.response.codeOrFormula && (
                  <div className={styles.codeBox}>
                    <div className={styles.codeHeader}>
                      <span>Core Formulation & Syntax</span>
                    </div>
                    <pre className={styles.codeContent}>
                      <code>{activePreset.response.codeOrFormula}</code>
                    </pre>
                  </div>
                )}

                {/* Intuitive Takeaway Card */}
                <div className={styles.intuitionCard}>
                  <Lightbulb size={18} className={styles.lightbulbIcon} />
                  <p>{activePreset.response.intuition}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Input Bar */}
          <form className={styles.inputArea} onSubmit={handleCustomSubmit}>
            <input
              type="text"
              placeholder="Ask Vedika anything (e.g. How does backprop work? Teach me Fourier transforms...)"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className={styles.promptInput}
            />
            <button
              type="submit"
              className={styles.sendButton}
              aria-label="Send query to Vedika"
            >
              <span>Ask Tutor</span>
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
