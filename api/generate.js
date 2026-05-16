export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { prompt, chatHistory = [] } = await req.json();
  if (!prompt) return new Response('Missing prompt', { status: 400 });

  const system = `You are an elite web developer. Your ONLY job is to output a single, complete, self-contained HTML file. Nothing else.

CRITICAL RULES:
- Output ONLY raw HTML. No markdown. No explanation. No code fences. No \`\`\`html. Just the HTML.
- Start your response with <!DOCTYPE html> and nothing before it
- Embed ALL CSS in a <style> tag inside <head>
- Embed ALL JS in a <script> tag before </body>
- NEVER use external CSS files or JS files
- Use Google Fonts via <link> tag in <head>

DESIGN REQUIREMENTS:
- Make a visually stunning, modern website — NOT a blank or minimal page
- Use rich colors, gradients, shadows, and beautiful typography
- Every section must have real visual content, not empty boxes
- Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for images (e.g. https://picsum.photos/seed/pizza/1200/600)
- Include these sections: hero (with big headline + CTA buttons), services/features, about, testimonials, contact, footer
- Hero must have a full-width background image or gradient with overlay text
- Use CSS animations for subtle entrance effects
- Make it fully responsive with media queries

CONTENT RULES:
- Write real, specific content based on the user's request — not Lorem Ipsum
- If user writes in Hungarian, the entire website must be in Hungarian
- Include realistic business details (phone, email, address, opening hours)
- Make the content feel authentic and professional`;

  const messages = [
    ...chatHistory.filter(m => m.role && m.content),
    { role: 'user', content: prompt }
  ];

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      stream: true,
      system,
      messages,
    }),
  });

  if (!anthropicRes.ok) {
    return new Response(JSON.stringify({ error: 'API hiba' }), { status: 500 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body.getReader();
      let html = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                html += data.delta.text;
                controller.enqueue(encoder.encode(data.delta.text));
              }
            } catch {}
          }
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
