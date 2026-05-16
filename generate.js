module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, history = [] } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Hiányzó prompt.' });

  const system = `You are an elite web developer who creates stunning, production-ready websites.

RULES:
- Return ONLY the complete HTML file — no explanation, no markdown, no code fences
- All CSS goes inside a <style> tag in <head>
- All JavaScript goes inside a <script> tag before </body>
- Use modern design: clean typography, good spacing, beautiful color palettes
- Use real placeholder images from https://picsum.photos (e.g. https://picsum.photos/seed/food/800/500)
- Make it fully responsive (mobile-first)
- Use Google Fonts (Plus Jakarta Sans or Inter are great choices)
- Include smooth animations and hover effects
- Add real, meaningful content (not Lorem Ipsum) based on what the user describes
- If the user writes in Hungarian, generate the site in Hungarian
- Include all standard sections relevant to the business type
- Make the design feel premium and modern — not generic or template-like
- Use CSS variables for colors, consistent design tokens
- Hero section must have a strong headline, subheading, and CTA buttons`;

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
        max_tokens: 8000,
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
