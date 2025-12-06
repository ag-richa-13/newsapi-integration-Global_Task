import { Router } from "express";
import { showHome } from "../controllers/homeController";
import { getNewsById } from "../controllers/newsController";

const router = Router();

router.get("/", showHome);
router.get("/post/:num", getNewsById);

export default router;
