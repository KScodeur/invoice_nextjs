"use server"

import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { InvoiceUpdateData, InvoiceLineCreateData, InvoiceLineUpdateData } from "@/type";

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
        if(!email) {
            throw new Error("Email manquant");
        }

        const user = await prisma.user.findUnique({
            where: {
                email :email
            }
        })

        if(!user){
            throw new Error("Utilisateur non trouvé");
        }

        const invoiceId = await generateUniqueId() as string

        const newInvoice = await prisma.invoice.create({
            data: {
                id: invoiceId,
                name : name,
                userId :user.id,
                issuerName:"",
                issuerAddress:"",
                clientName:"",
                clientAddress:"",
                invoiceDate:"",
                dueDate:"",
                vatActive: false,
                vatRate: 20
            }
        })

        return newInvoice;
    }catch(erreur){
        console.error(erreur);
        throw erreur;
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
        if (!email) {
            console.error("Erreur : Email invalide");
            return [];
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

        if (!user) {
            console.warn(`Utilisateur non trouvé pour l'email: ${email}`);
            return [];
        }

        if (!user.invoices || user.invoices.length === 0) {
            return [];
        }

        const today = new Date();

        const updateInvoices = await Promise.all(
            user.invoices.map(async (invoice) => {
                // 🔹 Vérification de `dueDate`
                if (!invoice.dueDate) {
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
        return [];
    }
}

//recuperer les informations de la facture a travers son ID avec contrôle d'accès

export async function getInvoiceById(invoiceId: string, userEmail: string){
    try{
        if (!userEmail) {
            console.error("Erreur : Email utilisateur manquant");
            return null;
        }

        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            console.error("Erreur : Utilisateur non trouvé");
            return null;
        }

        // Récupérer la facture
        const invoice = await prisma.invoice.findUnique({
            where: {id : invoiceId},
            include: {
                lines: true
            }
        })

        if(!invoice){
            console.error("Facture non trouvée");
            return null;
        }

        // Vérifier que la facture appartient à l'utilisateur
        if (invoice.userId !== user.id) {
            console.error("Accès non autorisé à cette facture");
            return null;
        }

        return invoice

    } catch (erreur) {
        console.error("Erreur dans getInvoiceById :", erreur);
        return null;
    }
}

// Mettre à jour une facture avec contrôle d'accès
export async function updateInvoice(invoiceId: string, userEmail: string, data: Partial<InvoiceUpdateData>){
    try{
        if (!userEmail) {
            throw new Error("Email utilisateur manquant");
        }

        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        // Vérifier que la facture existe et appartient à l'utilisateur
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!existingInvoice) {
            throw new Error("Facture non trouvée");
        }

        if (existingInvoice.userId !== user.id) {
            throw new Error("Accès non autorisé");
        }

        // Mettre à jour la facture
        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: data,
            include: { lines: true }
        });

        return updatedInvoice;
    } catch (erreur) {
        console.error("Erreur dans updateInvoice :", erreur);
        throw erreur;
    }
}

// Supprimer une facture avec contrôle d'accès
export async function deleteInvoice(invoiceId: string, userEmail: string){
    try{
        if (!userEmail) {
            throw new Error("Email utilisateur manquant");
        }

        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        // Vérifier que la facture existe et appartient à l'utilisateur
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!existingInvoice) {
            throw new Error("Facture non trouvée");
        }

        if (existingInvoice.userId !== user.id) {
            throw new Error("Accès non autorisé");
        }

        // Supprimer la facture (les lignes seront supprimées en cascade)
        await prisma.invoice.delete({
            where: { id: invoiceId }
        });

        return { success: true };
    } catch (erreur) {
        console.error("Erreur dans deleteInvoice :", erreur);
        throw erreur;
    }
}

// Changer le statut d'une facture
export async function updateInvoiceStatus(invoiceId: string, userEmail: string, status: number){
    try{
        if (!userEmail) {
            throw new Error("Email utilisateur manquant");
        }

        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        // Vérifier que la facture existe et appartient à l'utilisateur
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!existingInvoice) {
            throw new Error("Facture non trouvée");
        }

        if (existingInvoice.userId !== user.id) {
            throw new Error("Accès non autorisé");
        }

        // Mettre à jour le statut
        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: status },
            include: { lines: true }
        });

        return updatedInvoice;
    } catch (erreur) {
        console.error("Erreur dans updateInvoiceStatus :", erreur);
        throw erreur;
    }
}

// Ajouter une ligne de facturation
export async function addInvoiceLine(invoiceId: string, userEmail: string, lineData: InvoiceLineCreateData){
    try{
        if (!userEmail) {
            throw new Error("Email utilisateur manquant");
        }

        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        // Vérifier que la facture existe et appartient à l'utilisateur
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!existingInvoice) {
            throw new Error("Facture non trouvée");
        }

        if (existingInvoice.userId !== user.id) {
            throw new Error("Accès non autorisé");
        }

        // Créer la ligne de facturation
        const newLine = await prisma.invoiceLine.create({
            data: {
                description: lineData.description,
                quantity: lineData.quantity,
                unitPrice: lineData.unitPrice,
                invoiceId: invoiceId
            }
        });

        return newLine;
    } catch (erreur) {
        console.error("Erreur dans addInvoiceLine :", erreur);
        throw erreur;
    }
}

// Mettre à jour une ligne de facturation
export async function updateInvoiceLine(lineId: string, userEmail: string, lineData: Partial<InvoiceLineUpdateData>){
    try{
        if (!userEmail) {
            throw new Error("Email utilisateur manquant");
        }

        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        // Récupérer la ligne de facturation
        const existingLine = await prisma.invoiceLine.findUnique({
            where: { id: lineId },
            include: { invoice: true }
        });

        if (!existingLine || !existingLine.invoice) {
            throw new Error("Ligne de facturation non trouvée");
        }

        // Vérifier que la facture appartient à l'utilisateur
        if (existingLine.invoice.userId !== user.id) {
            throw new Error("Accès non autorisé");
        }

        // Mettre à jour la ligne de facturation
        const updatedLine = await prisma.invoiceLine.update({
            where: { id: lineId },
            data: lineData
        });

        return updatedLine;
    } catch (erreur) {
        console.error("Erreur dans updateInvoiceLine :", erreur);
        throw erreur;
    }
}

// Supprimer une ligne de facturation
export async function deleteInvoiceLine(lineId: string, userEmail: string){
    try{
        if (!userEmail) {
            throw new Error("Email utilisateur manquant");
        }

        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        // Récupérer la ligne de facturation
        const existingLine = await prisma.invoiceLine.findUnique({
            where: { id: lineId },
            include: { invoice: true }
        });

        if (!existingLine || !existingLine.invoice) {
            throw new Error("Ligne de facturation non trouvée");
        }

        // Vérifier que la facture appartient à l'utilisateur
        if (existingLine.invoice.userId !== user.id) {
            throw new Error("Accès non autorisé");
        }

        // Supprimer la ligne de facturation
        await prisma.invoiceLine.delete({
            where: { id: lineId }
        });

        return { success: true };
    } catch (erreur) {
        console.error("Erreur dans deleteInvoiceLine :", erreur);
        throw erreur;
    }
}

