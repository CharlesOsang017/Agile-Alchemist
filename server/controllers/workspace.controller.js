// Get All workspaces for a specific User
export const getUserWorkspaces = async (req, res) => {
    try {
        const {userId} = req.auth();
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {some: {userId: userId}},
            },
            include: {
                members: {include: {user: true}},
                projects: {
                    include:{
                        tasks: {include: {assignee: true, comments: {include: {user: true}}}},
                        members: {include: {user: true}}
                    }
                },
                owner: true
                
            }
        });
        res.status(200).json(workspaces);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Add memeber to workspace
export const addMember = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {workspaceId, email, message, role} = req.body;

        // Check if user with email exists
        const user = await prisma.user.findUnique({
            where: {email},
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if(!workspaceId || !role){
            return res.status(400).json({ message: "Workspace ID and role are required" });
        }
        if(!["ADMIN", "MEMBER"].includes(role)){
            return res.status(400).json({ message: "Invalid role" });
        }
        // fetch workspace
        const workspace = await prisma.workspace.findUnique({where: {id: workspaceId}, include: {members: true}})
       if (!workspace){
        return res.status(404).json({ message: "Workspace not found" });
       }
       // check Creator has admin role
       if(!workspace.members.find((member)=>member.userId === userId && member.role === 'ADMIN')){
        return res.status(403).json({ message: "User is not admin" });
       }
       // check user is already a member
        const existingMember = workspace.members.find((member)=>member.userId === userId);
        if(existingMember){
            return res.status(400).json({ message: "User is already a member" });
        }
       // create workspace member
       const member = await prisma.workspaceMember.create({
        data: {
            userId: user.id,
            workspaceId: workspaceId,
            role: role,
            message
        }
       })     
        res.status(200).json({message: "Member added successfully", member});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

