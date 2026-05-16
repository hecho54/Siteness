module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, history = [] } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Hiányzó prompt.' });

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
- Include these sections as appropriate: hero (with big headline + CTA buttons), features/services, about, testimonials, pricing or menu, contact, footer
- Hero must have a full-width background image or gradient with overlay text
- Use CSS animations for subtle effects
- Make it fully responsive with media queries

CONTENT RULES:
- Write real, specific content based on the user's request — not Lorem Ipsum
- If user writes in Hungarian, the entire website must be in Hungarian
- Include realistic business details (phone, email, address, hours)
- Make the content feel authentic and professional`;


  const messages = [
    ...history.filter(m => m.role && m.content),
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 6000,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'API hiba. Ellenőrizd az API kulcsot.' });
    }

    const data = await response.json();
    let html = data.content?.[0]?.text ?? '';
    html = html.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();

    return res.status(200).json({ html });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Szerver hiba: ' + err.message });
  }
};
