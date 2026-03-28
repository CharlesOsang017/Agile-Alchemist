import express from "express";
import { addComment, getComments } from "../controllers/comment.controller.js";

const router = express.Router()

router.post("/", addComment)
router.get("/:taskId", getComments)

export default router