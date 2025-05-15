const https = require("https");

exports.main = async (context = {}) => {
  try {
    const token = process.env["CONTRACT_SIGNED_TAB_KEY"];
    const { dealId, properties } = context.parameters;

    if (
      !token ||
      !dealId ||
      !Array.isArray(properties) ||
      properties.length === 0
    ) {
      console.warn("⚠️ Invalid input:", { token, dealId, properties });
      return { error: "Missing or invalid parameters" };
    }

    const path = `/crm/v3/objects/deals/${dealId}?properties=${encodeURIComponent(
      properties.join(",")
    )}`;
    const options = {
      hostname: "api.hubapi.com",
      path,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);

            if (res.statusCode >= 400) {
              console.error(`❌ HubSpot API Error ${res.statusCode}:`, parsed);
              resolve({
                error:
                  parsed.message ||
                  parsed.status ||
                  parsed.error ||
                  "Unknown API error",
                raw: parsed,
              });
              return;
            }

            resolve({ values: parsed.properties || {}, raw: parsed });
          } catch (e) {
            console.error("❌ JSON parse error:", e.message, data);
            resolve({ error: "Invalid JSON returned from HubSpot", raw: data });
          }
        });
      });

      req.on("error", (err) => {
        console.error("❌ HTTPS request error:", err.message);
        reject({ error: err.message });
      });

      req.end();
    });
  } catch (err) {
    console.error("❌ Uncaught error in getDealProperties:", err.message);
    return { error: err.message };
  }
};
