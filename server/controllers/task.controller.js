import { prisma } from "../db.js"
import { inngest } from "../inngest/index.js"

// Create Task
export const createTask = async(req, res) => {
    try {
        const {userId} = await req.auth()
        const {projectId, title, description, type, status, due_date, priority, assigneeId} = req.body
         
        const origin = req.get("origin")

        // Check if user is authorized to create task
        const project = await prisma.project.findUnique({
            where: {id: projectId},
            include: {members: {include: {user: true}}}
        })
        if(!project){
            return res.status(404).json({message: "Project not found"})
        }else if(project.team_lead !== userId){
            return res.status(403).json({message: "Not authorized to create task in this project"})
        }else if(assigneeId && !project.members.some((member) => member.userId === assigneeId)){
            return res.status(403).json({message: "Assignee is not a member of this project/Workspace"})
        }

        // Create Task
        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                status,
                due_date: due_date ? new Date(due_date) : null,
                priority,
                assigneeId,
            },
        })

        const taskWithAssignee = await prisma.task.findUnique({
            where: {id: task.id},
            include: {assignee: true}
        })
        await inngest.send({
            name: "app/task.assigned",
            data: {
                taskId: task.id,
                origin,
            }
        })

        return res.status(201).json({message: "Task created successfully", task: taskWithAssignee})
    } catch (error) {
        console.log("Error creating task: ", error)
        return res.status(500).json({message: "Internal server error", error: error.message})
    }
}

// Update task
export const updateTask = async(req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: {id: req.params.id}
        })
        if(!task){
            return res.status(404).json({message: "Task not found"})
        }
        const {userId} = await req.auth()

        // Check if user has admin role for the project
        const project = await prisma.project.findUnique({
            where: {id: task.projectId},
            include: {members: {include: {user: true}}}
        })
        if(!project){
            return res.status(404).json({message: "Project not found"})
        }else if(project.team_lead !== userId){
            return res.status(403).json({message: "Not authorized to update task in this project"})
        }

        // Update Task
        const updatedTask = await prisma.task.update({
            where: {id: req.params.id},
            data: req.body,
        })
        return res.status(200).json({message: "Task updated successfully", task: updatedTask})
    } catch (error) {
        console.log("Error updating task: ", error)
        return res.status(500).json({message: "Internal server error", error: error.message})
    }
}

// Delete Task
export const deleteTask = async(req, res) => {
    try {
        const {userId} = await req.auth()
        const {tasksIds} = req.body
        const tasks = await prisma.task.findMany({
            where: {id: {in: tasksIds}}
        })
        if(tasks.length === 0){
            return res.status(404).json({message: "Task not found"})
        }

        // Check if user has admin role for the project
        const project = await prisma.project.findUnique({
            where: {id: tasks[0].projectId},
            include: {members: {include: {user: true}}}
        })
        if(!project){
            return res.status(404).json({message: "Project not found"})
        }else if(project.team_lead !== userId){
            return res.status(403).json({message: "Not authorized to delete task in this project"})
        }

        // Delete Task
        const deletedTask = await prisma.task.deleteMany({
            where: {id: {in: tasksIds}},
        })
        return res.status(200).json({message: "Task deleted successfully"})
    } catch (error) {
        console.log("Error deleting task: ", error)
        return res.status(500).json({message: "Internal server error", error: error.message})
    }
}
