
'use server'

import Groq from 'groq-sdk'

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function chatWithData(question: string, context: string, schema: unknown[], dataSample: unknown[]) {
    // For MVP, we pass a sample of data (or all of it if small) and the schema.
    // We'll limit dataSample to top 50 rows to save tokens/latency if it's huge, 
    // but user wanted "raw data" analysis. 
    // If the user wants specific aggregations, the LLM can calculate if data is provided.
    // NOTE: Sending entire dataset to LLM is expensive/slow for large sets. 
    // A better MVP approach for "Chat with Data":
    // 1. Send Schema + Question.
    // 2. Ask LLM to write a JavaScript filter/reduce function (risky execution?) 
    //    OR ask LLM to Return a SQL query if we were querying DB (but we have data in memory/JSON).
    //    OR just answer based on the data provided.

    // Let's go with "Answer based on data provided" for small datasets (MVP).
    // We will truncate data if it exceeds a reasonable length stringified.

    const dataString = JSON.stringify(dataSample).slice(0, 30000); // ~10k tokens roughly constraint

    const systemPrompt = `
You are a data analyst assistant. Use only the provided data and schema.
Return a strict JSON object with keys:
- "answer": the direct response (string, can include a markdown table)
- "logic": a concise explanation of the steps used to compute the answer
If the data is truncated or insufficient, say so in the answer.
Do not include any extra keys or commentary outside the JSON object.
    `.trim();

    const userPrompt = `
Context: ${context}
Schema: ${JSON.stringify(schema)}

Data (JSON format, potentially truncated):
${dataString}

User Question: ${question}
    `.trim();

    try {
        const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model,
            temperature: 0,
            max_tokens: 1024,
        });

        const content = chatCompletion.choices[0]?.message?.content || "";
        let answer = "No answer generated.";
        let logic: string | undefined;

        try {
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            const jsonString = jsonStart !== -1 && jsonEnd !== -1 ? content.slice(jsonStart, jsonEnd + 1) : content;
            const parsed = JSON.parse(jsonString);
            if (parsed?.answer) answer = parsed.answer;
            if (parsed?.logic) logic = parsed.logic;
        } catch (err) {
            answer = content || answer;
        }

        return { success: true, answer, logic };
    } catch (error: unknown) {
        console.error("Groq Error:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
