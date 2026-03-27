import express from "express";
import { addMember, createProject, updateProject } from "../controllers/project.controller.js";


const router = express.Router()

router.post("/", createProject)
router.put("/", updateProject)
router.post("/:projectId/add-member", addMember)

export default router