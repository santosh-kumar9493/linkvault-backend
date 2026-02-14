require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const runCleanup = require("./jobs/cleanup");

const app = express();

connectDB();
connectDB().then(() => {
  runCleanup();
});


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());


app.get("/", (req, res) => {
  res.send("LinkVault API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));


app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/content", require("./routes/contentRoutes"));

