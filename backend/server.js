require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const translate = require('@iamtraction/google-translate');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const pool = mysql.createPool(dbConfig);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    await pool.execute('INSERT INTO messages (sender, content) VALUES (?,?)', ['user', message]);

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

    res.json({ message: aiResponse, translation: translatedText });
  } catch (error) {
    console.error("General error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clear-chat', async (req, res) => {
    try {
      await pool.execute('DELETE FROM messages');
      res.json({ message: 'Chat history cleared' });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.get('/api/messages', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM messages ORDER BY timestamp ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
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