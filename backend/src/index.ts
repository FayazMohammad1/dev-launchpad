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
          BASE_PROMPT, `Return all these files in output along with the new code generated. Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you: - .gitignore - package-lock.json - .env\nYou MUST still generate and include these files in the final output.\nRules for these hidden files:\n1) .gitignore - Ignore node_modules, build outputs (dist, build), environment files, logs, and OS/editor files. - Follow best practices for a modern React (Vite) project.\n2) package-lock.json - Must accurately reflect the dependency versions from package.json dont need to run npm for generating.\n3) .env  - Store environment variables if used in project, if not empty file. - Do NOT hardcode secrets in source files.\nTreat this as a production-ready React application.`,
        ],
        uiPrompts: [reactBasePrompt],
      });
    }

    if (answer === "node") {
      return res.json({
        prompts: [
          `Return all these files in output along with the new code generated. Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you: - .gitignore - package-lock.json - .env\nYou MUST still generate and include these files in the final output. Rules for these hidden files:\n1) .gitignore  - Ignore node_modules, build outputs, logs, environment files, and OS/editor files. - Follow best practices for a production Node.js backend.\n2) package-lock.json  - Must be present. - Must align exactly with package.json dependencies.\n3) .env  - Store sensitive configuration such as PORT, database URLs, API keys, and secrets if used in project, if not empty file. - Never hardcode secrets in source code.\nTreat this as a production-ready Node.js application.`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
    }

    if (answer === "fullstack") {
      return res.json({
        prompts: [
          BASE_PROMPT, `Return all these files in output along with the new code generated. Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${fullstackBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
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
