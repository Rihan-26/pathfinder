import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to generate personalized roadmap
  app.post("/api/generate-roadmap", async (req, res) => {
    try {
      const { cgpa, knownKnowledge, jobDescription } = req.body;
      
      if (!cgpa || !knownKnowledge || !jobDescription) {
        return res.status(400).json({ error: "Missing required fields (cgpa, knownKnowledge, jobDescription)." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured. Please add your GEMINI_API_KEY in Settings > Secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
        You are an elite career development coach and technical recruiter.
        Analyze the following candidate profile:
        - CGPA: ${cgpa}
        - Known Knowledge/Skills: ${knownKnowledge}
        - Target Job Description/Aspirations: ${jobDescription}

        Create a highly personalized, visually structured learning and preparation roadmap tailored to close the gap between their current knowledge and the target Job Description. Take their CGPA into account:
        1. If key skills are missing, prioritize them in early milestones.
        2. Adjust the roadmap difficulty level and estimated duration to be realistic based on their current knowledge.
        3. Provide actionable advice for their CGPA:
           - If CGPA is high (e.g. >= 8.5/10 or >= 3.6/4), advise how to showcase it.
           - If CGPA is lower, give constructive tip on how to emphasize portfolios, personal projects, certifications, or open-source to overshadow CGPA during screening.
        4. Give detailed milestones, specifying discrete action items, concrete hours, and high quality documentation, platform names or resources.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert technical advisor and career strategist. You speak in a highly encouraging, structured, actionable, and professional tone.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              jobTitle: { type: Type.STRING, description: "Parsed or determined target job title" },
              estimatedRemainingTime: { type: Type.STRING, description: "Estimated total preparation time required to be ready, e.g., '6-8 Weeks' or '3 Months'" },
              difficultyLevel: { type: Type.STRING, description: "Difficulty category: Beginner, Intermediate, or Advanced" },
              gapAnalysis: {
                type: Type.OBJECT,
                properties: {
                  missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific skills mentioned/required in JD but not currently in known knowledge" },
                  cgpaFeedback: { type: Type.STRING, description: "Feedback on their CGPA and how to best position themselves in applications or resume" },
                  resumeStrengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strengths of their current knowledge matching the target role" },
                  interviewPreparationAdvice: { type: Type.STRING, description: "Specific advice on what key concepts or interview stages to focus on for this job role" }
                },
                required: ["missingSkills", "cgpaFeedback", "resumeStrengths", "interviewPreparationAdvice"]
              },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "Unique string id (e.g., 'm1', 'm2')" },
                    title: { type: Type.STRING, description: "Phase or milestone title (e.g., 'Core Framework Fundamentals')" },
                    duration: { type: Type.STRING, description: "Duration of this milestone, e.g., 'Week 1-2' or 'Week 3'" },
                    description: { type: Type.STRING, description: "Brief description of the objective" },
                    topics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key topics/concepts to master during this phase" },
                    actionItems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING, description: "Action item id, e.g. 'a1', 'a2'" },
                          task: { type: Type.STRING, description: "Actionable item/exercise/project to build" },
                          estimatedHours: { type: Type.INTEGER, description: "Hours needed to complete" }
                        },
                        required: ["id", "task", "estimatedHours"]
                      }
                    },
                    keyResources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING, description: "Name of the study resource or platform suggestion" },
                          type: { type: Type.STRING, description: "Must be one of: 'video', 'article', 'course', 'documentation'" },
                          url: { type: Type.STRING, description: "A high-quality educational link, doc link, or search query (e.g., 'https://developer.mozilla.org', 'React Docs', etc.)" }
                        },
                        required: ["title", "type", "url"]
                      }
                    },
                    recommendationReason: { type: Type.STRING, description: "Reason why this phase is recommended. Frame it constructively referencing their known skills and the target JD requirements" }
                  },
                  required: ["id", "title", "duration", "description", "topics", "actionItems", "keyResources", "recommendationReason"]
                }
              },
              overallStrategy: { type: Type.STRING, description: "High-level summary strategy of what to prioritize first, second, and third" }
            },
            required: ["jobTitle", "estimatedRemainingTime", "difficultyLevel", "gapAnalysis", "milestones", "overallStrategy"]
          }
        }
      });

      const responseText = response.text || "";
      let parsedData;
      try {
        parsedData = JSON.parse(responseText.trim());
      } catch (parseErr) {
        console.error("JSON parsing failed, responseText:", responseText);
        return res.status(500).json({ error: "Failed to parse roadmap data into custom JSON structure.", rawText: responseText });
      }

      return res.json(parsedData);

    } catch (apiErr: any) {
      console.error("Gemini API Error:", apiErr);
      return res.status(500).json({ error: apiErr.message || "An error occurred calling Gemini API." });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
