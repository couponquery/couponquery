exports.handler = async (event) => {
  const brand = event.queryStringParameters.brand || "demo";
  return {
    statusCode: 200,
    body: JSON.stringify({
      brand: brand,
      last_checked_iso: new Date().toISOString(),
      codes: [
        {
          code: "WELCOME10",
          verified: true,
          verified_at: new Date().toISOString(),
          discount_text: "10% off",
          terms: "New customers only"
        }
      ]
    })
  };
};
