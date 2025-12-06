import { Router } from "express";
import {
  fetchNews,
  listNews,
  getNewsById,
} from "../controllers/newsController";

const router = Router();

router.get("/fetch", fetchNews);
router.get("/list", listNews);
router.get("/:id", getNewsById);

export default router;
