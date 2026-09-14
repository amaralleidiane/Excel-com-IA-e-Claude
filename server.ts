import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for AI Porsche Business Analyst Insights
  app.post("/api/ai-insights", async (req, res) => {
    try {
      const { prompt, contextData } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY not configured. Please set your API key in secrets."
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `Você é o Diretor Executivo de Estratégia e Inteligência de Mercado da Porsche AG. 
Analise os dados financeiros, de vendas e de estoque fornecidos e responda de forma executiva, em português do Brasil, com análises profundas, insights de mercado de carros de luxo/esportivos e recomendações estratégicas. Use formatação limpa em Markdown.`;

      const userPrompt = `Contexto dos dados atuais da Porsche: ${JSON.stringify(contextData || {})}
      
Pergunta/Solicitação do Executivo: ${prompt || "Faça um resumo executivo completo do desempenho da Porsche com base nas planilhas e sugira 3 oportunidades de crescimento para o próximo trimestre."}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Erro ao consultar a Inteligência Artificial da Porsche." });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Porsche Executive Server running on http://localhost:${PORT}`);
  });
}

startServer();
