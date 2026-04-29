import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get("/", (req, res) => {
    res.send("Backend is running!!");
});

// main routes
app.use("/api/v1", routes);

// error handler (always last)
app.use(errorMiddleware);

export default app;