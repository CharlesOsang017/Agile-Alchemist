import { prisma } from "../db.js"

// Add comment
export const addComment =  async(req, res) => {
    try {
        const {userId} = await req.auth()
        const {taskId, content} = req.body

        // Check if user is project member
        const task = await prisma.task.findUnique({where: {id: taskId}})
        if(!task){
            return res.status(404).json({message: "Task not found"})
        }
        const project = await prisma.project.findUnique({
            where: {id: task.projectId},
            include: {members: {include: {user: true}}}
        })
        if(!project){
            return res.status(404).json({message: "Project not found"})
        }
        const member = project.members.find((member) => member.userId === userId)
        if(!member){
            return res.status(403).json({message: "You are not a member of this project"})
        }

        // Add comment
        const comment = await prisma.comment.create({
            data: {
                taskId,
                userId,
                content,
            },
            include: {
                user: true
            }
        })

        return res.status(201).json({message: "Comment added successfully", comment})
    } catch (error) {
        console.log("Error adding comment: ", error)
        return res.status(500).json({message: "Internal server error", error: error.message})
    }
}

// Get comments
export const getComments = async(req, res) => {
    try {
        const {taskId} = req.params
        const comments = await prisma.comment.findMany({
            where: {taskId},
            include: {user: true}
        })
        return res.status(200).json({comments})
    } catch (error) {
        console.log("Error getting comments: ", error)
        return res.status(500).json({message: "Internal server error", error: error.message})
    }
}

