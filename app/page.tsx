"use client"
import Image from "next/image";
import Wrapper from "./components/Wrapper";
import { Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { createEmptyInvoice, getInvoiceByEmail } from "./actions";
import { useUser } from "@clerk/nextjs";
import confetti from "canvas-confetti"
import { Invoice } from "@/type";
import InvoiceComponent from "./components/InvoiceComponent";

export default function Home() {
  const {user} = useUser();
  const [invoiceName, setInvoiceName] = useState("")
  const [isNameValid, setIsNameValid] = useState(true)
  const email = user?.primaryEmailAddress?.emailAddress as string
  const [invoices, setInvoices] = useState<Invoice[]>([])


  useEffect(()=>{
    setIsNameValid(invoiceName.length <=60)
  },[invoiceName])

 

  // la fonction qui appelle a l'action pour creer une facture
  const handleCreateInvoice = async () =>{
    try{
      if(email){
        await createEmptyInvoice(email, invoiceName);      
      }
      fetchInvoices()
      setInvoiceName("")
      const modal =document.getElementById('my_modal_3') as HTMLDialogElement
      if(modal){
        modal.close()
      }
      //Affiché notre confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: {y: 0.6},
        zIndex: 9999
      })


    }catch(erreur){
      console.error("Erreur lors de la création de la facture :", erreur)
    }
  }
  // la fonction qui appelle a l'action pour affiché les factures
  const fetchInvoices = async () =>{
    try{
        if(!email) return
        const data = await getInvoiceByEmail(email)
        if(data)
        setInvoices(data)
    }catch(erreur){
      console.error("Erreur lors du chargement des factures :", erreur)
    }
  }

  useEffect(()=>{
    if(email){
      fetchInvoices()
    }
    
  },[email])
  return (
    <Wrapper>
      <div className="flex flex-col space-y-4">
        <h1 className="text-lg font-bold">Mes factures</h1>
        {/* Laliste des factures existant */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* Création de factures */}
          <div className="cursor-pointer border border-accent rounded-xl flex flex-col justify-center items-center p-5" 
            onClick={()=>(document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}
            ><div className="font-bold text-accent">
              Créer une facture
            </div>
            <div className="bg-accent-content text-accent rounded-full p-2 mt-2">
                <Layers  className=''/>
            </div>
                       
          </div>
          {/* Liste des factures */}
          {invoices.length > 0 && (invoices.map((invoice, index)=>(
            <div key={index }>
              <InvoiceComponent invoice={invoice} index={0}/>
            </div>
          )))}

        </div>
        
        <dialog id="my_modal_3" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Nouvelle Facture</h3>
            <input 
              type="text" 
              placeholder="Nom de la facture (max 60 caractères)" 
              className="input input-bordered w-full my-4"
              value={invoiceName}
              onChange={(e)=> setInvoiceName(e.target.value)}             
              
            />
            {!isNameValid && <p className="mb-4 text-sm text-red-500 italic">Le nom de la facture ne peut pas dépasser 60 caractères.</p>}
            <button className="btn btn-accent" 
            disabled={!isNameValid || invoiceName.length === 0}
            onClick={handleCreateInvoice}
            >
              Créer
            </button>
          </div>
        </dialog>
      </div>
      
    </Wrapper>
  );
}
