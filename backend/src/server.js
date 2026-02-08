const express = require("express");
const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "PrivaShield backend running via Docker" });
});

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
