// ─── Effects System — Imperative Particles & Floats ──────────────
// Runs outside React state — directly manipulates the DOM via
// requestAnimationFrame for zero React render overhead.

const ACCENT = "#a78bfa";

// Track a container div that effects will be attached to
let effectsContainer: HTMLElement | null = null;

export function setEffectsContainer(el: HTMLElement | null) {
  effectsContainer = el;
}

// ─── Floating texts ──────────────────────────────────────────────

export function spawnFloat(
  text: string,
  color: string = ACCENT,
  x: number = 40 + Math.random() * 20,
  y: number = 30 + Math.random() * 10
) {
  if (!effectsContainer) return;
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = `
    position: absolute; left: ${x}%; top: ${y}%;
    font-size: 11px; font-weight: bold; pointer-events: none;
    color: ${color}; text-shadow: 0 0 12px rgba(0,0,0,0.9);
    z-index: 50; white-space: nowrap;
  `;
  effectsContainer.appendChild(el);

  // Animate upward and fade
  const startY = y;
  const startTime = performance.now();
  const duration = 1200;

  const frame = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    const easeOut = 1 - Math.pow(1 - t, 3);
    el.style.top = `${startY - easeOut * 25}%`;
    el.style.opacity = String(1 - t);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.remove();
    }
  }
  requestAnimationFrame(frame);
}

// ─── Tap particles ───────────────────────────────────────────────

let particleQueue: (() => void)[] = [];

export function flushParticleQueue() {
  const q = particleQueue;
  particleQueue = [];
  for (const fn of q) fn();
}

export function spawnParticles(count: number, clientX: number, clientY: number, now: number) {
  if (!effectsContainer) return;
  const baseX = (clientX / window.innerWidth) * 100;
  const baseY = (clientY / window.innerHeight) * 100;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = 15 + Math.random() * 25;
    const cx = baseX + Math.cos(angle) * 4;
    const cy = baseY + Math.sin(angle) * 4;

    const el = document.createElement("span");
    el.style.cssText = `
      position: absolute; width: 4px; height: 4px; border-radius: 50%;
      background: ${ACCENT}; pointer-events: none;
      left: ${cx}%; top: ${cy}%;
      transform: translate(-50%, -50%);
      opacity: 0.7;
    `;
    effectsContainer.appendChild(el);

    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const startTime = performance.now();
    const duration = 500 + Math.random() * 100;

    const frame = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - t, 2);
      el.style.transform = `translate(calc(${dx * easeOut}px - 50%), calc(${dy * easeOut}px - 50%))`;
      el.style.opacity = String(0.7 * (1 - t));
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.remove();
      }
    }
    requestAnimationFrame(frame);
  }
}

// ─── Tap ripple ──────────────────────────────────────────────────

export function spawnRipple(clientX: number, clientY: number) {
  if (!effectsContainer) return;
  const x = (clientX / window.innerWidth) * 100;
  const y = (clientY / window.innerHeight) * 100;
  const el = document.createElement("span");
  el.style.cssText = `
    position: absolute; border-radius: 50%;
    border: 1px solid rgba(167,139,250,0.4);
    pointer-events: none;
    left: ${x}%; top: ${y}%;
    width: 4px; height: 4px;
    transform: translate(-50%, -50%);
  `;
  effectsContainer.appendChild(el);

  const startTime = performance.now();
  const duration = 600;

  const frame = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    const size = 4 + t * 116;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.opacity = String(0.6 * (1 - t));
    el.style.transform = `translate(calc(-50% - ${size / 2}px), calc(-50% - ${size / 2}px))`;
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.remove();
    }
  }
  requestAnimationFrame(frame);
}
