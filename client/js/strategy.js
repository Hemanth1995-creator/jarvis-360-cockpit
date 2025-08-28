// strategy.js

export function calculateTradeDecision(
  MA_fast,
  MA_slow,
  RSI,
  Price,
  VWAP,
  Volume
) {
  let score = 0;

  // Condition 1: Moving Averages
  if (MA_fast > MA_slow) score += 40;

  // Condition 2: RSI between 50-65 and rising
  if (RSI >= 50 && RSI <= 65 && RSI > previousRSI) score += 20; // Assuming previousRSI is stored somewhere

  // Condition 3: Price > VWAP
  if (Price > VWAP) score += 20;

  // Condition 4: Volume spike
  if (Volume > averageVolume * 1.5) score += 10; // Assuming averageVolume is pre-calculated

  // Risk Filter: Cap score if RSI > 75
  if (RSI > 75) score = Math.min(score, 40); // Cap the score to 40 if RSI > 75

  // Confidence calculation (score capped between 0 and 95)
  let confidence = Math.min(Math.max(score, 0), 95);

  // Decision making based on confidence level
  let action = confidence >= 70 ? "BUY" : confidence <= 30 ? "SELL" : "HOLD";

  return { action, confidence };
}
