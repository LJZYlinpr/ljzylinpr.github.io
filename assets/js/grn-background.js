(function () {
  const root = document.getElementById("site-network-bg");
  const canvas = document.getElementById("site-network-canvas");
  if (!root || !canvas) return;

  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;
  const NODE_COUNT = 540;
  const nodes = [];
  const edges = [];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let orbitRadius = 0;
  let tick = 0;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    orbitRadius = Math.min(width, height) * 0.38;
    seedGraph();
  }

  function seedGraph() {
    nodes.length = 0;
    edges.length = 0;

    for (let i = 0; i < NODE_COUNT; i += 1) {
      const arm = i % 4;
      const ring = i < NODE_COUNT * 0.16 ? 0 : i < NODE_COUNT * 0.58 ? 1 : 2;
      const ringScale = ring === 0 ? rand(0.04, 0.26) : ring === 1 ? rand(0.28, 0.7) : rand(0.72, 1.08);
      const angle = rand(0, TAU);
      const size = ring === 0 ? rand(1.8, 4.4) : ring === 1 ? rand(1.1, 2.6) : rand(0.7, 1.8);

      nodes.push({
        arm,
        ring,
        ringScale,
        angle,
        size,
        drift: rand(-18, 18),
        pulseOffset: rand(0, TAU),
        speed: rand(0.00008, 0.00042) * (ring === 0 ? 0.8 : ring === 1 ? 1 : 1.15),
        x: 0,
        y: 0
      });
    }

    const nearest = 9;
    for (let i = 0; i < nodes.length; i += 1) {
      const options = [];
      for (let j = 0; j < nodes.length; j += 1) {
        if (i === j) continue;
        const a = nodes[i];
        const b = nodes[j];
        const dx = Math.cos(a.angle) * a.ringScale - Math.cos(b.angle) * b.ringScale;
        const dy = Math.sin(a.angle) * a.ringScale - Math.sin(b.angle) * b.ringScale;
        options.push({ j, dist: dx * dx + dy * dy });
      }
      options.sort(function (a, b) {
        return a.dist - b.dist;
      });
      for (let k = 0; k < nearest; k += 1) {
        const target = options[k].j;
        if (target > i) {
          edges.push({
            a: i,
            b: target,
            phase: rand(0, TAU),
            bright: Math.random() < 0.16
          });
        }
      }
    }
  }

  function updateNodes() {
    const centerX = width * 0.53;
    const centerY = height * 0.5;
    const globalRotation = tick * 0.00011;

    for (const node of nodes) {
      node.angle += node.speed;
      const armBias = node.arm * (TAU / 4);
      const spiral = node.angle + armBias + globalRotation * (node.ring === 0 ? 1.45 : node.ring === 1 ? 1 : 0.7);
      const radial = node.ringScale;
      const ellipseX = orbitRadius * (1.28 - node.ring * 0.11);
      const ellipseY = orbitRadius * (0.8 - node.ring * 0.08);
      const shimmer = Math.sin(tick * 0.0012 + node.pulseOffset) * node.drift;

      node.x = centerX + Math.cos(spiral) * ellipseX * radial + Math.cos(spiral * 2.8) * shimmer;
      node.y = centerY + Math.sin(spiral) * ellipseY * radial + Math.sin(spiral * 2.1) * shimmer * 0.7;
    }
  }

  function drawEdge(edge) {
    const a = nodes[edge.a];
    const b = nodes[edge.b];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist > orbitRadius * 0.44) return;

    const shimmer = (Math.sin(tick * 0.002 + edge.phase) + 1) * 0.5;
    const alpha = edge.bright ? 0.12 + shimmer * 0.09 : 0.025 + shimmer * 0.03;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(edge.bright ? [7, 11] : [3, 12]);
    ctx.lineDashOffset = -tick * (edge.bright ? 0.05 : 0.02);
    ctx.moveTo(a.x, a.y);
    const midX = (a.x + b.x) * 0.5;
    const midY = (a.y + b.y) * 0.5;
    const bend = Math.sin(edge.phase + tick * 0.001) * 18;
    const normalX = -dy / dist;
    const normalY = dx / dist;
    ctx.quadraticCurveTo(midX + normalX * bend, midY + normalY * bend, b.x, b.y);
    ctx.strokeStyle = edge.bright
      ? "rgba(103, 232, 249," + alpha.toFixed(3) + ")"
      : "rgba(148, 163, 184," + alpha.toFixed(3) + ")";
    ctx.lineWidth = edge.bright ? 1.15 : 0.72;
    ctx.stroke();
    ctx.restore();
  }

  function drawNode(node, index) {
    const pulse = (Math.sin(tick * 0.003 + node.pulseOffset) + 1) * 0.5;
    const radius = node.size + pulse * 0.45;
    const highlight = index % 17 === 0 || node.ring === 0;

    if (highlight) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 3.2, 0, TAU);
      ctx.fillStyle = "rgba(96, 165, 250," + (0.03 + pulse * 0.05).toFixed(3) + ")";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, TAU);
    ctx.fillStyle = highlight
      ? "rgba(125, 211, 252," + (0.52 + pulse * 0.16).toFixed(3) + ")"
      : "rgba(226, 232, 240," + (0.14 + pulse * 0.08).toFixed(3) + ")";
    ctx.fill();
  }

  function drawBackdrop() {
    ctx.clearRect(0, 0, width, height);

    const core = ctx.createRadialGradient(width * 0.53, height * 0.5, 0, width * 0.53, height * 0.5, orbitRadius * 1.3);
    core.addColorStop(0, "rgba(56, 189, 248, 0.11)");
    core.addColorStop(0.28, "rgba(59, 130, 246, 0.06)");
    core.addColorStop(0.52, "rgba(30, 41, 59, 0.03)");
    core.addColorStop(1, "rgba(2, 6, 23, 0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 60; i += 1) {
      const x = (i * 137.5) % width;
      const y = (i * 73.3) % height;
      const twinkle = 0.12 + ((Math.sin(tick * 0.01 + i) + 1) * 0.5) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, 0.9 + (i % 3) * 0.4, 0, TAU);
      ctx.fillStyle = "rgba(255,255,255," + twinkle.toFixed(3) + ")";
      ctx.fill();
    }
  }

  function frame() {
    tick += 1;
    drawBackdrop();
    updateNodes();
    for (const edge of edges) drawEdge(edge);
    for (let i = 0; i < nodes.length; i += 1) drawNode(nodes[i], i);
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  frame();
})();
