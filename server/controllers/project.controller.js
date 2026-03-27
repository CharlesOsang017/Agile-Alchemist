// Create Project
export const createProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      team_members,
      team_lead,
      progress,
      priority,
    } = req.body;

    //    Check if user has admin role for workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    if (
      !workspace.members.some(
        (member) => member.userId === userId && member.role === "ADMIN",
      )
    ) {
      return res
        .status(403)
        .json({
          message: "Not authorized to create project in this workspace",
        });
    }

    // Get Team Lead using email
    const teamLead = await prisma.user.findUnique({
      where: { email: team_lead },
      select: { id: true },
    });

    // Create Project
    const project = await prisma.project.create({
      data: {
        workspaceId,
        description,
        name,
        status,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        team_lead: teamLead?.id,
        progress,
        priority,
      },
    });

    // Add members to project if they are in the workspace
    if (team_members?.length > 0) {
      const membersToAdd = [];
      workspace.members.forEach((member) => {
        if (team_members.includes(member.user.email)) {
          membersToAdd.push(member.user.id);
        }
      });
      await prisma.projectMember.createMany({
        data: membersToAdd.map((memberId) => ({
          projectId: project.id,
          userId: memberId,
        })),
      });
    }

    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: { include: { user: true } },
        tasks: {
          include: { assignee: true, comments: { include: { user: true } } },
        },
        owner: true,
      },
    });

    return res
      .status(201)
      .json({
        message: "Project created successfully",
        project: projectWithMembers,
      });
  } catch (error) {
    console.log("Error creating project: ", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update Project
export const updateProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      team_members,
      team_lead,
      progress,
      priority,
    } = req.body;

    //    Check if user has admin role for workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    if (
      !workspace.members.some(
        (member) => member.userId === userId && member.role === "ADMIN",
      )
    ) {
      const project = await prisma.project.findUnique({
        where: {id}
      })
      if(!project){
        return res.status(404).json({message: "Project not found"})
      }else if(project.team_lead !== userId){
        return res.status(403).json({message: "Not authorized to update project in this workspace"})
      }
    }

    // Update Project
    const project = await prisma.project.update({
      where: { id},
      data: {
        workspaceId,
        description,
        name,
        status,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        progress,
        priority,
      },
    });

    return res
      .status(200)
      .json({ message: "Project updated successfully", project });
  } catch (error) {
    console.log("Error updating project: ", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Add member to project
export const addMember = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { projectId} = req.params;
    const {memberId} = req.body;

    // Check if user is project lead
    const project = await prisma.project.findUnique({
        where: {id: projectId},
        include: {members: {include: {user: true}}}
    })
    if(!project){
        return res.status(404).json({message: "Project not found"})
    }
    if(project.team_lead !== userId){
        return res.status(403).json({message: "Not authorized to add member to this project"})
    }

    // Check if user is already a member
    const existingMember = project.members.find((member) => member.userId === memberId)
    if(existingMember){
        return res.status(400).json({message: "User is already a member of this project"})
    }

    const user = await prisma.user.findUnique({
        where: {email: memberEmail}
    })
    if(!user){
        return res.status(404).json({message: "User not found"})
    }
    // Add member to project
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
      },
    });

    return res
      .status(201)
      .json({ message: "Member added successfully", member });
  } catch (error) {
    console.log("Error adding member: ", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};