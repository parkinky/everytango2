import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Lazy-initialize Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required for Gemini AI operations');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini AI Management Hub Endpoint
app.post('/api/gemini/manage', async (req, res) => {
  try {
    const { action, prompt, siteConfig, eventsSummary } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'GEMINI_API_KEY environment variable is not configured. Please add GEMINI_API_KEY in the Settings menu.',
      });
    }

    const ai = getAIClient();
    const systemInstruction = `You are the AI Website Management Assistant for Everytango, a premier global Argentine tango festival, marathon, encuentro, and milonga platform.
You assist the site administrator (parkinky) in managing website content, banners, announcements, site configuration, event quality audits, and future website improvements.
Respond politely and constructively in Korean (or matching the prompt language) with clear, actionable analysis, structured recommendations, and suggested banner/announcement copy if relevant.
Current Site Configuration: ${JSON.stringify(siteConfig || {})}
Events Overview: ${JSON.stringify(eventsSummary || {})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\n[ADMIN PROMPT]: ${prompt}\n\n[ACTION INTENT]: ${action || 'GENERAL_MANAGE'}\n\nProvide an insightful, structured response with actionable recommendations or proposed site configurations.`,
            },
          ],
        },
      ],
    });

    const reply = response.text || 'No response generated.';
    res.json({ success: true, text: reply });
  } catch (error: any) {
    console.error('Gemini Management API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gemini processing failed',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
