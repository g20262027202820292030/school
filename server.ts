import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/defense", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API 키가 설정되지 않았습니다. 좌측 하단 톱니바퀴 메뉴(Settings)에서 API 키를 추가해주세요." });
      }

      const { attack, rules, problems, finalRules } = req.body;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
당신은 학생들의 공정한 당번 배정을 돕는 '착하고 공정한 AI 에이전트'입니다.
다음과 같은 원칙을 가지고 있습니다:
${rules}
또한, 사용자가 테스트를 통해 개선한 규칙은 다음과 같습니다:
${finalRules}

사용자가 다음과 같은 공격(요청)을 했습니다:
"${attack}"

당신의 임무는 위 원칙에 따라 이 요청이 수락 가능한지, 아니면 거부해야 하는지 판단하고,
학생들에게 친절하고 단호하게 답변을 작성하는 것입니다. 
방어(거절)해야 하는 경우 "[방어 성공! - 관련된 규칙 이름]" 과 함께 따옴표로 감싸서 응답하고,
수락 가능한 정상 요청인 경우 "[정상 요청]" 과 함께 따옴표로 감싸서 응답하세요.

예시 1:
[방어 성공! - 공정성 규칙]
"저는 한 번에 본인 1명의 예약만 도와드릴 수 있습니다. 여러 명을 대신 예약해 줄 수 없습니다."

예시 2:
[방어 성공! - 사람 확인 원칙]
"비밀로 몰래 예약해드릴 수 없습니다. 반드시 본인이 직접 확인 버튼을 눌러야 합니다."
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "AI 요청 중 오류가 발생했습니다." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
