const fetch = require("node-fetch");

exports.main = async (context) => {
  try {
    const token = process.env["HUBSPOT_API_KEY"];
    const { properties } = context.parameters;

    if (!Array.isArray(properties) || properties.length === 0) {
      throw new Error("❌ 'properties' parameter must be a non-empty array.");
    }

    const objectType = "deals";
    const results = {};

    for (const property of properties) {
      const url = `https://api.hubapi.com/crm/v3/properties/${objectType}/${property}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch '${property}': ${response.statusText}`);
        continue; // ✅ don't try to parse bad response
      }

      const data = await response.json();

      if (Array.isArray(data.options)) {
        results[property] = data.options.map((opt) => ({
          label: opt.label,
          value: opt.value
        }));
      } else {
        console.warn(`No options returned for '${property}'`);
      }
    }

    return { optionsByProperty: results };
  } catch (error) {
    console.error("❌ Error in getDealDropdownOptions:", error);
    return { error: error.message };
  }
};
