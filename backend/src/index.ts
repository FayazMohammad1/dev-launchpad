import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI, createUserContent } from "@google/genai";

import { BASE_PROMPT, getSystemPrompt } from "./prompts.js";
import { basePrompt as nodeBasePrompt } from "./defaults/node.js";
import { basePrompt as reactBasePrompt } from "./defaults/react.js";
import { basePrompt as fullstackBasePrompt } from "./defaults/fullstack.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in .env file");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/template", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const detect = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: createUserContent(prompt),
      config: {
        systemInstruction:
          "Return EXACTLY one word: 'node', 'react', or 'fullstack'. " +
          "Choose 'fullstack' if BOTH backend and frontend are needed. " +
          "NEVER return anything else.",
        thinkingConfig: { thinkingBudget: 0 }, // Optional: disables thinking for speed
      },
    });

    const answer = detect.text;
    console.log("Detected project type:", answer);

    if (answer === "react") {
      return res.json({
        prompts: [
          BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
    }

    if (answer === "node") {
      return res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
    }

    if (answer === "fullstack") {
      return res.json({
        prompts: [
          BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${fullstackBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [fullstackBasePrompt],
      });
    }

    return res
      .status(400)
      .json({ error: "Unknown project type detected: " + answer });
  } catch (err) {
    console.error("Error in /template:", err);
    return res.status(500).json({ error: "Template generation failed" });
  }
});

app.post("/chat", async (req, res) => {
  const raw = req.body.messages || [];
  const messages = raw.map(toGeminiMessage);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
      config: {
        systemInstruction: getSystemPrompt(),
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    console.log(response.text);
    res.json({ response: response.text });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Chat request failed" });
  }
});


/* ---------------------------------------------------------
   SERVER START
--------------------------------------------------------- */
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

function toGeminiMessage(input: any) {
  if (input.parts) {
    return {
      role: input.role,
      parts: input.parts.map((p: any) => ({ text: p.text ?? "" }))
    };
  }

  if (input.content) {
    return {
      role: input.role,
      parts: [{ text: input.content }]
    };
  }

  if (typeof input.text === "string") {
    return {
      role: input.role || "user",
      parts: [{ text: input.text }]
    };
  }

  return {
    role: "user",
    parts: [{ text: "" }]
  };
}
