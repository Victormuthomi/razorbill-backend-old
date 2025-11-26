// backend/index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const app = express();

// ------------------------
// CORS: Allow all origins
// ------------------------
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(express.json());

// ------------------------
// Health Check
// ------------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running!" });
});

// ------------------------
// OpenRouter GPT Route
// ------------------------
app.post("/ask", async (req, res) => {
  const question = req.body.question;
  if (!question) return res.status(400).json({ error: "Question is required" });

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: question }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const answer =
      response.data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't answer that.";

    res.json({ reply: answer });
  } catch (err) {
    console.error("🔥 OpenRouter error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch answer from OpenRouter" });
  }
});

// ------------------------
// Badge Proxy Route
// ------------------------
const badgeCache = new Map();

app.get("/api/images/badge/:badgeId.webp", async (req, res) => {
  const { badgeId } = req.params;

  try {
    if (badgeCache.has(badgeId)) {
      res.setHeader("Content-Type", "image/webp");
      return res.send(badgeCache.get(badgeId));
    }

    const response = await axios.get(
      `https://streamed.su/api/images/badge/${badgeId}.webp`,
      { responseType: "arraybuffer" }
    );

    badgeCache.set(badgeId, response.data);
    res.setHeader("Content-Type", "image/webp");
    res.send(response.data);
  } catch (err) {
    console.error("🔥 Badge fetch failed:", err.message);
    res.status(404).send("Badge not found");
  }
});

// ------------------------
// Matches API (safe backend source)
// ------------------------
const exampleMatches = [
  // Add your initial matches here or fetch from DB
];

app.get("/api/matches/live/popular", async (req, res) => {
  try {
    // TODO: replace exampleMatches with your DB or cached source
    res.json(exampleMatches);
  } catch (err) {
    console.error("🔥 Matches fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// ------------------------
// Stream Proxy Route (optional, for future streams)
// ------------------------
app.get("/api/stream/:source/:id", async (req, res) => {
  const { source, id } = req.params;

  try {
    const response = await axios.get(
      `https://streamed.su/api/stream/${source}/${id}`
    );
    res.json(response.data);
  } catch (err) {
    console.error("🔥 Stream fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch stream" });
  }
});

// ------------------------
// Start Server
// ------------------------
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
