import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import hospitalResolution from "./middlewares/hospitalResolution";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(hospitalResolution);

app.use("/api", router);

export default app;
