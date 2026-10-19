
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
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(60000),
    }
  );

  const data = await aiResponse.json();

  if (!aiResponse.ok) {
    // Log the provider's error on the server, not your API key.
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
    console.error("OpenRouter returned no text:", data);

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
