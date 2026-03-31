'use client'

import { getInvoiceById } from '@/app/actions'
import { Invoice, AppError } from '@/type'
import React, { useEffect, useState } from 'react'
import Wrapper from '@/app/components/Wrapper'
import { CheckCircle, Clock, FileText, XCircle, ArrowLeft, Printer, Download, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import InvoiceEditForm from '@/app/components/InvoiceEditForm'
import { deleteInvoice } from '@/app/actions'

const getStatusBadge = (status: number) => {
  switch (status) {
    case 1:
      return (
        <div className='badge badge-lg flex items-center gap-2'>
          <FileText className='w-4' />
          Brouillon
        </div>
      )
    case 2:
      return (
        <div className='badge badge-lg badge-warning flex items-center gap-2'>
          <Clock className='w-4' />
          En attente
        </div>
      )
    case 3:
      return (
        <div className='badge badge-lg badge-success flex items-center gap-2'>
          <CheckCircle className='w-4' />
          Payée
        </div>
      )
    case 4:
      return (
        <div className='badge badge-lg flex items-center gap-2'>
          <FileText className='w-4' />
          Annulée
        </div>
      )
    case 5:
      return (
        <div className='badge badge-lg flex items-center gap-2'>
          <XCircle className='w-4' />
          Impayée
        </div>
      )
    default:
      return (
        <div className='badge badge-lg flex items-center gap-2'>
          <XCircle className='w-4' />
          Indéfini
        </div>
      )
  }
}

const InvoicePage = ({ params }: { params: Promise<{ invoiceId: string }> }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [initialInvoice, setInitialInvoice] = useState<Invoice | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Unwrap the params Promise using React.use()
  const resolvedParams = React.use(params)
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress as string

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setError('')
        setIsLoading(true)

        if (!email) {
          throw new Error('Email utilisateur manquant')
        }

        const fetchedInvoice = await getInvoiceById(resolvedParams.invoiceId, email)
        if (fetchedInvoice) {
          setInvoice(fetchedInvoice)
          setInitialInvoice(fetchedInvoice)
        } else {
          throw new Error('Facture non trouvée')
        }
      } catch (err: unknown) {
        console.error(err)
        setError((err as AppError).message || 'Erreur lors du chargement de la facture')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoice()
  }, [resolvedParams.invoiceId, email])

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setInvoice(initialInvoice)
    setError('')
  }

  const handleSave = () => {
    setIsEditing(false)
    setSuccessMessage('Facture mise à jour avec succès !')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      return
    }

    try {
      setError('')
      if (!email) {
        throw new Error('Email utilisateur manquant')
      }

      await deleteInvoice(invoice?.id || '', email)
      window.location.href = '/'
    } catch (err: unknown) {
      console.error(err)
      setError((err as AppError).message || 'Erreur lors de la suppression de la facture')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Pour l'instant, c'est un placeholder. Dans une implémentation complète,
    // on générerait un PDF ici
    alert('Téléchargement PDF - Fonctionnalité à implémenter')
  }

  if (isLoading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg text-accent"></span>
        </div>
      </Wrapper>
    )
  }

  if (!invoice) {
    return (
      <Wrapper>
        <div className="alert alert-error">
          <span>{error || 'Facture non trouvée'}</span>
        </div>
      </Wrapper>
    )
  }

  const calculateTotal = () => {
    const totalHT = invoice?.lines?.reduce((acc, line) => {
      const quantity = line.quantity ?? 0;
      const unitPrice = line.unitPrice ?? 0;
      return acc + quantity * unitPrice
    }, 0) || 0

    const totalVAT = invoice.vatActive ? totalHT * (invoice.vatRate / 100) : 0
    const totalTTC = totalHT + totalVAT

    return { totalHT, totalVAT, totalTTC }
  }

  const { totalHT, totalVAT, totalTTC } = calculateTotal()

  if (isEditing) {
    return (
      <Wrapper>
        <div className="mb-4">
          <Link href="/" className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4" />
            Retour
          </Link>
        </div>
        <InvoiceEditForm
          invoice={invoice}
          email={email}
          onSave={handleSave}
          onCancel={handleCancelEdit}
        />
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="space-y-6">
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

        {/* Header avec boutons d'action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Link href="/" className="btn btn-ghost btn-sm gap-2 self-start">
            <ArrowLeft className="w-4" />
            Retour
          </Link>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button className="btn btn-sm btn-outline gap-2 flex-1 md:flex-none" onClick={handleEdit}>
              <Edit className="w-4" />
              Modifier
            </button>
            <button className="btn btn-sm btn-outline gap-2 flex-1 md:flex-none" onClick={handlePrint}>
              <Printer className="w-4" />
              Imprimer
            </button>
            <button className="btn btn-sm btn-outline gap-2 flex-1 md:flex-none" onClick={handleDownload}>
              <Download className="w-4" />
              Télécharger
            </button>
            <button className="btn btn-sm btn-error btn-outline gap-2 flex-1 md:flex-none" onClick={handleDelete}>
              <Trash2 className="w-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Informations principales de la facture */}
        <div className="bg-base-200/90 p-6 rounded-xl shadow">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{invoice.name}</h1>
              <div className="text-sm text-base-content/70">
                FACT-{invoice.id}
              </div>
            </div>
            {getStatusBadge(invoice.status)}
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            {/* Émetteur */}
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-accent">Émetteur</h3>
              <div className="bg-base-300/50 p-4 rounded-lg">
                <div className="font-semibold">{invoice.issuerName || 'Non spécifié'}</div>
                <div className="text-sm text-base-content/70 mt-1 break-words">
                  {invoice.issuerAddress || 'Adresse non spécifiée'}
                </div>
              </div>
            </div>

            {/* Client */}
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-accent">Client</h3>
              <div className="bg-base-300/50 p-4 rounded-lg">
                <div className="font-semibold">{invoice.clientName || 'Non spécifié'}</div>
                <div className="text-sm text-base-content/70 mt-1 break-words">
                  {invoice.clientAddress || 'Adresse non spécifiée'}
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="bg-base-300/50 p-4 rounded-lg">
              <div className="text-sm text-base-content/70">Date de facturation</div>
              <div className="font-semibold">{invoice.invoiceDate || 'Non spécifiée'}</div>
            </div>
            <div className="bg-base-300/50 p-4 rounded-lg">
              <div className="text-sm text-base-content/70">Date d&apos;échéance</div>
              <div className="font-semibold">{invoice.dueDate || 'Non spécifiée'}</div>
            </div>
          </div>
        </div>

        {/* Lignes de facturation */}
        <div className="bg-base-200/90 p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Détails de la facture</h2>

          {invoice.lines && invoice.lines.length > 0 ? (
            <>
              {/* Vue mobile - Cartes pour chaque ligne */}
              <div className="md:hidden space-y-3">
                {invoice.lines.map((line, index) => (
                  <div key={line.id || index} className="bg-base-300/50 p-4 rounded-lg">
                    <div className="font-semibold mb-2">{line.description || 'Sans description'}</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-base-content/70">Quantité</div>
                        <div className="font-semibold">{line.quantity || 0}</div>
                      </div>
                      <div>
                        <div className="text-base-content/70">Prix unitaire</div>
                        <div className="font-semibold">{(line.unitPrice || 0).toFixed(2)} £</div>
                      </div>
                      <div>
                        <div className="text-base-content/70">Total</div>
                        <div className="font-semibold text-accent">
                          {((line.quantity || 0) * (line.unitPrice || 0)).toFixed(2)} £
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vue desktop - Tableau */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="text-right">Quantité</th>
                      <th className="text-right">Prix unitaire</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((line, index) => (
                      <tr key={line.id || index}>
                        <td>{line.description || 'Sans description'}</td>
                        <td className="text-right">{line.quantity || 0}</td>
                        <td className="text-right">{(line.unitPrice || 0).toFixed(2)} £</td>
                        <td className="text-right font-semibold">
                          {((line.quantity || 0) * (line.unitPrice || 0)).toFixed(2)} £
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-base-content/50">
              Aucune ligne de facturation
            </div>
          )}

          {/* Totaux */}
          <div className="mt-6">
            <div className="w-full md:w-80 ml-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">Total HT</span>
                <span className="font-semibold">{totalHT.toFixed(2)} £</span>
              </div>

              {invoice.vatActive && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">
                    TVA ({invoice.vatRate}%)
                  </span>
                  <span className="font-semibold">{totalVAT.toFixed(2)} £</span>
                </div>
              )}

              <div className="divider my-2"></div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total TTC</span>
                <span className="font-bold text-2xl text-accent">
                  {totalTTC.toFixed(2)} £
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="text-center text-sm text-base-content/50">
          <p>Merci pour votre confiance !</p>
        </div>
      </div>
    </Wrapper>
  )
}

export default InvoicePage
