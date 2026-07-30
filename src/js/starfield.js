/**
 * Full-page starfield background.
 *
 * Visual approach inspired by publicly documented canvas starfields and
 * personal sites like stormzhang.ai (milky band + twinkle + meteors).
 * Original implementation for this repo — no third-party runtime deps.
 *
 * Requires: <canvas id="starfield" class="starfield"></canvas>
 */
(function () {
  "use strict";

  const canvas = document.getElementById("starfield");
  if (!canvas || !canvas.getContext) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 640px), (pointer: coarse)").matches;
  const ctx = canvas.getContext("2d", { alpha: true });

  let cssW = 0;
  let cssH = 0;
  let stars = [];
  let meteors = [];
  let animId = 0;
  let milkyOffset = 0;
  let running = true;

  // Offscreen milky-way layer (rebuild on resize)
  const milky = document.createElement("canvas");
  const milkyCtx = milky.getContext("2d");
  const milkyPad = 80;
  const tmpA = document.createElement("canvas");
  const ctxA = tmpA.getContext("2d");
  const tmpB = document.createElement("canvas");
  const ctxB = tmpB.getContext("2d");

  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function noise1D(x) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return hash(i) * (1 - u) + hash(i + 1) * u;
  }

  function fbm(x, octaves) {
    let val = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < octaves; o++) {
      val += amp * noise1D(x * freq);
      amp *= 0.5;
      freq *= 2.1;
    }
    return val;
  }

  function milkyPath(t, w, h) {
    const x = -w * 0.1 + w * 1.2 * t;
    const wobble = fbm(t * 8, 4) * h * 0.06 - h * 0.03;
    const curve = Math.sin(t * Math.PI * 1.1) * h * 0.1;
    const y = h * 0.9 + h * -0.95 * t + curve + wobble;
    return [x, y];
  }

  function dot(c, x, y, r, style) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = style;
    c.fill();
  }

  function drawMilkyWay() {
    const w = milky.width;
    const h = milky.height;
    milkyCtx.clearRect(0, 0, w, h);
    tmpA.width = w;
    tmpA.height = h;
    tmpB.width = w;
    tmpB.height = h;
    ctxA.clearRect(0, 0, w, h);
    ctxB.clearRect(0, 0, w, h);

    // Fewer steps on mobile keeps first paint snappy
    const steps = isMobile ? 520 : 1000;

    // Pass A — diffuse nebula
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const [cx, cy] = milkyPath(t, w, h);
      const intensity = Math.pow(Math.sin(t * Math.PI), 0.5);
      const bandW = (160 + intensity * 140) * (0.7 + fbm(t * 5 + 10, 3) * 0.6);

      for (let j = 0; j < (isMobile ? 3 : 5); j++) {
        const ri = i * 40 + j;
        const ang = hash(ri) * Math.PI * 2;
        const dist = Math.pow(hash(ri + 2000), 0.4) * bandW;
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist * 0.45;
        const sz = hash(ri + 4000) * 12 + 6;
        const falloff = 1 - dist / bandW;
        const a = falloff * falloff * 0.04 * intensity;
        const cRoll = hash(ri + 6000);
        let r;
        let g;
        let b;
        if (cRoll < 0.4) {
          r = 80;
          g = 100;
          b = 180;
        } else if (cRoll < 0.7) {
          r = 100;
          g = 80;
          b = 160;
        } else {
          r = 60;
          g = 90;
          b = 150;
        }
        dot(ctxA, px, py, sz, `rgba(${r},${g},${b},${a})`);
      }
    }

    // Pass B — core cloud + temperature
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const [cx, cy] = milkyPath(t, w, h);
      const intensity = Math.pow(Math.sin(t * Math.PI), 0.7);
      const densityNoise = fbm(t * 12, 4);
      const coreW = (70 + intensity * 80) * (0.6 + densityNoise * 0.8);
      const inner = isMobile ? 16 : 28;

      for (let j = 0; j < inner; j++) {
        const ri = i * 120 + j + 20000;
        const ang = hash(ri) * Math.PI * 2;
        const dist = Math.pow(hash(ri + 1000), 0.65) * coreW;
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist * 0.4;
        const distR = dist / coreW;
        const sz = hash(ri + 3000) * 1.8 + 0.2;
        const a =
          Math.pow(1 - distR, 1.2) * 0.12 * intensity * (0.5 + densityNoise * 0.5);
        const temp = hash(ri + 5000);
        let r;
        let g;
        let b;
        if (distR < 0.3) {
          if (temp < 0.3) {
            r = 255;
            g = 240;
            b = 220;
          } else if (temp < 0.6) {
            r = 240;
            g = 220;
            b = 200;
          } else {
            r = 255;
            g = 250;
            b = 245;
          }
        } else if (distR < 0.6) {
          if (temp < 0.4) {
            r = 210;
            g = 220;
            b = 255;
          } else if (temp < 0.7) {
            r = 200;
            g = 200;
            b = 240;
          } else {
            r = 230;
            g = 225;
            b = 250;
          }
        } else if (temp < 0.5) {
          r = 160;
          g = 180;
          b = 240;
        } else {
          r = 140;
          g = 160;
          b = 220;
        }
        dot(ctxB, px, py, sz, `rgba(${r},${g},${b},${a})`);
      }
    }

    // Pass C — bright spine
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const [cx, cy] = milkyPath(t, w, h);
      const intensity = Math.pow(Math.sin(t * Math.PI), 1.5);
      const spineNoise = fbm(t * 15 + 5, 3);
      const spineW = (12 + intensity * 18) * (0.5 + spineNoise * 0.5);

      for (let j = 0; j < (isMobile ? 4 : 8); j++) {
        const ri = i * 50 + j + 60000;
        const ang = hash(ri) * Math.PI * 2;
        const dist = Math.pow(hash(ri + 700), 1.5) * spineW;
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist * 0.35;
        const sz = hash(ri + 800) * 0.9 + 0.2;
        const a =
          Math.pow(1 - dist / spineW, 1.5) * 0.2 * intensity * (0.6 + spineNoise * 0.4);
        dot(ctxB, px, py, sz, `rgba(245,240,255,${a})`);
      }
    }

    // Pass D — dust lanes
    ctxB.globalCompositeOperation = "destination-out";
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const [cx, cy] = milkyPath(t, w, h);
      const intensity = Math.sin(t * Math.PI);
      const dustDensity = fbm(t * 10 + 3.7, 4);
      if (dustDensity > 0.45) {
        const offset = (fbm(t * 20, 3) - 0.5) * 30;
        const sz = (dustDensity - 0.45) * 80 + 3;
        const a = intensity * (dustDensity - 0.45) * 0.8;
        dot(ctxB, cx + offset, cy + offset * 0.3, sz, `rgba(0,0,0,${a})`);
      }
    }
    ctxB.globalCompositeOperation = "source-over";

    // Pass E — embedded bright stars
    const embed = isMobile ? 120 : 280;
    for (let i = 0; i < embed; i++) {
      const t = hash(i + 90000);
      const [cx, cy] = milkyPath(t, w, h);
      const intensity = Math.pow(Math.sin(t * Math.PI), 0.5);
      const spread = (30 + intensity * 40) * (0.5 + hash(i + 91000) * 0.5);
      const ang = hash(i + 92000) * Math.PI * 2;
      const dist = Math.pow(hash(i + 93000), 0.8) * spread;
      const px = cx + Math.cos(ang) * dist;
      const py = cy + Math.sin(ang) * dist * 0.4;
      const sz = hash(i + 94000) * 1.5 + 0.5;
      const a = (1 - dist / spread) * intensity * 0.5;
      dot(ctxB, px, py, sz, `rgba(240,245,255,${a})`);
      if (sz > 1.2) {
        dot(ctxB, px, py, sz * 2.5, `rgba(200,220,255,${a * 0.08})`);
      }
    }

    function blend(src, alpha, blur) {
      milkyCtx.globalAlpha = alpha;
      milkyCtx.filter = `blur(${blur}px)`;
      milkyCtx.drawImage(src, 0, 0);
    }
    blend(tmpA, 0.45, 16);
    blend(tmpA, 0.45, 8);
    blend(tmpB, 0.5, 1.5);
    blend(tmpB, 0.25, 5);
    milkyCtx.filter = "none";
    milkyCtx.globalAlpha = 1;
  }

  function createStars() {
    stars = [];
    const density = isMobile ? 0.00009 : 0.00013;
    const count = Math.floor(cssW * cssH * density);
    for (let i = 0; i < count; i++) {
      const type = Math.random();
      let r;
      let color;
      let twinkleSpeed;
      if (type < 0.58) {
        r = Math.random() * 0.8 + 0.2;
        color = [255, 255, 255];
        twinkleSpeed = Math.random() * 0.008 + 0.002;
      } else if (type < 0.84) {
        r = Math.random() * 1.0 + 0.5;
        color = [180, 220, 255];
        twinkleSpeed = Math.random() * 0.02 + 0.005;
      } else {
        r = Math.random() * 1.2 + 0.8;
        color = [56, 249, 215];
        twinkleSpeed = Math.random() * 0.015 + 0.005;
      }
      stars.push({
        x: Math.random() * cssW,
        y: Math.random() * cssH,
        baseR: r,
        baseOpacity: Math.random() * 0.5 + 0.22,
        color,
        twinkleSpeed,
        twinklePhase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * (isMobile ? 0.25 : 0.55),
        driftY: (Math.random() - 0.5) * (isMobile ? 0.12 : 0.28),
        flashing: false,
        flashTimer: 0,
        flashDuration: 0,
        flashPeak: 0,
        flashScale: 1,
        spikeAngle: Math.random() * Math.PI * 0.5,
      });
    }
  }

  function spawnMeteor() {
    const angle = 25 + Math.random() * 15;
    const rad = (angle * Math.PI) / 180;
    const len = 60 + Math.random() * 180;
    const speed = 5.5 + Math.random() * 9;
    const thickness = 0.4 + Math.random() * 1.1;
    const x = -len;
    const y = Math.random() * cssH * 0.88;
    const travelDist = cssW + len + 200;
    const maxLife = Math.ceil(travelDist / (Math.cos(rad) * speed));
    meteors.push({ x, y, rad, len, speed, thickness, life: 0, maxLife });
  }

  function drawMeteors() {
    // Sparse meteors — decoration budget
    if (!reduceMotion && meteors.length < (isMobile ? 1 : 2) && Math.random() < 0.008) {
      spawnMeteor();
    }
    meteors = meteors.filter((m) => m.life < m.maxLife);
    for (let i = 0; i < meteors.length; i++) {
      const m = meteors[i];
      m.life++;
      m.x += Math.cos(m.rad) * m.speed;
      m.y -= Math.sin(m.rad) * m.speed;

      const fadeIn = Math.min(m.life / 6, 1);
      const fadeOut = Math.max(1 - (m.life - m.maxLife + 12) / 12, 0);
      const opacity = fadeIn * fadeOut;
      const tailX = m.x - Math.cos(m.rad) * m.len;
      const tailY = m.y + Math.sin(m.rad) * m.len;
      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.55, `rgba(180,230,255,${opacity * 0.35})`);
      grad.addColorStop(1, `rgba(255,255,255,${opacity * 0.95})`);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = m.thickness;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  function resize() {
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    milky.width = Math.floor(cssW + milkyPad * 2);
    milky.height = Math.floor(cssH + milkyPad * 2);
    drawMilkyWay();
    createStars();
    meteors = [];
  }

  function drawFrame() {
    ctx.clearRect(0, 0, cssW, cssH);

    if (!reduceMotion) milkyOffset += 0.12;
    const mx = Math.sin(milkyOffset * 0.004) * 50 - milkyPad;
    const my = Math.cos(milkyOffset * 0.003) * 28 - milkyPad;
    ctx.drawImage(milky, mx, my);

    const time = Date.now() * 0.001;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      if (!reduceMotion) {
        s.x += s.driftX;
        s.y += s.driftY;
        if (s.x < -10) s.x = cssW + 10;
        if (s.x > cssW + 10) s.x = -10;
        if (s.y < -10) s.y = cssH + 10;
        if (s.y > cssH + 10) s.y = -10;
      }

      let opacity =
        s.baseOpacity *
        (reduceMotion
          ? 0.75
          : 0.5 + 0.5 * Math.sin(time * s.twinkleSpeed * 60 + s.twinklePhase));
      let r = s.baseR;
      let flash = 0;

      if (!reduceMotion) {
        if (s.flashing) {
          s.flashTimer++;
          const progress = s.flashTimer / s.flashDuration;
          flash = Math.sin(progress * Math.PI) * s.flashPeak;
          opacity = Math.min(1, opacity + flash * 0.8);
          r = s.baseR * (1 + flash * 0.5);
          if (s.flashTimer >= s.flashDuration) s.flashing = false;
        } else if (Math.random() < 0.00045) {
          s.flashing = true;
          s.flashTimer = 0;
          s.flashDuration = 25 + Math.floor(Math.random() * 50);
          s.flashPeak = 0.15 + Math.random() * 0.85;
          s.flashScale = 0.4 + Math.random() * 1.5;
        }
      }

      const c = s.color;
      dot(ctx, s.x, s.y, r, `rgba(${c[0]},${c[1]},${c[2]},${opacity})`);
      if (r > 1.15) {
        dot(ctx, s.x, s.y, r * 3, `rgba(${c[0]},${c[1]},${c[2]},${opacity * 0.08})`);
      }

      // Cross spikes on bright flashes
      if (s.flashing && flash > 0.15) {
        const sc = s.flashScale;
        const spikeLen = r * (3 + flash * 6) * sc;
        const spikeW = r * (0.2 + flash * 0.25) * sc;
        const spikeAlpha = opacity * flash * 0.6;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.spikeAngle);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${spikeAlpha})`;
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.moveTo(0, -spikeW);
          ctx.lineTo(spikeLen, 0);
          ctx.lineTo(0, spikeW);
          ctx.lineTo(-spikeLen, 0);
          ctx.closePath();
          ctx.fill();
          ctx.rotate(Math.PI / 4);
        }
        ctx.restore();

        const glowR = r * (2.5 + flash * 4) * sc;
        const grd = ctx.createRadialGradient(s.x, s.y, r, s.x, s.y, glowR);
        grd.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${flash * 0.15})`);
        grd.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        dot(ctx, s.x, s.y, glowR, grd);
      }
    }

    if (!reduceMotion) drawMeteors();
  }

  function loop() {
    if (!running) return;
    drawFrame();
    animId = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(animId);
    running = true;
    if (reduceMotion) {
      drawFrame();
      return;
    }
    animId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(animId);
  }

  resize();
  start();

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      stop();
      resize();
      start();
    }, 120);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
})();
