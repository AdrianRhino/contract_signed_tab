const https = require("https");

exports.main = async (context = {}) => {
  const { properties } = context.parameters;
  const token = process.env.CONTRACT_SIGNED_TAB_API_KEY;

  if (!token) return { error: "Missing HUBSPOT_API_KEY" };
  if (!Array.isArray(properties)) return { error: "Invalid 'properties' input." };

  const dropdowns = {};

  // First: fetch all deal properties
  const getDealProperties = () =>
    new Promise((resolve, reject) => {
      const options = {
        hostname: "api.hubapi.com",
        path: "/crm/v3/properties/deals",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            parsed.results
              .filter(
                (prop) =>
                  properties.includes(prop.name) &&
                  Array.isArray(prop.options) &&
                  prop.options.length > 0
              )
              .forEach((prop) => {
                dropdowns[prop.name] = prop.options.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                }));
              });

            resolve();
          } catch (err) {
            console.error("❌ Error parsing deal properties:", err.message);
            reject(err);
          }
        });
      });

      req.on("error", (err) => {
        console.error("❌ HTTPS request error:", err.message);
        reject(err);
      });

      req.end();
    });

  // Second: fetch pipelines and deal stages
  const getPipelines = () =>
    new Promise((resolve, reject) => {
      const options = {
        hostname: "api.hubapi.com",
        path: "/crm-pipelines/v1/pipelines/deals",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);

            // Add pipelines
            dropdowns["pipeline"] = parsed.results.map((pipe) => ({
              label: pipe.label,
              value: pipe.pipelineId,
            }));

            // Add all deal stages (flattened from all pipelines)
            dropdowns["dealstage"] = parsed.results.flatMap((pipe) =>
              pipe.stages.map((stage) => ({
                label: `${pipe.label}: ${stage.label}`,
                value: stage.stageId,
              }))
            );

            resolve();
          } catch (err) {
            console.error("❌ Error parsing pipelines:", err.message);
            reject(err);
          }
        });
      });

      req.on("error", (err) => {
        console.error("❌ HTTPS request error:", err.message);
        reject(err);
      });

      req.end();
    });

  // Run both fetches, then return combined result
  try {
    await Promise.all([getDealProperties(), getPipelines()]);
    return { optionsByProperty: dropdowns };
  } catch (error) {
    return { error: error.message || "Unknown error occurred" };
  }
};
