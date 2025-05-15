const https = require("https");

exports.main = async (context) => {
    const token = process.env.CONTRACT_SIGNED_TAB_KEY;
    const { fileName, base64, mimeType } = context.parameters;
    console.log("Testing app rebuild")
    const options = {
      hostname: "api.hubapi.com",
      path: "/files/v3/files",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  
    const payload = JSON.stringify({
      name: fileName,
      access: "PUBLIC_NOT_INDEXABLE",
      base64Encoding: base64,
      encoding: "base64",
      fileName,
      mimeType,
    });
  
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ url: result.url });
          } else {
            reject({ error: result.message });
          }
        });
      });
  
      req.on("error", (err) => reject({ error: err.message }));
      req.write(payload);
      req.end();
    });
};