import { Inngest } from "inngest";
import {prisma} from "../db.js";
import sendEmail from "../config/nodemailer.js";



// Create a client to send and receive events
export const inngest = new Inngest({ id: "agile-alchemist" });

// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-clerk', triggers: [{ event: 'clerk/user.created' }] }, 
  async ({ event }) => {
    const { data } = event;
    await prisma.user.create({
      data: {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email_addresses[0]?.email_address,
        image: data.image_url,
      }
    });
  }
);

// Inngest Function to delete user from database
const syncUserDeletion = inngest.createFunction(
  { id: 'delete-user-from-clerk', triggers: [{ event: 'clerk/user.deleted' }] },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.delete({
      where: {
        id: data.id,
      }
    });
  }
);

// Inngest Function to Update user data in the database
const syncUserUpdation = inngest.createFunction(
  { id: 'update-user-from-clerk', triggers: [{ event: 'clerk/user.updated' }] },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        name: `${data.first_name} ${data.last_name}`,
        email: data.email_addresses[0]?.email_address,
        image: data.image_url,
      }
    });
  }
);


// Inngest Function to save workspace data to a database
const syncWorkspaceCreation = inngest.createFunction(
  { id: 'sync-workspace-from-clerk', triggers: [{ event: 'clerk/organization.created' }] },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      }
    });
    // Add creator as ADMIN member
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN",
      }
    });
  }
);

// Inngest Function to update workspace data in the database
const syncWorkspaceUpdation = inngest.createFunction(
  { id: 'update-workspace-from-clerk', triggers: [{ event: 'clerk/organization.updated' }] },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      }
    });
  }
);

// Inngest Function to delete workspace from database
const syncWorkspaceDeletion = inngest.createFunction(
  { id: 'delete-workspace-from-clerk', triggers: [{ event: 'clerk/organization.deleted' }] },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.delete({
      where: {
        id: data.id,
      }
    });
  }
);


// Inngest Function to save workspace members to the database

const syncWorkspaceMembersCreation = inngest.createFunction(
  { id: 'sync-workspace-members-from-clerk', triggers: [{ event: 'clerk/organizationInvitation.accepted' }] },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role_name).toUpperCase(),
      }
    });
  }
);

// Inngest Function to send Email on user creation
const sendTaskAssignmentEmail = inngest.createFunction(
  { id: 'send-task-assignment-email', triggers: [{ event: 'app/task.assigned' }] },
  async ({ event, step }) => {
    const { data } = event;
    const {taskId, origin} = event.data;    
   
      const task = await prisma.task.findUnique({
        where: {
          id: taskId,
        },
        include: {assignee: true, project: true}
      });
      await sendEmail({
        to: task.assignee.email,
        subject: `New Task Assignement in ${task.project.name}`,
        body: `Hi ${task.assignee.name}, You have been assigned a new task: ${task.title},
                Due Date: ${new Date(task.due_date).toLocaleDateString()}
                <a href="${origin}">View Task</a>
                <p>Please make sure to review it before due date</p>
                `
      });
      if(new Date(task.due_date).toLocaleDateString() !== new Date().toDateString()){
        await step.sleepUntil('wait-for-the-due-date', new Date(task.due_date))
        if(!task) return;
        if(task.status !== 'DONE'){
          await step.run("send-task-reminder-email", async()=>{
            await sendEmail({
              to: task.assignee.email,
              subject: `Task Reminder: ${task.title}`,
              body: `Hi ${task.assignee.name}, This is a reminder that your task "${task.title}" is due today.`
            })
          })
        }
      }

  }
);
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceUpdation,
  syncWorkspaceDeletion,
  syncWorkspaceMembersCreation,
  sendTaskAssignmentEmail
];