// Minimal test to isolate the networking issue
import express from "express";

const app = express();
app.get("/", (req, res) => res.json({ status: "minimal server working" }));

const PORT = 3333;
const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`Minimal server on 127.0.0.1:${PORT}`);
  
  // Self-test
  import("http").then(http => {
    const req = http.default.request(`http://127.0.0.1:${PORT}/`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        console.log("✅ Self-test response:", data);
        server.close();
      });
    });
    req.on("error", err => console.log("❌ Self-test failed:", err.message));
    req.end();
  });
});

server.on("error", err => console.error("Server error:", err));
