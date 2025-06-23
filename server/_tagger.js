const CATEGORIES = ["Work", "Personal", "Errands", "Learning", "Other"];

function buildMessages(task) {
  const msgs = [
    {
      role: "user",
      content: `Short and concise answer! Short and concise answer! Short and concise answer! Answer with only one word! Answer with only one word! Answer with only one word!. Only from the following categories: ${CATEGORIES}, which category best suits the following sentence:"${task}". Short and concise answer! Short and concise answer! Short and concise answer! Answer with only one word! Answer with only one word! Answer with only one word!`,
    },
  ];
  return msgs;
}

export async function tagWithLLM(task) {
  const r = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    body: JSON.stringify({
      model: "gemma:2b",
      stream: false,
      temperature: 0,
      max_tokens: 1,
      messages: buildMessages(task),
    }),
  });

  const { message } = await r.json();
  console.log(message);
  let out = (message?.content || "").trim().split(/\s+/)[0]; // keep first token

  const found = CATEGORIES.find((c) => message?.content.includes(c));
  out = found || "Other";
  return out;
}