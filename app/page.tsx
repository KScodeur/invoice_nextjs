"use client"
import Image from "next/image";
import Wrapper from "./components/Wrapper";
import { Layers, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createEmptyInvoice, getInvoiceByEmail, deleteInvoice } from "./actions";
import { useUser } from "@clerk/nextjs";
import confetti from "canvas-confetti"
import { Invoice } from "@/type";
import InvoiceComponent from "./components/InvoiceComponent";

export default function Home() {
  const {user} = useUser();
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date")

  // Formulaire de création complet
  const [newInvoice, setNewInvoice] = useState({
    name: "",
    issuerName: "",
    issuerAddress: "",
    clientName: "",
    clientAddress: "",
    invoiceDate: "",
    dueDate: "",
    vatActive: false,
    vatRate: 20
  })

  const email = user?.primaryEmailAddress?.emailAddress as string
  const [invoices, setInvoices] = useState<Invoice[]>([])


  useEffect(()=>{
    if(email){
      fetchInvoices()
    }
  },[email])

  // la fonction qui appelle a l'action pour creer une facture
  const handleCreateInvoice = async () =>{
    try{
      setError("")
      setIsLoading(true)

      if(!email){
        throw new Error("Email utilisateur manquant")
      }

      if(!newInvoice.name){
        throw new Error("Le nom de la facture est requis")
      }

      // Validation basique
      if(newInvoice.vatRate < 0 || newInvoice.vatRate > 100){
        throw new Error("Le taux de TVA doit être entre 0 et 100")
      }

      await createEmptyInvoice(email, newInvoice.name)

      setSuccessMessage("Facture créée avec succès !")

      // Réinitialiser le formulaire
      setNewInvoice({
        name: "",
        issuerName: "",
        issuerAddress: "",
        clientName: "",
        clientAddress: "",
        invoiceDate: "",
        dueDate: "",
        vatActive: false,
        vatRate: 20
      })

      const modal =document.getElementById('create_invoice_modal') as HTMLDialogElement
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

      fetchInvoices()

      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccessMessage(""), 3000)

    }catch(erreur: any){
      console.error("Erreur lors de la création de la facture :", erreur)
      setError(erreur.message || "Erreur lors de la création de la facture")
    } finally {
      setIsLoading(false)
    }
  }

  // la fonction qui appelle a l'action pour affiché les factures
  const fetchInvoices = async () =>{
    try{
      if(!email) return

      setIsLoading(true)
      setError("")

      const data = await getInvoiceByEmail(email)
      if(data)
        setInvoices(data)

    }catch(erreur: any){
      console.error("Erreur lors du chargement des factures :", erreur)
      setError(erreur.message || "Erreur lors du chargement des factures")
    } finally {
      setIsLoading(false)
    }
  }

  // Supprimer une facture
  const handleDeleteInvoice = async (invoiceId: string) => {
    if(!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      return
    }

    try{
      setError("")
      setIsLoading(true)

      if(!email){
        throw new Error("Email utilisateur manquant")
      }

      await deleteInvoice(invoiceId, email)

      setSuccessMessage("Facture supprimée avec succès !")
      fetchInvoices()

      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccessMessage(""), 3000)

    }catch(erreur: any){
      console.error("Erreur lors de la suppression de la facture :", erreur)
      setError(erreur.message || "Erreur lors de la suppression de la facture")
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrer et trier les factures
  const getFilteredAndSortedInvoices = () => {
    let filtered = invoices

    // Filtrer par recherche
    if(searchTerm){
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(invoice =>
        invoice.name.toLowerCase().includes(term) ||
        invoice.id.toLowerCase().includes(term) ||
        invoice.clientName?.toLowerCase().includes(term)
      )
    }

    // Trier
    const sorted = [...filtered].sort((a, b) => {
      switch(sortBy){
        case "date":
          return new Date(b.invoiceDate || "").getTime() - new Date(a.invoiceDate || "").getTime()
        case "amount":
          const totalA = (a.lines || []).reduce((sum, line) => sum + (line.quantity || 0) * (line.unitPrice || 0), 0)
          const totalB = (b.lines || []).reduce((sum, line) => sum + (line.quantity || 0) * (line.unitPrice || 0), 0)
          return totalB - totalA
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return sorted
  }

  return (
    <Wrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Mes factures</h1>
          <button
            className="btn btn-accent btn-sm gap-2"
            onClick={()=>(document.getElementById('create_invoice_modal') as HTMLDialogElement).showModal()}
          >
            <Layers className="w-4"/>
            Nouvelle facture
          </button>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <span>{successMessage}</span>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom, ID ou client..."
            className="input input-bordered flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="select select-bordered"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "amount" | "name")}
          >
            <option value="date">Trier par date</option>
            <option value="amount">Trier par montant</option>
            <option value="name">Trier par nom</option>
          </select>
        </div>

        {/* État de chargement */}
        {isLoading && !invoices.length && (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg text-accent"></span>
          </div>
        )}

        {/* Laliste des factures existant */}
        {!isLoading && getFilteredAndSortedInvoices().length === 0 && (
          <div className="text-center py-12 text-base-content/50">
            <Layers className="w-16 h-16 mx-auto mb-4 opacity-50"/>
            <p>Aucune facture trouvée</p>
            <p className="text-sm mt-2">Créez votre première facture en cliquant sur le bouton "Nouvelle facture"</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getFilteredAndSortedInvoices().map((invoice)=>(
            <div key={invoice.id} className="relative group">
              <button
                onClick={() => handleDeleteInvoice(invoice.id)}
                className="absolute top-2 right-2 z-10 btn btn-error btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3"/>
              </button>
              <InvoiceComponent invoice={invoice} index={0}/>
            </div>
          ))}
        </div>

        {/* Modal de création de facture */}
        <dialog id="create_invoice_modal" className="modal">
          <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>

            <h3 className="font-bold text-lg mb-4">Nouvelle Facture</h3>

            <div className="space-y-4">
              {/* Informations générales */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nom de la facture *</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Facture client ABC"
                  className="input input-bordered"
                  value={newInvoice.name}
                  onChange={(e) => setNewInvoice({...newInvoice, name: e.target.value})}
                  required
                />
                {newInvoice.name.length > 60 && <p className="text-sm text-red-500 mt-1">Le nom ne peut pas dépasser 60 caractères.</p>}
              </div>

              {/* Informations émetteur */}
              <div className="space-y-2">
                <h4 className="font-semibold text-accent">Émetteur</h4>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nom de l'émetteur</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Votre nom ou entreprise"
                    className="input input-bordered"
                    value={newInvoice.issuerName}
                    onChange={(e) => setNewInvoice({...newInvoice, issuerName: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Adresse de l'émetteur</span>
                  </label>
                  <textarea
                    placeholder="Votre adresse"
                    className="textarea textarea-bordered"
                    value={newInvoice.issuerAddress}
                    onChange={(e) => setNewInvoice({...newInvoice, issuerAddress: e.target.value})}
                  />
                </div>
              </div>

              {/* Informations client */}
              <div className="space-y-2">
                <h4 className="font-semibold text-accent">Client</h4>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nom du client</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nom du client ou entreprise"
                    className="input input-bordered"
                    value={newInvoice.clientName}
                    onChange={(e) => setNewInvoice({...newInvoice, clientName: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Adresse du client</span>
                  </label>
                  <textarea
                    placeholder="Adresse du client"
                    className="textarea textarea-bordered"
                    value={newInvoice.clientAddress}
                    onChange={(e) => setNewInvoice({...newInvoice, clientAddress: e.target.value})}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date de facturation</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={newInvoice.invoiceDate}
                    onChange={(e) => setNewInvoice({...newInvoice, invoiceDate: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date d'échéance</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                  />
                </div>
              </div>

              {/* TVA */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Activer la TVA</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-accent"
                    checked={newInvoice.vatActive}
                    onChange={(e) => setNewInvoice({...newInvoice, vatActive: e.target.checked})}
                  />
                </label>
                {newInvoice.vatActive && (
                  <div className="mt-2">
                    <label className="label">
                      <span className="label-text">Taux de TVA (%)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input input-bordered"
                      value={newInvoice.vatRate}
                      onChange={(e) => setNewInvoice({...newInvoice, vatRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                )}
              </div>

              <button
                className="btn btn-accent w-full"
                disabled={isLoading || newInvoice.name.length > 60 || !newInvoice.name}
                onClick={handleCreateInvoice}
              >
                {isLoading ? <span className="loading loading-spinner"></span> : "Créer la facture"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>

    </Wrapper>
  );
}
