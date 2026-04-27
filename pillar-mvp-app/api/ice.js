// Vercel serverless function — returns fresh TURN credentials from Metered.ca
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey   = process.env.METERED_API_KEY || 'be1029871e9f0c5e5b33c98b7ad224ffe85d';
  const hostname = process.env.METERED_HOSTNAME || 'pillar.metered.live';


  try {
    const response = await fetch(
      `https://${hostname}/api/v1/turn/credentials?apiKey=${apiKey}`
    );
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Metered error', details: text });
    }
    const iceServers = await response.json();
    res.status(200).json({ iceServers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
