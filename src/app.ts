import express from "express";
import homeRoutes from "./routes/homeRoutes";
import newsRoutes from "./routes/newsRoutes";

const app = express();

app.use("/", homeRoutes);
app.use("/news", newsRoutes);

export default app;
