/**
 * Ambient solar-system decoration (canvas) + Earth easter egg.
 * Click Earth → open #earth-egg dialog (contact / intro from site.yaml).
 *
 * Requires: <canvas id="solar-system"> and optional <dialog id="earth-egg">
 */
(function () {
  "use strict";

  const canvas = document.getElementById("solar-system");
  if (!canvas || !canvas.getContext) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prefersCoarse = window.matchMedia("(pointer: coarse)").matches;
  const ctx = canvas.getContext("2d", { alpha: true });
  const eggDialog = document.getElementById("earth-egg");

  const PLANETS = [
    { name: "mercury", dist: 0.14, r: 2.2, color: "#b1b1b1", period: 8, tilt: 0.02 },
    { name: "venus", dist: 0.2, r: 3.4, color: "#e8cda0", period: 14, tilt: 0.03 },
    {
      name: "earth",
      dist: 0.27,
      r: 3.6,
      color: "#6db3f2",
      period: 22,
      tilt: 0.04,
      atmosphere: "rgba(100,180,255,0.35)",
      moon: { dist: 9, r: 1.1, color: "#d0d4d8", period: 4.5 },
      clickable: true,
    },
    { name: "mars", dist: 0.34, r: 2.8, color: "#e07a5f", period: 32, tilt: 0.05 },
    {
      name: "jupiter",
      dist: 0.48,
      r: 8.5,
      color: "#d4a574",
      period: 55,
      tilt: 0.06,
      bands: true,
    },
    {
      name: "saturn",
      dist: 0.62,
      r: 7.2,
      color: "#e6d5a8",
      period: 78,
      tilt: 0.08,
      rings: true,
    },
    { name: "uranus", dist: 0.74, r: 5.0, color: "#7ec8c8", period: 100, tilt: 0.07 },
    { name: "neptune", dist: 0.86, r: 4.8, color: "#4b6fd6", period: 120, tilt: 0.09 },
  ];

  let cssW = 0;
  let cssH = 0;
  let cx = 0;
  let cy = 0;
  let unit = 0;
  let t0 = performance.now();
  let animId = 0;
  let running = true;
  let asteroids = [];
  /** @type {{ x: number, y: number, r: number } | null} */
  let earthHit = null;
  let hoverEarth = false;

  function resize() {
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (cssW < 720) {
      cx = cssW * 0.72;
      cy = cssH * 0.42;
      unit = Math.min(cssW, cssH) * 0.52;
    } else {
      cx = cssW * 0.78;
      cy = cssH * 0.48;
      unit = Math.min(cssW * 0.48, cssH * 0.72);
    }

    buildAsteroids();
  }

  function buildAsteroids() {
    asteroids = [];
    const n = prefersCoarse ? 40 : 90;
    for (let i = 0; i < n; i++) {
      asteroids.push({
        a: Math.random() * Math.PI * 2,
        dist: 0.38 + Math.random() * 0.06,
        r: 0.4 + Math.random() * 1.1,
        speed: 0.12 + Math.random() * 0.08,
        alpha: 0.25 + Math.random() * 0.45,
      });
    }
  }

  function orbitPoint(dist, angle, tilt) {
    const px = Math.cos(angle) * dist * unit;
    const py = Math.sin(angle) * dist * unit * (0.42 + tilt);
    return [cx + px, cy + py];
  }

  function planetRadius(planet) {
    return Math.max(planet.r * (unit / 280), 1.5);
  }

  function drawOrbit(dist, tilt, alpha) {
    ctx.beginPath();
    const steps = 96;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const [x, y] = orbitPoint(dist, a, tilt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawSun(time) {
    const pulse = reduceMotion ? 1 : 1 + Math.sin(time * 0.0015) * 0.03;
    const R = unit * 0.055 * pulse;

    const g1 = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 5.5);
    g1.addColorStop(0, "rgba(255, 200, 80, 0.45)");
    g1.addColorStop(0.35, "rgba(255, 140, 40, 0.12)");
    g1.addColorStop(1, "rgba(255, 100, 20, 0)");
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 5.5, 0, Math.PI * 2);
    ctx.fill();

    const g2 = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.1, cx, cy, R);
    g2.addColorStop(0, "#fff6d0");
    g2.addColorStop(0.45, "#ffcc4d");
    g2.addColorStop(1, "#ff8a1a");
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlanetBody(x, y, planet, angle, highlight) {
    const rr = planetRadius(planet);

    if (highlight) {
      const pulse = 0.45 + 0.25 * Math.sin(performance.now() * 0.006);
      ctx.beginPath();
      ctx.arc(x, y, rr * 2.4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 249, 215, ${pulse})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, rr * 1.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 249, 215, ${0.08 + pulse * 0.06})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.ellipse(x, y + rr * 0.55, rr * 1.1, rr * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fill();

    if (planet.rings) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.45);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, rr * 2.1, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(220, 200, 160, 0.55)";
      ctx.lineWidth = rr * 0.55;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, rr * 1.55, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180, 160, 120, 0.35)";
      ctx.lineWidth = rr * 0.25;
      ctx.stroke();
      ctx.restore();
    }

    const g = ctx.createRadialGradient(x - rr * 0.35, y - rr * 0.35, rr * 0.1, x, y, rr);
    g.addColorStop(0, lighten(planet.color, 0.35));
    g.addColorStop(0.55, planet.color);
    g.addColorStop(1, darken(planet.color, 0.35));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();

    if (planet.atmosphere) {
      ctx.beginPath();
      ctx.arc(x, y, rr * 1.25, 0, Math.PI * 2);
      ctx.strokeStyle = planet.atmosphere;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    if (planet.bands) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = "rgba(120, 70, 40, 0.25)";
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x - rr, y + i * rr * 0.28);
        ctx.lineTo(x + rr, y + i * rr * 0.28);
        ctx.stroke();
      }
      ctx.restore();
    }

    const shade = ctx.createLinearGradient(x - rr, y, x + rr, y);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(0.55, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();

    if (planet.moon) {
      const ma =
        (reduceMotion ? 0 : (performance.now() - t0) / 1000) *
          ((Math.PI * 2) / planet.moon.period) +
        angle;
      const md = planet.moon.dist * (unit / 280);
      const mx = x + Math.cos(ma) * md;
      const my = y + Math.sin(ma) * md * 0.55;
      const mr = Math.max(planet.moon.r * (unit / 280), 0.8);
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fillStyle = planet.moon.color;
      ctx.fill();
    }
  }

  function lighten(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.min(255, r + 255 * amount)},${Math.min(255, g + 255 * amount)},${Math.min(
      255,
      b + 255 * amount
    )})`;
  }

  function darken(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${r * (1 - amount)},${g * (1 - amount)},${b * (1 - amount)})`;
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function drawAsteroids(elapsed) {
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      const ang = a.a + (reduceMotion ? 0 : elapsed * a.speed * 0.15);
      const [x, y] = orbitPoint(a.dist, ang, 0.05);
      ctx.beginPath();
      ctx.arc(x, y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 200, 210, ${a.alpha * 0.55})`;
      ctx.fill();
    }
  }

  function frame(now) {
    if (!running) return;
    const elapsed = (now - t0) / 1000;
    ctx.clearRect(0, 0, cssW, cssH);

    for (const p of PLANETS) {
      drawOrbit(p.dist, p.tilt, 0.12);
    }
    drawOrbit(0.41, 0.05, 0.06);

    drawSun(now);
    drawAsteroids(elapsed);

    const sorted = PLANETS.slice().sort((a, b) => {
      const aa = reduceMotion ? a.dist * 3 : (elapsed / a.period) * Math.PI * 2;
      const ba = reduceMotion ? b.dist * 3 : (elapsed / b.period) * Math.PI * 2;
      const ay = orbitPoint(a.dist, aa + a.dist * 4, a.tilt)[1];
      const by = orbitPoint(b.dist, ba + b.dist * 4, b.tilt)[1];
      return ay - by;
    });

    earthHit = null;
    for (const p of sorted) {
      const phase = p.dist * 4.2;
      const angle = reduceMotion ? phase : (elapsed / p.period) * Math.PI * 2 + phase;
      const [x, y] = orbitPoint(p.dist, angle, p.tilt);
      const isEarth = p.clickable;
      if (isEarth) {
        const rr = planetRadius(p);
        // Generous hit radius for mobile / discovery
        earthHit = { x, y, r: Math.max(rr * 2.8, prefersCoarse ? 22 : 14) };
      }
      // Highlight Earth only on hover (easter egg, not a permanent ad)
      drawPlanetBody(x, y, p, angle, isEarth && hoverEarth);
    }

    if (!reduceMotion) animId = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(animId);
    running = true;
    if (reduceMotion) {
      frame(performance.now());
      return;
    }
    animId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(animId);
  }

  function hitEarth(clientX, clientY) {
    if (!earthHit) return false;
    const dx = clientX - earthHit.x;
    const dy = clientY - earthHit.y;
    return dx * dx + dy * dy <= earthHit.r * earthHit.r;
  }

  function openEgg() {
    if (!eggDialog) return;
    if (typeof eggDialog.showModal === "function") {
      if (!eggDialog.open) eggDialog.showModal();
    } else {
      eggDialog.setAttribute("open", "");
    }
    // Fun toast once
    try {
      if (!sessionStorage.getItem("earth-egg-found")) {
        sessionStorage.setItem("earth-egg-found", "1");
      }
    } catch (_) {
      /* ignore */
    }
  }

  function closeEgg() {
    if (!eggDialog) return;
    if (typeof eggDialog.close === "function") eggDialog.close();
    else eggDialog.removeAttribute("open");
  }

  // pointer-events: none on canvas — use document hit-test so UI stays clickable
  document.addEventListener(
    "mousemove",
    (e) => {
      const on = hitEarth(e.clientX, e.clientY);
      if (on !== hoverEarth) {
        hoverEarth = on;
        document.documentElement.classList.toggle("is-earth-hot", on);
      }
    },
    { passive: true }
  );

  document.addEventListener(
    "click",
    (e) => {
      if (eggDialog && eggDialog.open) return;
      if (hitEarth(e.clientX, e.clientY)) {
        e.preventDefault();
        openEgg();
      }
    },
    true
  );

  if (eggDialog) {
    eggDialog.addEventListener("click", (e) => {
      if (e.target === eggDialog) closeEgg();
    });
    eggDialog.querySelectorAll("[data-earth-egg-close]").forEach((btn) => {
      btn.addEventListener("click", closeEgg);
    });
    // Copy wechat / plain values on click
    eggDialog.querySelectorAll("[data-copy]").forEach((el) => {
      el.addEventListener("click", async () => {
        const text = el.getAttribute("data-copy") || el.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          el.classList.add("is-copied");
          const prev = el.textContent;
          el.textContent = "已复制";
          setTimeout(() => {
            el.textContent = prev;
            el.classList.remove("is-copied");
          }, 1200);
        } catch (_) {
          /* ignore */
        }
      });
    });
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
