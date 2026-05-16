const JSZip = require('jszip');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { html } = req.body;
  if (!html) return res.status(400).end('Nincs tartalom.');

  const zip = new JSZip();
  zip.file('index.html', html);

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="weboldal.zip"');
  res.send(buffer);
};
