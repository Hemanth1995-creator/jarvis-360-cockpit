// auditTab.js

function loadAuditTab() {
  const auditPanel = document.getElementById("rightPanel");
  auditPanel.innerHTML = `
    <h2>Audit Tab</h2>
    <div id="auditLog" style="max-height: 300px; overflow-y: auto;"></div>
  `;
}

function logTradeToAudit(trade) {
  const auditLog = document.getElementById("auditLog");
  const entry = document.createElement("div");
  entry.classList.add("audit-entry");

  // Format timestamp
  const formattedTime = new Date(trade.timestamp).toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  entry.innerHTML = `
    <strong>${trade.action.toUpperCase()}</strong> ${trade.stock} ₹${
    trade.amount
  } @ ₹${trade.price}  
    <br><em>${formattedTime}</em> — ${trade.result}  
    <br><span>Confidence: ${trade.confidence || "N/A"}%</span>
    <hr/>
  `;

  auditLog.prepend(entry);
}

// Optional: Ensure audit tab is ready on page load
loadAuditTab();
