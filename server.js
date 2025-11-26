const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

/**
 * 🔁 OpenRouter GPT route
 */
app.post("/ask", async (req, res) => {
  const question = req.body.question;

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
  } catch (error) {
    console.error("🔥 OpenRouter error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch answer from OpenRouter." });
  }
});

/**
 * 🌐 Universal proxy for streamed.su/api/*
 * Example: GET /api/matches/fight/popular → forwards to https://streamed.su/api/matches/fight/popular
 */
app.use("/api", async (req, res) => {
  const streamedPath = req.originalUrl.replace("/api", "");
  const targetUrl = `https://streamed.su/api${streamedPath}`;

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error("🔥 Proxy error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch data from streamed.su",
      details: error.message,
    });
  }
});

app.listen(PORT, () =>
  console.log(`✅ SportGPT backend running at http://localhost:${PORT}`)
);
