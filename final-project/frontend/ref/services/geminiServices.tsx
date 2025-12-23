
import { GoogleGenAI } from "@google/genai";
import { Event } from "../types";

// Removed apiKey parameter as it must be obtained exclusively from process.env.API_KEY per guidelines
export const generateEventSummary = async (event: Event): Promise<string> => {
  try {
    // Initializing with process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare context
    const membersList = event.members.map(m => {
      let status = "Not arrived";
      let timeDiff = "N/A";
      
      if (m.arrivalTime) {
        const diffMs = m.arrivalTime.getTime() - event.startTime.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins <= 0) {
            status = "Early/On Time";
            timeDiff = `${Math.abs(diffMins)} mins early`;
        } else {
            status = "Late";
            timeDiff = `${diffMins} mins late`;
        }
      }
      return `- ${m.nickname}: ${status} (${timeDiff})`;
    }).join('\n');

    const prompt = `
      You are the "MeetHalf" sarcastic assistant. 
      Analyze the attendance for the event "${event.name}".
      
      Here is the data:
      Start Time: ${event.startTime.toLocaleTimeString()}
      Participants:
      ${membersList}

      Task:
      Write a short, funny, slightly roasting summary of the event. 
      Praise the people who were early.
      Lightly roast the people who were late.
      Mention if anyone is still missing.
      Keep it under 150 words. Use emojis.
    `;

    // Using recommended model 'gemini-3-flash-preview' for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Accessing .text property directly as it is not a method
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating summary. Please check your configuration.";
  }
};
