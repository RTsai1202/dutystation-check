import { GoogleGenAI } from "@google/genai";
import { TaskItem, ShiftSection } from "../types";
import { BASIC_TASKS, SHIFT_SECTIONS } from "../constants";

export const generateReport = async (
  checkedItems: Record<string, boolean>,
  currentReport: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning generic message.");
    return currentReport + "\n[System]: Gemini API Key not found. Cannot generate AI report.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Collect completed tasks
  const completedTasks: string[] = [];
  
  // Helper to check list
  const checkList = (tasks: TaskItem[]) => {
    tasks.forEach(t => {
      if (checkedItems[t.id]) {
        completedTasks.push(t.label);
      }
    });
  };

  checkList(BASIC_TASKS);
  SHIFT_SECTIONS.forEach(section => checkList(section.tasks));

  if (completedTasks.length === 0) {
    return "尚無完成事項。";
  }

  // 2. Construct Prompt
  const prompt = `
    You are an assistant for an emergency response team. 
    Based on the following completed checklist items for the day, generate a concise, professional duty report (值班日誌).
    
    The format should be similar to:
    "一、上述時間值班無異狀。
     二、維護駐地安全、值班室清潔，無線電通訊良好。
     三、完成事項：
     [List of completed key items]"

    Completed Items:
    ${completedTasks.join('\n')}

    Current existing report draft (append to this or refine it):
    "${currentReport}"

    Output the response in Traditional Chinese (Taiwan). Keep it formal and brief.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate report.");
  }
};