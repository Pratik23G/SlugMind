export async function callGemini(prompt, systemPrompt = '') {
  try {
    const response = await fetch('https://slugmind.vercel.app/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt }),
    });
    const data = await response.json();
    return data.text || null;
  } catch (err) {
    console.error('[SlugMind] Gemini error:', err);
    return null;
  }
}

export async function callOllama(prompt) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3.2:3b', prompt, stream: false }),
    });
    const data = await response.json();
    return data.response || null;
  } catch (err) {
    console.error('[SlugMind] Ollama error:', err);
    return null;
  }
}

export function parseJSON(text) {
  if (!text) return null;
  try {
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export async function draftEmailReply(from, subject, body, tone = 'casual') {
  const prompt = `Draft a ${tone} reply to this email from ${from} about "${subject}". Under 80 words. Sound natural, like a college student. Return ONLY the email body.\n\nEmail:\n${body}`;
  const ollamaDraft = await callOllama(prompt);
  if (ollamaDraft) {
    console.log('[SlugMind] draft from Ollama ✓');
    return ollamaDraft;
  }
  console.log('[SlugMind] Ollama unavailable, using Gemini');
  return await callGemini(
    `Draft a ${tone} reply. Under 80 words. From: ${from}, Subject: ${subject}\n\n${body}`,
    'You are a helpful assistant for a UCSC student. Draft a short, natural reply. Sound like a student, not a robot. Return ONLY the email body.'
  );
}
