const https = require("https");

exports.main = async (context = {}) => {
  const { dealId, updates } = context.parameters;
  const token = process.env.CONTRACT_SIGNED_TAB_API_KEY;

  if (!dealId || !updates) return { error: "Missing dealId or updates." };

  const payload = JSON.stringify({ properties: updates });

  const options = {
    hostname: "api.hubapi.com",
    path: `/crm/v3/objects/deals/${dealId}`,
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ success: true, result: JSON.parse(data) });
      });
    });

    req.on("error", (e) => reject({ error: e.message }));
    req.write(payload);
    req.end();
  });
};
