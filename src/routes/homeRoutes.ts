import { Router } from "express";
import { showHome } from "../controllers/homeController";

const router = Router();

router.get("/", showHome);

export default router;
