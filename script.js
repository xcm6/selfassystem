/* Self as System — minimal interactions for four scenes */
(function () {
  const canvases = Array.from(document.querySelectorAll('.scene-canvas'));
  const state = {
    toneAlt: false, // used by scenes 2 & 3
    hatchAngle: 30,
  };

  const angleInput = document.getElementById('hatchAngle');
  if (angleInput) {
    angleInput.addEventListener('input', (e) => {
      state.hatchAngle = parseFloat(e.target.value);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'a') state.toneAlt = !state.toneAlt;
  });

  canvases.forEach((canvas) => initScene(canvas, canvas.dataset.scene));

  function initScene(canvas, type) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    resize(canvas, ctx, dpr);

    // Common pointer state
    const pointer = { x: canvas.width / 2, y: canvas.height / 2, down: false, speed: 0 };
    let last = { x: pointer.x, y: pointer.y, t: performance.now() };

    canvas.addEventListener('pointerdown', (e) => { pointer.down = true; updatePointer(e); });
    canvas.addEventListener('pointerup', () => { pointer.down = false; });
    canvas.addEventListener('pointerleave', () => { pointer.down = false; });
    canvas.addEventListener('pointermove', updatePointer);
    window.addEventListener('resize', () => resize(canvas, ctx, dpr));

    // Scene-specific buffers
    if (type === 'se') initSE();
    if (type === 'self') initSELF();
    if (type === 'mem') initMEM();
    if (type === 'gate') initGATE();

    function updatePointer(e) {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (canvas.width / r.width);
      const y = (e.clientY - r.top) * (canvas.height / r.height);
      const dx = x - pointer.x, dy = y - pointer.y;
      const now = performance.now();
      const dt = Math.max(1, now - last.t);
      pointer.speed = Math.min(1, Math.hypot(dx, dy) / (dt * 0.6));
      pointer.x = x; pointer.y = y; last = { x, y, t: now };
    }

    function loop() {
      if (type === 'se') frameSE();
      else if (type === 'self') frameSELF();
      else if (type === 'mem') frameMEM();
      else if (type === 'gate') frameGATE();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* 01 SE — Self Encryption */
    let seMask, seText;
    function initSE() {
      seMask = document.createElement('canvas');
      seMask.width = canvas.width; seMask.height = canvas.height;
      seText = document.createElement('canvas');
      seText.width = canvas.width; seText.height = canvas.height;
      const tctx = seText.getContext('2d');
      tctx.fillStyle = '#cbd5e1';
      tctx.font = `700 ${Math.floor(canvas.height * 0.08)}px Inter, sans-serif`;
      tctx.textAlign = 'center';
      tctx.textBaseline = 'middle';
      wrapText(tctx,
        ['What I keep is not a secret — it is structure.',
         'Encryption is not hiding; it compiles a stance.'],
        canvas.width * 0.5, canvas.height * 0.45, canvas.width * 0.78, canvas.height * 0.09);
      // start masked (hidden)
      const mctx = seMask.getContext('2d');
      mctx.fillStyle = '#111827';
      mctx.fillRect(0, 0, seMask.width, seMask.height);
    }
    function frameSE() {
      const m = seMask.getContext('2d');
      // random re-gray by probability, independent of pointer
      if (Math.random() < 0.02) {
        m.fillStyle = 'rgba(17,24,39,0.25)';
        m.fillRect(0, 0, seMask.width, seMask.height);
      }
      // scratching reveals
      if (pointer.down) {
        const r = 10 + pointer.speed * 40; // radius encodes resolve
        m.globalCompositeOperation = 'destination-out';
        m.beginPath();
        m.arc(pointer.x, pointer.y, r, 0, Math.PI * 2);
        m.fill();
        m.globalCompositeOperation = 'source-over';
      }
      // compose: text under mask layer
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(seText, 0, 0);
      ctx.drawImage(seMask, 0, 0);
      // noise specks that never fully clear
      ctx.fillStyle = 'rgba(203,213,225,0.05)';
      for (let i = 0; i < 80; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
      }
    }

    /* 02 SELF — Delay Mirror */
    const selfTrails = [];
    function initSELF() {
      for (let i = 0; i < 60; i++) selfTrails.push({ x: canvas.width / 2, y: canvas.height / 2, a: 0 });
    }
    function frameSELF() {
      // fade
      ctx.fillStyle = state.toneAlt ? 'rgba(2,6,23,0.2)' : 'rgba(15,23,42,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // delayed point follows with lag
      const target = { x: pointer.x, y: pointer.y };
      selfTrails.unshift({ x: target.x, y: target.y, a: 1 });
      selfTrails.splice(60);
      for (let i = 0; i < selfTrails.length; i++) {
        const p = selfTrails[i];
        const alpha = (1 - i / selfTrails.length) * 0.9;
        ctx.fillStyle = state.toneAlt ? `rgba(96,165,250,${alpha})` : `rgba(167,139,250,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 - i * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* 03 MEM — Linear Particles + Time */
    const memLines = [];
    let bandPhase = 0;
    function initMEM() { /* nothing extra */ }
    function frameMEM() {
      // background with sweeping band
      bandPhase += 0.01;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      const hue = (Math.sin(bandPhase) * 30) + (state.toneAlt ? 200 : 300);
      grad.addColorStop(0, `hsl(${hue}, 70%, 12%)`);
      grad.addColorStop(1, `hsl(${hue + 40}, 70%, 8%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // draw and decay lines (fast half-life)
      if (pointer.down) {
        memLines.push({ x: pointer.x, y: pointer.y, life: 1, len: 20 + Math.random() * 60, ang: Math.random() * Math.PI * 2 });
      }
      for (let i = memLines.length - 1; i >= 0; i--) {
        const L = memLines[i];
        ctx.strokeStyle = `rgba(255,255,255,${L.life})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L.x, L.y);
        ctx.lineTo(L.x + Math.cos(L.ang) * L.len, L.y + Math.sin(L.ang) * L.len);
        ctx.stroke();
        L.life -= 0.06; // fast fade
        if (L.life <= 0) memLines.splice(i, 1);
      }

      // sprinkle "1" as index urge
      const n = Math.floor(1 + pointer.speed * 8);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < n; i++) {
        ctx.fillText('1', Math.random() * canvas.width, Math.random() * canvas.height);
      }

      // recall with A: snag and shatter
      if (state.toneAlt && Math.random() < 0.2) {
        ctx.fillStyle = 'rgba(94,234,212,0.6)';
        for (let i = 0; i < 8; i++) {
          const sx = pointer.x + Math.cos(i) * 12;
          const sy = pointer.y + Math.sin(i) * 12;
          ctx.fillRect(sx, sy, 2 + Math.random() * 2, 2 + Math.random() * 2);
        }
      }
    }

    /* 04 GATE — Color Hatch */
    const edgePersist = document.createElement('canvas');
    function initGATE() {
      edgePersist.width = canvas.width; edgePersist.height = canvas.height;
      const ectx = edgePersist.getContext('2d');
      // draw persistent edges once
      ectx.strokeStyle = 'rgba(148,163,184,0.35)';
      ectx.lineWidth = 8;
      ectx.strokeRect(4, 4, edgePersist.width - 8, edgePersist.height - 8);
    }
    function frameGATE() {
      // background hue drifts
      const t = performance.now() * 0.0002;
      const hue = (t * 160 + 180) % 360;
      ctx.fillStyle = `hsl(${hue}, 40%, 10%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // hatch lines with adjustable angle
      const ang = (state.hatchAngle * Math.PI) / 180;
      const spacing = 16;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(167,139,250,0.6)';
      ctx.lineWidth = 1;
      for (let x = -canvas.width; x < canvas.width; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, -canvas.height); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      ctx.restore();

      // short-tail sparks near pointer when down
      if (pointer.down) {
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 30;
          const x = pointer.x + Math.cos(a) * r;
          const y = pointer.y + Math.sin(a) * r;
          ctx.fillStyle = 'rgba(94,234,212,0.7)';
          ctx.fillRect(x, y, 2, 2);
        }
      }

      // persistent edges on top (never cleared)
      ctx.drawImage(edgePersist, 0, 0);
    }
  }

  function resize(canvas, ctx, dpr) {
    const { width, height } = canvas.getBoundingClientRect();
    const w = Math.max(320, Math.floor(width * dpr));
    const h = Math.max(200, Math.floor(height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
  }

  function wrapText(ctx, lines, x, y, maxWidth, lineHeight) {
    const total = lines.length;
    const startY = y - ((total - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i];
      fitText(ctx, text, maxWidth);
      ctx.fillText(text, x, startY + i * lineHeight);
    }
  }

  function fitText(ctx, text, maxWidth) {
    let size = parseInt(ctx.font.match(/\d+/)[0], 10);
    while (ctx.measureText(text).width > maxWidth && size > 10) {
      size -= 1; ctx.font = ctx.font.replace(/\d+px/, size + 'px');
    }
  }
})();


