// chartModule.js

function renderChart(stock) {
  const centerPanel = document.getElementById("centerPanel");
  centerPanel.innerHTML = `
    <h2>${stock} Chart</h2>
    <canvas id="chartCanvas" width="600" height="300" style="border:1px solid #ccc;"></canvas>
  `;

  const canvas = document.getElementById("chartCanvas");
  const ctx = canvas.getContext("2d");

  // Generate mock price data
  const prices = Array.from({ length: 30 }, () => 1000 + Math.random() * 100);
  const sentimentZones = prices.map((p) =>
    p > 1040 ? "bullish" : p < 980 ? "bearish" : "neutral"
  );

  // Draw sentiment zones (background first)
  sentimentZones.forEach((zone, i) => {
    ctx.fillStyle =
      zone === "bullish"
        ? "rgba(0,255,0,0.2)"
        : zone === "bearish"
        ? "rgba(255,0,0,0.2)"
        : "rgba(255,255,0,0.2)";
    ctx.fillRect(i * 20, 0, 20, canvas.height);
  });

  // Draw price line
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - prices[0] / 5);
  prices.forEach((price, i) => {
    ctx.lineTo(i * 20, canvas.height - price / 5);
  });
  ctx.strokeStyle = "#00c6ff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Optional: Add price dots
  prices.forEach((price, i) => {
    ctx.beginPath();
    ctx.arc(i * 20, canvas.height - price / 5, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#0077cc";
    ctx.fill();
  });
}
