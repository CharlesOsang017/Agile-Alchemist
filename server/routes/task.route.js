import express from "express";
import {} from "../middlewares/auth.middleware.js";

const router = express.Router()

router.post("/", createTask)
router.put("/:id", updateTask)
router.delete("/delete", deleteTask)

export default router
