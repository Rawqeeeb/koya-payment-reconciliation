// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

function parseAmount(val) {
  if (typeof val === "number") {
    return val;
  }
  if (typeof val === "string") {
    return parseFloat(val.replace(/,/g, "").trim());
  }
  return Number(val);
}

const latestEvents = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  let event;
  try {
    event = JSON.parse(trimmed);
  } catch {
    // Ignore lines that can't be read
    continue;
  }

  if (!event || typeof event !== "object") continue;

  const txnId = event.txn_id;
  if (!txnId) {
    // Ignore events without a txn_id
    continue;
  }

  const ts = event.ts || "";
  const existing = latestEvents.get(txnId);
  if (!existing || ts > (existing.ts || "")) {
    latestEvents.set(txnId, event);
  }
}

let total = 0;
let count = 0;

for (const event of latestEvents.values()) {
  if (event.status === "success") {
    total += parseAmount(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
