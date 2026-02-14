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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

app.set("trust proxy", 1);

app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.get("/", (req, res) => {
  res.send("LinkVault API running");
});

app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/content", require("./routes/contentRoutes"));

