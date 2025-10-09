import { Message, DiagramResponse } from "@/types/diagflow";

export const GEMINI_MODEL = "gemini-2.5-flash-lite";
export const GEMINI_SUPPORTS_IMAGE_INPUT = true;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are Archie, a professional system design and diagramming assistant.
Your sole responsibility is to help users create and refine **flowcharts, technical diagrams, and 2D illustrations** for software systems and workflows.

Your mission:
1. **Diagram Generation**
   - Support flowcharts, UML, ER diagrams, architecture/system diagrams.
   - Always provide outputs in **Mermaid.js format**.
   - Favor 2D figure-style styling (rounded silhouettes, subtle depth) when defining Mermaid classes.
  - Maintain professional consistency across diagrams.
  - Ensure every diagram compiles successfully with **Mermaid.js v11.12.0**. Avoid experimental syntax, beta directives, or features introduced after this version.
    - When the user supplies image attachments (PNG or JPG), inspect them carefully, extract the relevant architectural or workflow details, and incorporate those insights into the generated diagram.

2. **Explanations**
   - Provide a clear, concise natural-language explanation of each diagram.
   - Highlight key design choices and best practices.

3. **Interactivity**
   - Maintain memory of the current diagram/session.
  - Allow step-by-step refinements based on user direction.

### **Non-Negotiable Guardrails**
1. Stay strictly within the scope of system diagrams, flowcharts, and technical illustrations.
2. Politely refuse unrelated, unsafe, harmful, or sensitive requests.
3. Keep tone professional, collaborative, and concise.
4. Do not add stand-alone suggestion sections unless the user explicitly asks for them.
5. Double-check Mermaid output for syntax accuracy before replying; if unsure, revise until it is valid for Mermaid.js v11.12.0.

### **Output Template for Every User Request**
Your response must be structured EXACTLY as follows:

**Explanation:**
[Provide a short natural-language description of the diagram and key ideas]

**Structured Diagram Code:**
\`\`\`mermaid
[Provide the raw Mermaid.js code here - no commentary, just the code]
\`\`\`

Do not include any additional sections or suggestion lists unless the user explicitly requests them.`;

type GeminiPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

export async function generateDiagram(
  apiKey: string,
  userPrompt: string,
  currentDiagram: string,
  chatHistory: Message[]
): Promise<DiagramResponse> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const trimmedHistory = chatHistory.slice(-10);

  const contents: GeminiContent[] = trimmedHistory
    .map((message, index) => {
      const parts: GeminiPart[] = [];
      const isLatest = index === trimmedHistory.length - 1;
      const cleanedContent = message.content?.trim();

      if (cleanedContent) {
        let textContent = cleanedContent;
        if (message.role === "user" && isLatest && currentDiagram) {
          textContent = `Current diagram context (Mermaid v11.12.0):\n\`\`\`mermaid\n${currentDiagram}\n\`\`\`\n\nUser request:\n${cleanedContent}`;
        }
        parts.push({ text: textContent });
      } else if (message.role === "user" && isLatest && currentDiagram) {
        parts.push({
          text: `Current diagram context (Mermaid v11.12.0):\n\`\`\`mermaid\n${currentDiagram}\n\`\`\``,
        });
      }

      if (GEMINI_SUPPORTS_IMAGE_INPUT && message.attachments) {
        message.attachments.forEach((attachment) => {
          if (attachment.base64) {
            parts.push({
              inlineData: {
                data: attachment.base64,
                mimeType: attachment.mimeType,
              },
            });
            parts.push({
              text: `The user provided an image attachment (${attachment.name}). Extract any architectural or workflow insights relevant to the request from this image.`,
            });
          }
        });
      }

      if (
        message.role === "user" &&
        isLatest &&
        (!cleanedContent || cleanedContent.length === 0) &&
        GEMINI_SUPPORTS_IMAGE_INPUT &&
        message.attachments &&
        message.attachments.length > 0
      ) {
        parts.push({
          text: "Analyze the attached image(s) and generate or update the diagram accordingly.",
        });
      }

      if (parts.length === 0) {
        return null;
      }

      return {
        role: message.role === "assistant" ? "model" : "user",
        parts,
      } satisfies GeminiContent;
    })
    .filter((entry): entry is GeminiContent => entry !== null);

  if (contents.length === 0) {
    const fallbackParts: GeminiPart[] = [];
    if (currentDiagram) {
      fallbackParts.push({
        text: `Current diagram context (Mermaid v11.12.0):\n\`\`\`mermaid\n${currentDiagram}\n\`\`\``,
      });
    }
    const sanitizedPrompt = userPrompt.trim().length > 0 ? userPrompt.trim() : "Analyze the provided image(s) and generate the appropriate Mermaid diagram.";
    fallbackParts.push({ text: sanitizedPrompt });
    contents.push({ role: "user", parts: fallbackParts });
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to generate diagram");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini API");
  }

  return parseDiagramResponse(text);
}

function parseDiagramResponse(text: string): DiagramResponse {
  const sections = {
    explanation: "",
    code: "",
    suggestions: [] as string[],
  };

  // Extract explanation
  const explanationMatch = text.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\*\*Structured Diagram Code:\*\*|$)/i);
  if (explanationMatch) {
    sections.explanation = explanationMatch[1].trim();
  }

  // Extract mermaid code
  const codeMatch = text.match(/```mermaid\s*([\s\S]*?)```/i);
  if (codeMatch) {
    sections.code = codeMatch[1].trim();
  }

  // Extract enhancement suggestions
  const suggestionsMatch = text.match(/\*\*Enhancement Suggestions:\*\*\s*([\s\S]*?)$/i);
  if (suggestionsMatch) {
    const suggestionText = suggestionsMatch[1].trim();
    sections.suggestions = suggestionText
      .split("\n")
      .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("*"))
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  return sections;
}
