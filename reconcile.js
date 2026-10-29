
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "payments.jsonl");
const expectedPath = path.join(__dirname, "expected.txt");

const latestByTxn = new Map();

const lines = fs.readFileSync(dataPath, "utf8").split(/\r?\n/);

for (const line of lines) {
  if (!line.trim()) continue;

  let event;

  try {
    event = JSON.parse(line);
  } catch {
    // Ignore malformed JSON lines.
    continue;
  }

  // Ignore events without a transaction ID.
  if (
    !event ||
    event.txn_id === undefined ||
    event.txn_id === null ||
    String(event.txn_id).trim() === ""
  ) {
    continue;
  }

  const timestamp = Date.parse(event.ts);

  const previous = latestByTxn.get(event.txn_id);

  // Retain the latest attempt for each transaction.
  if (!previous || timestamp >= previous.timestamp) {
    latestByTxn.set(event.txn_id, {
      event,
      timestamp,
    });
  }
}

let total = 0;
let count = 0;

for (const { event } of latestByTxn.values()) {
  if (event.status === "success") {
    const amount = Number(String(event.amount).replace(/,/g, ""));

if (!Number.isFinite(amount)) {
  console.log("Invalid amount in transaction:", JSON.stringify(event));
} else {
  total += amount;
}
    count++;
  }
}

const expected = parseInt(
  fs.readFileSync(expectedPath, "utf8").trim(),
  10
);

if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`
  );
  console.log(
    "Something in the data isn't being handled the way the README describes."
  );
  process.exitCode = 1;
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
