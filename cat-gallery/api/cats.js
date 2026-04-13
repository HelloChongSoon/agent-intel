export default async function handler(req, res) {
  try {
    const limit = Number(req.query.limit || 24);
    const r = await fetch(`https://api.thecatapi.com/v1/images/search?limit=${limit}`, {
      headers: { 'x-api-key': process.env.CAT_API_KEY }
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
