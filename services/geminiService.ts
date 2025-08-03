
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionTypeId, QuizQuestion } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Creates a schema for a single question type, making the AI's job easier.
const createResponseSchema = (type: QuestionTypeId, description: string) => {
    const properties = {
        [QuestionTypeId.MULTIPLE_CHOICE]: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING }
        },
        [QuestionTypeId.TRUE_FALSE]: {
            statement: { type: Type.STRING },
            answer: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING }
        },
        [QuestionTypeId.MULTIPLE_ANSWER]: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answers: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING }
        }
    };

    return {
        type: Type.OBJECT,
        properties: {
            [type]: {
                type: Type.ARRAY,
                description,
                items: {
                    type: Type.OBJECT,
                    properties: properties[type],
                    required: Object.keys(properties[type])
                }
            }
        }
    };
};

export const generateQuizFromText = async (
  text: string,
  requestedTypes: { [key in QuestionTypeId]?: number },
  language: string,
  onProgress: (progress: number) => void
): Promise<QuizQuestion[]> => {
    const generationPromises: Promise<any>[] = [];
    onProgress(0); // Initialize progress

    for (const typeId in requestedTypes) {
        const count = requestedTypes[typeId as QuestionTypeId];
        if (!count || count <= 0) continue;

        const type = typeId as QuestionTypeId;
        const typeName = type.replace(/_/g, ' ');
        
        const prompt = `
            You are a professional quiz creator. Based on the text provided below, generate exactly ${count} ${typeName} questions.
            All content you generate (questions, options, answers, explanations) must be strictly in the "${language}" language.
            Return the result as a perfectly valid JSON object following the provided schema. Do not include any markdown formatting like \`\`\`json.
            
            Text:
            ---
            ${text.substring(0, 30000)}
            ---
        `;

        const schema = createResponseSchema(type, `Array of ${typeName} questions.`);

        const promise = ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        generationPromises.push(promise);
    }
    
    if (generationPromises.length === 0) {
        onProgress(100);
        return [];
    }

    try {
        let completedCount = 0;
        const totalPromises = generationPromises.length;

        const progressPromises = generationPromises.map(p =>
            p.then(result => {
                completedCount++;
                onProgress(Math.round((completedCount / totalPromises) * 100));
                return result;
            })
        );

        const responses = await Promise.all(progressPromises);
        let allQuestions: QuizQuestion[] = [];

        for (const response of responses) {
            // Robustly clean the response text before parsing
            const cleanedJsonText = response.text.replace(/```json|```/g, '').trim();
            const rawQuizData = JSON.parse(cleanedJsonText);

            for (const typeId in rawQuizData) {
                const key = typeId as QuestionTypeId;
                if (Array.isArray(rawQuizData[key])) {
                    const questions = rawQuizData[key].map((q: any) => ({ ...q, type: key }));
                    allQuestions.push(...questions);
                }
            }
        }
        
        if (allQuestions.length === 0) {
            throw new Error("AI returned an empty list of questions. The document might not have enough content.");
        }

        return allQuestions;

    } catch (error: any) {
        console.error("Error calling Gemini API or parsing responses:", error);
        throw new Error(`AI model failed to generate a valid quiz. Please try again. Details: ${error.message}`);
    }
};
