
import profile from "../data/profile.js";

const MODEL =
    process.env.OPENROUTER_MODEL ||
    "nvidia/nemotron-3-super-120b-a12b:free";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error("OPENROUTER_API_KEY is missing");
        return res.status(500).json({
            error: "Server is missing the API key",
        });
    }

    const message = String(req.body?.message ?? "")
        .trim()
        .slice(0, 800);

    if (!message) {
        return res.status(400).json({
            error: "Empty message",
        });
    }

    const systemPrompt = `
You are a friendly chatbot on Josh's portfolio website.
Answer only using the portfolio information below when
discussing Josh's background, skills, education, or projects.
If the information is missing, say you don't know.
Keep answers short, clear, and professional.

PORTFOLIO INFORMATION:
${JSON.stringify(profile, null, 2)}
`;

    try {
        const aiResponse = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message },
                    ],
                    max_tokens: 300,
                    temperature: 0.3,
                }),
                signal: AbortSignal.timeout(60000),
            }
        );

        const data = await aiResponse.json();

        if (!aiResponse.ok) {
            console.error("OpenRouter error:", {
                status: aiResponse.status,
                error: data.error,
            });

            return res.status(502).json({
                error: "AI is busy or unavailable",
            });
        }

        const reply = data.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            console.error("OpenRouter returned no text");
            return res.status(502).json({
                error: "AI gave an empty reply",
            });
        }

        return res.status(200).json({ reply });
    } catch (error) {
        console.error("AI request failed:", {
            name: error.name,
            message: error.message,
        });

        return res.status(502).json({
            error: "Could not reach the AI",
        });
    }
}
