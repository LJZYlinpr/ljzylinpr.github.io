(function () {
  const root = document.getElementById("site-network-bg");
  const canvas = document.getElementById("site-network-canvas");
  if (!root || !canvas) return;

  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;
  const NODE_COUNT = 504;
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
    orbitRadius = Math.min(width, height) * 0.36;
    seedGraph();
  }

  function seedGraph() {
    nodes.length = 0;
    edges.length = 0;

    for (let i = 0; i < NODE_COUNT; i += 1) {
      const ring = i < NODE_COUNT * 0.18 ? 0 : i < NODE_COUNT * 0.55 ? 1 : 2;
      const ringScale = ring === 0 ? rand(0.06, 0.34) : ring === 1 ? rand(0.35, 0.7) : rand(0.72, 1.04);
      const angle = rand(0, TAU);
      const wobble = rand(-24, 24);
      const size = ring === 0 ? rand(2.1, 4.4) : ring === 1 ? rand(1.3, 2.8) : rand(0.8, 2);

      nodes.push({
        ring,
        ringScale,
        angle,
        wobble,
        size,
        pulseOffset: rand(0, TAU),
        speed: rand(0.00014, 0.0008) * (ring === 0 ? 0.75 : ring === 1 ? 1 : 1.22),
        x: 0,
        y: 0
      });
    }

    const nearest = 8;
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
      options.sort((a, b) => a.dist - b.dist);
      for (let k = 0; k < nearest; k += 1) {
        const target = options[k].j;
        if (target > i) {
          edges.push({
            a: i,
            b: target,
            phase: rand(0, TAU),
            bright: Math.random() < 0.12
          });
        }
      }
    }
  }

  function updateNodes() {
    const centerX = width * 0.54;
    const centerY = height * 0.5;
    const globalRotation = tick * 0.00012;

    for (const node of nodes) {
      node.angle += node.speed;
      const theta = node.angle + globalRotation * (node.ring === 0 ? 1.4 : node.ring === 1 ? 1 : 0.7);
      const ellipseX = orbitRadius * (1.24 - node.ring * 0.1);
      const ellipseY = orbitRadius * (0.8 - node.ring * 0.08);
      const radial = node.ringScale;
      const noise = Math.sin(tick * 0.001 + node.pulseOffset) * node.wobble;

      node.x = centerX + Math.cos(theta) * ellipseX * radial + Math.cos(theta * 3.1) * noise;
      node.y = centerY + Math.sin(theta) * ellipseY * radial + Math.sin(theta * 2.2) * noise * 0.52;
    }
  }

  function drawEdge(edge) {
    const a = nodes[edge.a];
    const b = nodes[edge.b];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist > orbitRadius * 0.4) return;

    const shimmer = (Math.sin(tick * 0.002 + edge.phase) + 1) * 0.5;
    const alpha = edge.bright ? 0.12 + shimmer * 0.08 : 0.02 + shimmer * 0.03;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(edge.bright ? [6, 10] : [3, 10]);
    ctx.lineDashOffset = -tick * (edge.bright ? 0.04 : 0.02);
    ctx.moveTo(a.x, a.y);
    const midX = (a.x + b.x) * 0.5;
    const midY = (a.y + b.y) * 0.5;
    const bend = Math.sin(edge.phase + tick * 0.001) * 16;
    const normalX = -dy / dist;
    const normalY = dx / dist;
    ctx.quadraticCurveTo(midX + normalX * bend, midY + normalY * bend, b.x, b.y);
    ctx.strokeStyle = edge.bright
      ? `rgba(15, 118, 110, ${alpha.toFixed(3)})`
      : `rgba(15, 23, 42, ${alpha.toFixed(3)})`;
    ctx.lineWidth = edge.bright ? 1.1 : 0.8;
    ctx.stroke();
    ctx.restore();
  }

  function drawNode(node, index) {
    const pulse = (Math.sin(tick * 0.003 + node.pulseOffset) + 1) * 0.5;
    const radius = node.size + pulse * 0.6;
    const highlight = index % 19 === 0 || node.ring === 0;

    if (highlight) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 2.8, 0, TAU);
      ctx.fillStyle = `rgba(15, 118, 110, ${0.02 + pulse * 0.04})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, TAU);
    ctx.fillStyle = highlight
      ? `rgba(15, 118, 110, ${0.42 + pulse * 0.14})`
      : `rgba(15, 23, 42, ${0.16 + pulse * 0.1})`;
    ctx.fill();
  }

  function drawBackdrop() {
    ctx.clearRect(0, 0, width, height);
    const grad = ctx.createRadialGradient(width * 0.56, height * 0.5, 0, width * 0.56, height * 0.5, orbitRadius * 1.45);
    grad.addColorStop(0, "rgba(15, 118, 110, 0.03)");
    grad.addColorStop(0.45, "rgba(15, 23, 42, 0.012)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
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
