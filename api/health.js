export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  res.status(200).json({
    status: "ok",
    provider: process.env.AI_PROVIDER || "nvidia",
    model: process.env.NVIDIA_MODEL || "openai/gpt-oss-20b",
  });
}
