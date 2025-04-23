const https = require("https");

exports.main = async (context = {}) => {
  const { properties } = context.parameters;

  const token = process.env.HUBSPOT_API_KEY;

  console.log("These are the properties:", properties)

  const options = {
    hostname: "api.hubapi.com",
    path: "/crm/v3/properties/deals",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);

          const dropdowns ={};

          parsed.results
            .filter((prop) => 
              properties.includes(prop.name) && Array.isArray(prop.options) &&
          prop.options.length > 0 
        ).forEach((prop) => {
          dropdowns[prop.name] = prop.options.map((opt) => ({
            label: opt.label,
            value: opt.value,
          }));
        });

        resolve({ optionsByProperty: dropdowns})
        } catch (e) {
          console.error("❌ JSON parse error:", e.message);
          reject({ error: "Failed to parse response" });
        }
      });
    });

    req.on("error", (err) => {
      console.error("❌ HTTPS request error:", err.message);
      reject({ error: err.message });
    });

    req.end();
  });
};
