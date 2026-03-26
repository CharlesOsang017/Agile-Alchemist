import { Inngest } from "inngest";
import prismaConfig from "../configs/prisma.config.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "agile-alchemist" });

// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-clerk'},
    {event: 'clerk/user.created'},
    async({event})=>{
        const {data} = event
        await prismaConfig.user.create({
            data: {
                id: data.id,
                name: data.first_name + " " + data.last_name,
                email: data.email.email_addresses[0]?.email_address,
                image: data.image_url,
            }
        })
    }
)

// Inngest Function to delete user from database
const syncUserDeletion = inngest.createFunction(
    {id: 'delete-user-with-clerk'},
    {event: 'clerk/user.deleted'},
    async({event})=>{
        const {data} = event
        await prismaConfig.user.delete({
            where: {
                id: data.id,
            }
        })
    }
)

// Inngest Function to Update user data in the database
const syncUserUpdation = inngest.createFunction(
    {id: 'update-user-from-clerk'},
    {event: 'clerk/user.updated'},
    async({event})=>{
        const {data} = event
        await prismaConfig.user.update({
            where: {
                id: data.id,
            },
            data: {
                name: data.first_name + " " + data.last_name,
                email: data.email.email_addresses[0]?.email_address,
                image: data.image_url,
            }
        })
    }
)
// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];