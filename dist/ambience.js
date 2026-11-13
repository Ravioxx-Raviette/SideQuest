/*
 * Ambient animation, by theme:
 *   - Dark mode: drifting fireflies + a candlelight glow that follows the mouse.
 *   - Light mode: fluttering butterflies + a trail of twinkling sparkles.
 * Purely decorative: drawn on two fixed canvases with pointer-events: none,
 * hidden from assistive tech, paused in background tabs, and skipped
 * entirely when the visitor prefers reduced motion.
 */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  // Ambient creatures draw on one canvas; the cursor effect gets its own so
  // the night-time candle can use a blend mode (see .candle-canvas).
  function makeLayer(className) {
    const layer = document.createElement("canvas");
    layer.className = className;
    layer.setAttribute("aria-hidden", "true");
    return layer;
  }
  const canvas = makeLayer("ambience-canvas");
  const candleCanvas = makeLayer("candle-canvas");
  const ctx = canvas.getContext("2d");
  const cctx = candleCanvas.getContext("2d");
  if (!ctx || !cctx) return;
  document.body.append(candleCanvas, canvas);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let running = false;
  let frameId = 0;
  let lastTime = 0;

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const isDay = () => document.documentElement.getAttribute("data-theme") !== "dark";

  // Pre-rendered soft glow sprites keep each frame cheap.
  function makeGlow(size, stops) {
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = size;
    const g = sprite.getContext("2d");
    const half = size / 2;
    const gradient = g.createRadialGradient(half, half, 0, half, half, half);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    g.fillStyle = gradient;
    g.fillRect(0, 0, size, size);
    return sprite;
  }
  const fireflySprite = makeGlow(64, [
    [0, "rgba(255, 252, 214, 1)"],
    [0.08, "rgba(246, 240, 140, 0.95)"],
    [0.22, "rgba(214, 226, 90, 0.45)"],
    [0.5, "rgba(190, 210, 70, 0.12)"],
    [1, "rgba(190, 210, 70, 0)"],
  ]);
  const candleSprite = makeGlow(256, [
    [0, "rgba(255, 214, 140, 0.8)"],
    [0.12, "rgba(255, 180, 90, 0.5)"],
    [0.4, "rgba(255, 140, 50, 0.2)"],
    [1, "rgba(255, 130, 40, 0)"],
  ]);
  const emberSprite = makeGlow(32, [
    [0, "rgba(255, 244, 200, 1)"],
    [0.25, "rgba(255, 190, 90, 0.8)"],
    [1, "rgba(255, 120, 40, 0)"],
  ]);

  function drawSprite(sprite, x, y, size, alpha, context = ctx) {
    if (alpha <= 0.002) return;
    context.globalAlpha = Math.min(1, alpha);
    context.drawImage(sprite, x - size / 2, y - size / 2, size, size);
  }

  function wrap(item, margin) {
    if (item.x < -margin) item.x = width + margin;
    if (item.x > width + margin) item.x = -margin;
    if (item.y < -margin) item.y = height + margin;
    if (item.y > height + margin) item.y = -margin;
  }

  // Gently steer anything away from the cursor.
  function avoidPointer(item, radius, strength) {
    if (!pointer.active) return [0, 0];
    const dx = item.x - pointer.x;
    const dy = item.y - pointer.y;
    const distSq = dx * dx + dy * dy;
    if (distSq >= radius * radius || distSq < 1) return [0, 0];
    const dist = Math.sqrt(distSq);
    const push = (1 - dist / radius) * strength;
    return [(dx / dist) * push, (dy / dist) * push];
  }

  // ---------- Fireflies (dark mode) ----------
  const fireflies = [];
  function spawnFirefly() {
    return {
      x: rand(0, width),
      y: rand(0, height),
      angle: rand(0, Math.PI * 2),
      speed: rand(10, 26), // px per second
      turn: rand(0.4, 1.1),
      phase: rand(0, Math.PI * 2),
      blink: rand(0.6, 1.4),
      size: rand(22, 40),
    };
  }
  function drawFireflies(t, dt) {
    ctx.globalCompositeOperation = "lighter";
    for (const f of fireflies) {
      f.angle += Math.sin(t * f.turn + f.phase) * 0.9 * dt;
      const [ax, ay] = avoidPointer(f, 140, 60);
      f.x += (Math.cos(f.angle) * f.speed + ax) * dt;
      f.y += (Math.sin(f.angle) * f.speed + ay) * dt;
      wrap(f, 40);
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(t * f.blink * 2 + f.phase), 3);
      drawSprite(fireflySprite, f.x, f.y, f.size * (0.8 + pulse * 0.45), 0.18 + pulse * 0.82);
    }
  }

  // ---------- Butterflies (light mode) ----------
  // Small, simple silhouettes in one solid dusty plum: it sits opposite the
  // warm cream on the color wheel, so it stands out without fighting the
  // terracotta and sage.
  const BUTTERFLY_COLOR = "#5e4a73";
  const butterflies = [];
  // Butterflies keep to the sides so they don't sit over the content in the
  // middle of the screen: they spawn in the outer bands, are nudged back out
  // of the central zone, and fade while passing through it.
  const CENTER_HALF = 0.2; // central zone = middle 40% of the width
  function centerness(x) {
    const offset = Math.abs(x - width / 2) / (width * CENTER_HALF);
    return Math.max(0, 1 - offset); // 1 at the very middle, 0 outside the zone
  }
  function spawnButterfly() {
    const left = Math.random() < 0.5;
    return {
      x: left ? rand(0, width * 0.28) : rand(width * 0.72, width),
      y: rand(0, height),
      angle: rand(0, Math.PI * 2),
      // Same drift as the fireflies, so they spread across the page the same way.
      speed: rand(10, 26), // px per second
      turn: rand(0.4, 1.1),
      phase: rand(0, Math.PI * 2),
      flap: rand(9, 14), // wing beats, radians per second
      bob: rand(0, Math.PI * 2),
      size: rand(4.5, 7),
    };
  }
  function drawButterfly(b, t) {
    const s = b.size;
    // Wings open and close; the |cos| keeps a quick snap at the top of a beat.
    const open = 0.25 + 0.75 * Math.abs(Math.cos(t * b.flap + b.phase));
    ctx.save();
    ctx.translate(b.x, b.y + Math.sin(t * 3 + b.bob) * 2);
    ctx.rotate(b.angle + Math.PI / 2);
    ctx.fillStyle = BUTTERFLY_COLOR;
    // Each oval is filled on its own so the canvas never joins them with lines.
    const oval = (x, y, rx, ry, tilt) => {
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(0.1, rx), ry, tilt, 0, Math.PI * 2);
      ctx.fill();
    };
    for (const side of [-1, 1]) {
      // Two plain oval wings per side: a bigger upper one and a smaller lower one.
      oval(side * open * 0.62 * s, -0.42 * s, open * 0.62 * s, 0.5 * s, side * 0.5);
      oval(side * open * 0.45 * s, 0.38 * s, open * 0.42 * s, 0.34 * s, side * -0.45);
    }
    // Slim body
    oval(0, 0, 0.12 * s, 0.6 * s, 0);
    ctx.restore();
  }
  function drawButterflies(t, dt) {
    ctx.globalCompositeOperation = "source-over";
    for (const b of butterflies) {
      // Steered like the fireflies, plus a push back toward the nearer side.
      b.angle += Math.sin(t * b.turn + b.phase) * 0.9 * dt;
      const [ax, ay] = avoidPointer(b, 140, 60);
      const middle = centerness(b.x);
      const outward = (b.x < width / 2 ? -1 : 1) * middle * 45;
      b.x += (Math.cos(b.angle) * b.speed + ax + outward) * dt;
      b.y += (Math.sin(b.angle) * b.speed + ay) * dt;
      wrap(b, 40);
      ctx.globalAlpha = 0.85 * (1 - 0.7 * centerness(b.x));
      drawButterfly(b, t);
    }
  }

  function populate() {
    const area = width * height;
    // Butterflies use the fireflies' count so both themes are equally populated.
    const fireflyCount = Math.round(Math.min(34, Math.max(10, area / 48000)));
    const butterflyCount = fireflyCount;
    while (fireflies.length < fireflyCount) fireflies.push(spawnFirefly());
    fireflies.length = fireflyCount;
    while (butterflies.length < butterflyCount) butterflies.push(spawnButterfly());
    butterflies.length = butterflyCount;
  }

  // ---------- Cursor: candle (dark) / sparkle trail (light) ----------
  const pointer = { x: 0, y: 0, active: false };
  const candle = { x: 0, y: 0, strength: 0 };
  const trail = [];
  const embers = [];
  const sparkles = [];
  const SPARKLE_COLORS = ["#d9a640", "#e0806a", "#9a7bb8", "#7c9b4c", "#e8b84f"];
  let lastSpawn = { x: 0, y: 0 };
  let hoveringControl = false;

  function onPointerMove(event) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    if (!pointer.active) {
      candle.x = lastSpawn.x = event.clientX;
      candle.y = lastSpawn.y = event.clientY;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    hoveringControl = !!(event.target instanceof Element && event.target.closest("a, button, summary, label, select, input"));

    const dx = pointer.x - lastSpawn.x;
    const dy = pointer.y - lastSpawn.y;
    const distSq = dx * dx + dy * dy;
    if (isDay()) {
      if (distSq > 90 && sparkles.length < 90) {
        lastSpawn = { x: pointer.x, y: pointer.y };
        const count = distSq > 900 ? 2 : 1;
        for (let i = 0; i < count; i += 1) {
          sparkles.push({
            x: pointer.x + rand(-6, 6),
            y: pointer.y + rand(-6, 6),
            vx: rand(-18, 18),
            vy: rand(-8, 26), // drift down like falling glitter
            life: 0,
            maxLife: rand(0.5, 0.95),
            size: rand(5, 10),
            rot: rand(0, Math.PI),
            spin: rand(-3, 3),
            color: pick(SPARKLE_COLORS),
            dot: Math.random() < 0.3, // some are round glitter specks
          });
        }
      }
    } else if (distSq > 260 && embers.length < 70) {
      lastSpawn = { x: pointer.x, y: pointer.y };
      embers.push({
        x: pointer.x + rand(-4, 4),
        y: pointer.y + rand(-4, 4),
        vx: rand(-14, 14),
        vy: rand(-38, -16),
        life: 0,
        maxLife: rand(0.55, 1.1),
        size: rand(5, 10),
      });
    }
  }

  function onPointerLeave() {
    pointer.active = false;
  }

  function drawCandle(t, dt) {
    cctx.globalCompositeOperation = "lighter";
    const targetStrength = pointer.active ? (hoveringControl ? 1.15 : 1) : 0;
    candle.strength += (targetStrength - candle.strength) * Math.min(1, dt * 6);
    candle.x += (pointer.x - candle.x) * Math.min(1, dt * 11);
    candle.y += (pointer.y - candle.y) * Math.min(1, dt * 11);
    trail.unshift({ x: candle.x, y: candle.y });
    if (trail.length > 16) trail.length = 16;

    if (candle.strength > 0.01) {
      const flicker = 1 + Math.sin(t * 13) * 0.035 + Math.sin(t * 7.3 + 1.7) * 0.03 + Math.sin(t * 23.1) * 0.015;
      for (let i = trail.length - 1; i > 0; i -= 1) {
        const fade = 1 - i / trail.length;
        drawSprite(emberSprite, trail[i].x, trail[i].y, 22 * fade + 4, 0.12 * fade * candle.strength, cctx);
      }
      // One wide, soft halo with no bright core over the text.
      drawSprite(candleSprite, candle.x, candle.y, 300 * flicker, 0.38 * candle.strength * flicker, cctx);
    }

    for (let i = embers.length - 1; i >= 0; i -= 1) {
      const e = embers[i];
      e.life += dt;
      if (e.life >= e.maxLife) {
        embers.splice(i, 1);
        continue;
      }
      e.vx += Math.sin(t * 9 + i) * 20 * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      const k = 1 - e.life / e.maxLife;
      drawSprite(emberSprite, e.x, e.y, e.size * (0.4 + k * 0.5), k * 0.55, cctx);
    }
  }

  function starPath(context, r) {
    // Four-pointed twinkle star with slim, curved-in arms.
    const inner = r * 0.26;
    context.beginPath();
    for (let i = 0; i < 4; i += 1) {
      const a = (i * Math.PI) / 2;
      const b = a + Math.PI / 4;
      context.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      context.lineTo(Math.cos(b) * inner, Math.sin(b) * inner);
    }
    context.closePath();
  }

  function drawSparkles(dt) {
    cctx.globalCompositeOperation = "source-over";
    candle.strength = 0;
    for (let i = sparkles.length - 1; i >= 0; i -= 1) {
      const p = sparkles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        sparkles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 2;
      p.rot += p.spin * dt;
      const k = p.life / p.maxLife;
      // Pop in quickly, then shrink and fade.
      const scale = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      cctx.globalAlpha = Math.min(1, 1.15 - k);
      cctx.fillStyle = p.color;
      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot);
      if (p.dot) {
        cctx.beginPath();
        cctx.arc(0, 0, p.size * 0.32 * scale, 0, Math.PI * 2);
        cctx.fill();
      } else {
        starPath(cctx, p.size * scale);
        cctx.fill();
      }
      cctx.restore();
    }
  }

  // ---------- Loop ----------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    for (const [layer, context] of [[canvas, ctx], [candleCanvas, cctx]]) {
      layer.width = Math.round(width * dpr);
      layer.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    populate();
  }

  function frame(time) {
    const dt = Math.min(0.05, (time - lastTime) / 1000 || 0.016);
    lastTime = time;
    const t = time / 1000;
    ctx.clearRect(0, 0, width, height);
    cctx.clearRect(0, 0, width, height);

    if (isDay()) {
      embers.length = 0;
      drawButterflies(t, dt);
      drawSparkles(dt);
    } else {
      sparkles.length = 0;
      drawFireflies(t, dt);
      drawCandle(t, dt);
    }

    for (const context of [ctx, cctx]) {
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    }
    frameId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reducedMotion.matches || document.hidden) return;
    running = true;
    lastTime = performance.now();
    frameId = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(frameId);
    ctx.clearRect(0, 0, width, height);
    cctx.clearRect(0, 0, width, height);
  }

  function syncMotionPreference() {
    if (reducedMotion.matches) stop();
    else start();
  }

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  reducedMotion.addEventListener?.("change", syncMotionPreference);
  if (finePointer.matches) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
  }
  start();
})();
