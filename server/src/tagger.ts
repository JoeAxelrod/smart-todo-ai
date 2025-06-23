const CATEGORIES = ["Work", "Personal", "Errands", "Learning", "Other"] as const;
export type Category = typeof CATEGORIES[number];

function buildMessages(task: string) {
  return [
    {
      role: "user",
      content: `Short and concise answer! Short and concise answer! Short and concise answer! Answer with only one word! Answer with only one word! Answer with only one word!. Only from the following categories: ${CATEGORIES}, which category best suits the following sentence:"${task}". Short and concise answer! Short and concise answer! Short and concise answer! Answer with only one word! Answer with only one word! Answer with only one word!`,
    },
  ];
}

export async function tagWithLLM(task: string): Promise<Category> {
  const base = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  try {
    console.log("🔍 Start: Tagging task with LLM:", task);
    const r = await fetch(`${base}/api/chat`, {
      method: "POST",
      body: JSON.stringify({
        model: "gemma:2b",
        stream: false,
        temperature: 0,
        max_tokens: 1,
        messages: buildMessages(task),
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (!r.ok) throw new Error(`Ollama ${r.status}`);

    const { message } = (await r.json()) as { message?: { content?: string } };
    const category = CATEGORIES.find(c => message?.content?.includes(c)) ?? "Other";
    console.log("✅ Tagging completed:", category);
    return category as Category;
  } catch (err) {
    console.warn("⚠️  Ollama call failed → defaulting to Other:", err);
    return "Other";
  }
}
