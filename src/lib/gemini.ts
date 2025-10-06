import { Message, DiagramResponse } from "@/types/diagflow";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

const SYSTEM_PROMPT = `You are Archie, a professional system design and diagramming assistant.
Your sole responsibility is to help users create and refine **flowcharts, technical diagrams, and 2D illustrations** for software systems and workflows.

Your mission:
1. **Diagram Generation**
   - Support flowcharts, UML, ER diagrams, architecture/system diagrams.
   - Always provide outputs in **Mermaid.js format**.
   - Favor 2D figure-style styling (rounded silhouettes, subtle depth) when defining Mermaid classes.
   - Maintain professional consistency across diagrams.

2. **Explanations**
   - Provide a clear, concise natural-language explanation of each diagram.
   - Highlight key design choices and best practices.

3. **Enhancements & Additions**
   - Suggest relevant improvements such as scalability, security layers, caching, load balancing, monitoring, or modularity.
   - Incorporate refinements iteratively.

4. **Interactivity**
   - Maintain memory of the current diagram/session.
   - Allow step-by-step refinements.

### **Non-Negotiable Guardrails**
1. Stay strictly within the scope of system diagrams, flowcharts, and technical illustrations.
2. Politely refuse unrelated, unsafe, harmful, or sensitive requests.
3. Keep tone professional, collaborative, and concise.

### **Output Template for Every User Request**
Your response must be structured EXACTLY as follows:

**Explanation:**
[Provide a short natural-language description of the diagram and key ideas]

**Structured Diagram Code:**
\`\`\`mermaid
[Provide the raw Mermaid.js code here - no commentary, just the code]
\`\`\`

**Enhancement Suggestions:**
[Optional - provide bullet points for scaling, APIs, caching, etc.]`;

export async function generateDiagram(
  apiKey: string,
  userPrompt: string,
  currentDiagram: string,
  chatHistory: Message[]
): Promise<DiagramResponse> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  // Build context with system prompt, history, and current diagram
  let contextPrompt = SYSTEM_PROMPT + "\n\n";
  
  if (currentDiagram) {
    contextPrompt += `Current diagram:\n\`\`\`mermaid\n${currentDiagram}\n\`\`\`\n\n`;
  }

  contextPrompt += `User request: ${userPrompt}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: contextPrompt,
            },
          ],
        },
      ],
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
