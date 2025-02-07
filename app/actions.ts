"use server"

import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

// Creer l'user s'il n'existe pas déjà
export async function checkAndAddUser(email: string, name: string){
    if(!email) return;
    try{
        // console.log("Payload envoyé :", email, name );

        const existingUser = await prisma.user.findUnique({
            where:{
                email:email
            }
        });
        //console.log("Utilisateur trouvé : ", existingUser);
        if(!existingUser && name){
           // console.log("le name:", name)
            await prisma.user.create({
                data:{
                    name,
                    email
                }
            })
        }
    }catch(erreur){
        console.error(erreur)
    }
}

//generer des id uniques de la facture
const generateUniqueId = async () =>{
    let uniqueId;
    let isUnique = false;

    while(!isUnique){
        uniqueId = randomBytes(3).toString('hex')

        const existingInvoice = await prisma.invoice.findUnique({
            where : {
                id: uniqueId
            }
        })

        if(!existingInvoice){
            isUnique = true
        }
    }
    return uniqueId    
}

// creer une facture vide
export async function createEmptyInvoice(email: string, name: string){
    try{

        const user = await prisma.user.findUnique({
            where: {
                email :email
            }
        })

        const invoiceId = await generateUniqueId() as string

        if(user){
            const newInvoice = await prisma.invoice.create({
                data: {
                    id: invoiceId,
                    name : name,
                    userId :user?.id,
                    issuerName:""    ,
                    issuerAddress:"" ,
                    clientName :""   ,
                    clientAddress :"",
                    invoiceDate:""   ,
                    dueDate:""       ,
                    vatActive :false    ,
                    vatRate:20     
                }
            })
        }
    }catch(erreur){
        console.error(erreur)
    }

}

// Recuperer les fonction de l'user connecté en se basant sur l'email

// export async function getInvoiceByEmail(email:string){
//     try{
    
//         const user = await prisma.user.findUnique({
//             where: {
//                 email: email
//             },
//             include :{
//                 invoices : {
//                     include :{
//                         lines: true,
//                     }
//                 }
//             }
//         })

//         //Statuts possible
//             // 1:Brouillon
//             // 2:En attente
//             // 3:Payée
//             // 4:Annulée
//             // 5:Impayé
//         if(user){
//             //pour pouvoir verifié et donné une statut a la facture 
//             const today = new Date()
//             const updateInvoices = await Promise.all(
//                 user.invoices.map(async (invoice)=>{
//                     const dueDate = new Date(invoice.dueDate)
//                     if(dueDate < today && invoice.status == 2){
//                         //update de l'invoice avec son nouvel statut
//                         const updateInvoice = await prisma.invoice.update({
//                             where: {id: invoice.id},
//                             data : {status : 5},
//                             include : {lines : true}
//                         })
//                         return updateInvoice
//                     }
//                     return invoice
//                 })
//             )
//             return updateInvoices
//         }
//     }catch(erreur){
//         console.error(erreur)
//     }
// }

export async function getInvoiceByEmail(email: string) {
    try {
        // 🔹 Vérifier que l'email est valide
        console.log("l'email :", email);
        
        if (!email) {
            console.error("Erreur : Email invalide");
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                invoices: {
                    include: {
                        lines: true,
                    }
                }
            }
        });

        if (!user || !user.invoices || user.invoices.length === 0) {
            console.log("Aucune facture trouvée pour cet utilisateur.");
            return [];
        }

        const today = new Date();

        const updateInvoices = await Promise.all(
            user.invoices.map(async (invoice) => {
                // 🔹 Vérification de `dueDate`
                if (!invoice.dueDate) {
                    console.warn(`Facture sans dueDate : ID ${invoice.id}`);
                    return invoice; // On la garde inchangée
                }

                const dueDate = new Date(invoice.dueDate);

                // 🔹 Vérification des conditions d'update
                if (dueDate < today && invoice.status === 2) {
                    // 🔹 Vérification de `invoice.id`
                    if (!invoice.id) {
                        console.error("Erreur : Invoice sans ID", invoice);
                        return invoice;
                    }

                    try {
                        const updateInvoice = await prisma.invoice.update({
                            where: { id: invoice.id },
                            data: { status: 5 },
                            include: { lines: true }
                        });

                        return updateInvoice;
                    } catch (updateError) {
                        console.error(`Erreur lors de la mise à jour de la facture ID ${invoice.id} :`, updateError);
                        return invoice;
                    }
                }

                return invoice;
            })
        );

        return updateInvoices;
    } catch (erreur) {
        console.error("Erreur dans getInvoiceByEmail :", erreur);
        return null;
    }
}

//recuperer les informations de la facture a travers son ID

export async function getInvoiceById(invoiceId: string){
    try{
        const invoice = await prisma.invoice.findUnique({
            where: {id : invoiceId},
            include: {
                lines: true
            }
        })
        if(!invoice){
            throw new Error("Facture non trouvé")
        }

        return invoice

    } catch (erreur) {
        console.error("Erreur dans getInvoiceById :", erreur);
        return null;
    }
}


