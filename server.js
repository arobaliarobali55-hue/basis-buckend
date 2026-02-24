require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Basis Backend API is running' });
});

// AI Analysis Endpoint
app.post('/api/analyze-stack', async (req, res) => {
  try {
    const { tools } = req.body;
    
    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return res.status(400).json({ error: 'Tools array is required' });
    }

    const toolListString = tools
      .map(t => `- ${t.toolName} ($${t.monthlyPrice}/mo, ${t.seats} seats, ${t.category})`)
      .join('\n');

    const prompt = `
    You are a SaaS efficiency expert. Analyze the following tech stack for a company:

    ${toolListString}

    Please provide a concise analysis covering:
    1. **Redundancies**: Are there overlapping tools? (e.g., multiple project management or communication tools).
    2. **Cost Optimization**: specific suggestions to save money (e.g., "Switching from X to Y could save $Z/mo").
    3. **Missing Critical Tools**: Are there any obvious gaps for a modern tech company?
    4. **3-Year Outlook**: Briefly predict if costs will likely explode based on this mix (e.g. usage-based pricing risks).

    Format the output as a Markdown report. Keep it professional and direct.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ analysis: responseText });
  } catch (error) {
    console.error('Error analyzing stack:', error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

// AI Prediction Endpoint
app.post('/api/predict-risk', async (req, res) => {
  try {
    const { type, location, budget } = req.body;

    if (!type || !location || !budget) {
      return res.status(400).json({ error: 'Type, location, and budget are required' });
    }

    const prompt = `
      Analyze the risk for a new business:
      Type: ${type}
      Location: ${location}
      Initial Budget: $${budget}

      Provide:
      1. Success Probability Score (0-100)
      2. Key Risk Factors
      3. Competition Density (Estimated)
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ prediction: responseText });
  } catch (error) {
    console.error('Error predicting risk:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
