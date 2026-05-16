module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt, chatHistory = [] } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Hiányzó prompt.' });

  const system = `You are an elite web developer. Output a single complete HTML file.

STRICT RULES:
- Output ONLY raw HTML starting with <!DOCTYPE html>
- No markdown, no code fences, no explanation
- ALL CSS inside one <style> tag in <head>
- ALL JS inside one <script> tag before </body>
- Link Google Fonts in <head>

DESIGN:
- Visually stunning modern website with rich colors and gradients
- Real images: https://picsum.photos/seed/WORD/WIDTH/HEIGHT
- Sections: navbar, hero (full-width bg + headline + CTA), services, about, testimonials, contact, footer
- Fully responsive with media queries
- CSS animations and hover effects
- CSS variables for the color palette

CONTENT:
- Real content in Hungarian if user writes in Hungarian
- Realistic business info (phone, email, address, hours)
- No Lorem Ipsum`;

  const messages = [
    ...chatHistory.filter(m => m.role && m.content),
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'API hiba.' });
    }

    const data = await response.json();
    let html = data.content?.[0]?.text ?? '';
    html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();

    return res.status(200).json({ html });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
