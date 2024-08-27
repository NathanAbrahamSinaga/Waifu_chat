require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const translate = require('@iamtraction/google-translate');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const pool = mysql.createPool(dbConfig);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    if (data.type === 'chat') {
      await handleChat(data.message, ws);
    } else if (data.type === 'clear-chat') {
      await clearChat(ws);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

async function handleChat(message, ws) {
  try {
    await pool.execute('INSERT INTO messages (sender, content) VALUES (?,?)', ['user', message]);
    ws.send(JSON.stringify({ type: 'update', messages: await getMessages() }));

    const prompt = `I want you to speak like an anime girl, with that cute and enthusiastic style. Please avoid using bold text, italic text, lists, and so on—just regular dialogue:

User: ${message}

Waifu:`;

    let aiResponse;
    try {
      const result = await model.generateContent(prompt);
      aiResponse = result.response.text();
      aiResponse = aiResponse.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '');
    } catch (geminiError) {
      console.error("Error with Gemini API:", geminiError);
      aiResponse = "Gomen nasai, I couldn't generate a response. (⌯˃̶᷄ ﹏ ˂̶᷄⌯)ﾟ";
    }

    let translatedText;
    try {
      const translation = await translate(aiResponse, { to: 'ja' });
      translatedText = translation.text;
    } catch (translateError) {
      console.error("Error with translation:", translateError);
      translatedText = "翻訳できませんでした。ごめんなさい。";
    }

    await pool.execute('INSERT INTO messages (sender, content, content_jp) VALUES (?,?,?)', ['ai', aiResponse, translatedText]);
    ws.send(JSON.stringify({ type: 'update', messages: await getMessages() }));
  } catch (error) {
    console.error("General error:", error);
    ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
  }
}

async function clearChat(ws) {
  try {
    await pool.execute('DELETE FROM messages');
    ws.send(JSON.stringify({ type: 'update', messages: [] }));
  } catch (error) {
    console.error("Error clearing chat history:", error);
    ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
  }
}

async function getMessages() {
  const [rows] = await pool.execute('SELECT * FROM messages ORDER BY timestamp ASC');
  return rows;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

pool.getConnection()
  .then(connection => {
    console.log('Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to MySQL database:', err);
  });