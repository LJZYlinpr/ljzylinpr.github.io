(function () {
  const root = document.getElementById("site-network-bg");
  const canvas = document.getElementById("site-network-canvas");
  if (!root || !canvas) return;

  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;

  const networks = [
    {
      key: "pluripotency",
      centerX: 0.24,
      centerY: 0.52,
      radius: 0.18,
      label: "Pluripotency GRN",
      nodes: [
        { id: "OCT4", angle: -1.45, r: 0.08, size: 7.6, color: "#7dd3fc" },
        { id: "SOX2", angle: -0.28, r: 0.12, size: 7.2, color: "#67e8f9" },
        { id: "NANOG", angle: 1.02, r: 0.09, size: 7.4, color: "#93c5fd" },
        { id: "KLF4", angle: -2.42, r: 0.48, size: 5.6, color: "#a5f3fc" },
        { id: "ESRRB", angle: 2.35, r: 0.44, size: 5.8, color: "#bae6fd" },
        { id: "SALL4", angle: 0.08, r: 0.54, size: 5.3, color: "#c4b5fd" },
        { id: "TCF3", angle: 1.95, r: 0.6, size: 5.1, color: "#fda4af" }
      ],
      edges: [
        ["OCT4", "SOX2", "positive"],
        ["SOX2", "NANOG", "positive"],
        ["NANOG", "OCT4", "positive"],
        ["OCT4", "NANOG", "positive"],
        ["SOX2", "OCT4", "positive"],
        ["OCT4", "KLF4", "positive"],
        ["NANOG", "ESRRB", "positive"],
        ["SOX2", "SALL4", "positive"],
        ["TCF3", "OCT4", "negative"],
        ["TCF3", "NANOG", "negative"]
      ]
    },
    {
      key: "p53",
      centerX: 0.76,
      centerY: 0.5,
      radius: 0.18,
      label: "p53 Stress GRN",
      nodes: [
        { id: "TP53", angle: -1.5, r: 0.06, size: 7.8, color: "#7dd3fc" },
        { id: "MDM2", angle: 0.25, r: 0.16, size: 6.7, color: "#fda4af" },
        { id: "MDM4", angle: 1.55, r: 0.18, size: 6.1, color: "#fbcfe8" },
        { id: "ATM", angle: -2.45, r: 0.52, size: 5.6, color: "#a5f3fc" },
        { id: "CHEK2", angle: -0.72, r: 0.48, size: 5.2, color: "#bae6fd" },
        { id: "CDKN1A", angle: 2.5, r: 0.58, size: 5.5, color: "#93c5fd" },
        { id: "BAX", angle: 0.95, r: 0.58, size: 5.2, color: "#c4b5fd" },
        { id: "ARF", angle: -3.02, r: 0.42, size: 5.2, color: "#fef08a" }
      ],
      edges: [
        ["ATM", "CHEK2", "positive"],
        ["ATM", "TP53", "positive"],
        ["CHEK2", "TP53", "positive"],
        ["TP53", "MDM2", "positive"],
        ["TP53", "CDKN1A", "positive"],
        ["TP53", "BAX", "positive"],
        ["MDM2", "TP53", "negative"],
        ["MDM4", "TP53", "negative"],
        ["ARF", "MDM2", "negative"]
      ]
    }
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let tick = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getNodeCoords(network, node) {
    const cx = width * network.centerX;
    const cy = height * network.centerY;
    const base = Math.min(width, height) * network.radius;
    const rotation = network.key === "pluripotency" ? tick * 0.00011 : -tick * 0.0001;
    const theta = node.angle + rotation;
    const radial = node.r;
    const wobble = Math.sin(tick * 0.0014 + node.r * 7) * 7;

    return {
      x: cx + Math.cos(theta) * base * radial + Math.cos(theta * 2.6) * wobble,
      y: cy + Math.sin(theta) * base * radial + Math.sin(theta * 2.2) * wobble * 0.75
    };
  }

  function drawBackdrop() {
    ctx.clearRect(0, 0, width, height);
    const nebulaLeft = ctx.createRadialGradient(width * 0.23, height * 0.52, 0, width * 0.23, height * 0.52, Math.min(width, height) * 0.34);
    nebulaLeft.addColorStop(0, "rgba(56, 189, 248, 0.16)");
    nebulaLeft.addColorStop(0.34, "rgba(34, 211, 238, 0.08)");
    nebulaLeft.addColorStop(1, "rgba(2, 6, 23, 0)");
    ctx.fillStyle = nebulaLeft;
    ctx.fillRect(0, 0, width, height);

    const nebulaRight = ctx.createRadialGradient(width * 0.77, height * 0.5, 0, width * 0.77, height * 0.5, Math.min(width, height) * 0.34);
    nebulaRight.addColorStop(0, "rgba(99, 102, 241, 0.14)");
    nebulaRight.addColorStop(0.36, "rgba(125, 211, 252, 0.06)");
    nebulaRight.addColorStop(1, "rgba(2, 6, 23, 0)");
    ctx.fillStyle = nebulaRight;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 72; i += 1) {
      const x = (i * 149.3) % width;
      const y = (i * 83.7) % height;
      const twinkle = 0.1 + ((Math.sin(tick * 0.008 + i) + 1) * 0.5) * 0.25;
      ctx.beginPath();
      ctx.arc(x, y, 0.9 + (i % 3) * 0.35, 0, TAU);
      ctx.fillStyle = "rgba(255,255,255," + twinkle.toFixed(3) + ")";
      ctx.fill();
    }
  }

  function drawEdge(a, b, type) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (!dist) return;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(type === "negative" ? [5, 11] : [8, 8]);
    ctx.lineDashOffset = -tick * 0.03;
    ctx.moveTo(a.x, a.y);
    const midX = (a.x + b.x) * 0.5;
    const midY = (a.y + b.y) * 0.5;
    const bend = Math.sin(tick * 0.001 + dist * 0.01) * 12;
    const nx = -dy / dist;
    const ny = dx / dist;
    ctx.quadraticCurveTo(midX + nx * bend, midY + ny * bend, b.x, b.y);
    ctx.strokeStyle = type === "negative"
      ? "rgba(251, 113, 133, 0.42)"
      : "rgba(103, 232, 249, 0.42)";
    ctx.lineWidth = type === "negative" ? 1 : 1.15;
    ctx.stroke();
    ctx.restore();
  }

  function drawNode(node, pos) {
    const pulse = (Math.sin(tick * 0.003 + pos.x * 0.01) + 1) * 0.5;
    const radius = node.size + pulse * 0.55;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius * 2.6, 0, TAU);
    ctx.fillStyle = "rgba(125, 211, 252, 0.035)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, TAU);
    ctx.fillStyle = node.color;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(226, 232, 240, 0.96)";
    ctx.font = "600 12px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(node.id, pos.x, pos.y - radius - 10);
  }

  function drawNetwork(network) {
    const lookup = {};
    network.nodes.forEach(function (node) {
      lookup[node.id] = getNodeCoords(network, node);
    });

    network.edges.forEach(function (edge) {
      drawEdge(lookup[edge[0]], lookup[edge[1]], edge[2]);
    });

    network.nodes.forEach(function (node) {
      drawNode(node, lookup[node.id]);
    });

    ctx.fillStyle = "rgba(103, 232, 249, 0.72)";
    ctx.font = "700 12px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(network.label, width * network.centerX, height * (network.centerY - 0.2));
  }

  function frame() {
    tick += 1;
    drawBackdrop();
    networks.forEach(drawNetwork);
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  frame();
})();
