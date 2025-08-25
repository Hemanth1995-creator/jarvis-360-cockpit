// tradeEngine.js

let tradeLog = [];

function executeTrade(stock, amount, action = "buy") {
  const price = getMockPrice(stock);
  const timestamp = new Date().toISOString();
  const trade = {
    stock,
    amount,
    action,
    price,
    timestamp,
    result: simulateProfitLoss(),
    confidence: generateConfidence(),
  };

  tradeLog.push(trade);
  logTradeToAudit(trade); // Use centralized audit logging
  speak(
    `${
      action === "buy" ? "Purchased" : "Exited"
    } ₹${amount} of ${stock} at ₹${price}. ${trade.result}`
  );
}

function getMockPrice(stock) {
  const basePrices = {
    INFY: 1438,
    TCS: 3720,
    HDFC: 1680,
    RELIANCE: 2480,
  };
  const base = basePrices[stock] || 1000;
  const fluctuation = Math.random() * 20 - 10; // ±10
  return (base + fluctuation).toFixed(2);
}

function simulateProfitLoss() {
  const gain = Math.random() > 0.5;
  const percent = (Math.random() * 5).toFixed(2);
  return gain ? `Profit of ${percent}%` : `Loss of ${percent}%`;
}

function generateConfidence() {
  return (Math.random() * 100).toFixed(1); // 0.0 to 100.0%
}
