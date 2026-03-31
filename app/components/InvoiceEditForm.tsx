'use client'

import { useState } from 'react'
import { updateInvoice } from '@/app/actions'
import { Invoice, AppError } from '@/type'
import { Save, X} from 'lucide-react'

type InvoiceEditFormProps = {
  invoice: Invoice
  email: string
  onSave: () => void
  onCancel: () => void
}

const InvoiceEditForm: React.FC<InvoiceEditFormProps> = ({ invoice, email, onSave, onCancel }) => {
  const [editedInvoice, setEditedInvoice] = useState({
    name: invoice.name,
    issuerName: invoice.issuerName,
    issuerAddress: invoice.issuerAddress,
    clientName: invoice.clientName,
    clientAddress: invoice.clientAddress,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    vatActive: invoice.vatActive,
    vatRate: invoice.vatRate,
    status: invoice.status
  })

  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setEditedInvoice({
      ...editedInvoice,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    })
  }

  const handleSubmit = async () => {
    try {
      setError('')
      setIsSaving(true)

      // Validation
      if (!editedInvoice.name || editedInvoice.name.trim() === '') {
        throw new Error('Le nom de la facture est requis')
      }

      if (editedInvoice.name.length > 60) {
        throw new Error('Le nom de la facture ne peut pas dépasser 60 caractères')
      }

      if (editedInvoice.vatRate < 0 || editedInvoice.vatRate > 100) {
        throw new Error('Le taux de TVA doit être entre 0 et 100')
      }

      // Mise à jour de la facture
      await updateInvoice(invoice.id, email, {
        name: editedInvoice.name,
        issuerName: editedInvoice.issuerName,
        issuerAddress: editedInvoice.issuerAddress,
        clientName: editedInvoice.clientName,
        clientAddress: editedInvoice.clientAddress,
        invoiceDate: editedInvoice.invoiceDate,
        dueDate: editedInvoice.dueDate,
        vatActive: editedInvoice.vatActive,
        vatRate: editedInvoice.vatRate,
        status: editedInvoice.status
      })

      // Note: Les lignes seraient gérées séparément dans une implémentation complète
      // Pour l'instant, on sauvegarde seulement les informations de base de la facture

      onSave()
    } catch (err: unknown) {
      const error = err as AppError;
      setError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false)
    }
  }


  return (
    <div className="space-y-6">
      {/* Message d'erreur */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Informations générales */}
      <div className="bg-base-200/90 p-6 rounded-xl shadow">
        <h3 className="text-xl font-bold mb-4">Informations générales</h3>

        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Nom de la facture *</span>
            </label>
            <input
              type="text"
              name="name"
              className="input input-bordered"
              value={editedInvoice.name}
              onChange={handleChange}
              required
            />
            {editedInvoice.name.length > 60 && (
              <p className="text-sm text-red-500 mt-1">
                Le nom ne peut pas dépasser 60 caractères ({editedInvoice.name.length}/60)
              </p>
            )}
          </div>

          {/* Statut */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Statut</span>
            </label>
            <select
              name="status"
              className="select select-bordered"
              value={editedInvoice.status}
              onChange={handleChange}
            >
              <option value={1}>Brouillon</option>
              <option value={2}>En attente</option>
              <option value={3}>Payée</option>
              <option value={4}>Annulée</option>
              <option value={5}>Impayée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Émetteur et Client */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Émetteur */}
        <div className="bg-base-200/90 p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-4 text-accent">Émetteur</h3>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom de l&apos;émetteur</span>
              </label>
              <input
                type="text"
                name="issuerName"
                className="input input-bordered"
                value={editedInvoice.issuerName}
                onChange={handleChange}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Adresse de l&apos;émetteur</span>
              </label>
              <textarea
                name="issuerAddress"
                className="textarea textarea-bordered"
                value={editedInvoice.issuerAddress}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="bg-base-200/90 p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-4 text-accent">Client</h3>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom du client</span>
              </label>
              <input
                type="text"
                name="clientName"
                className="input input-bordered"
                value={editedInvoice.clientName}
                onChange={handleChange}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Adresse du client</span>
              </label>
              <textarea
                name="clientAddress"
                className="textarea textarea-bordered"
                value={editedInvoice.clientAddress}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-base-200/90 p-6 rounded-xl shadow">
        <h3 className="text-xl font-bold mb-4">Dates</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Date de facturation</span>
            </label>
            <input
              type="date"
              name="invoiceDate"
              className="input input-bordered"
              value={editedInvoice.invoiceDate}
              onChange={handleChange}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Date d&apos;échéance</span>
            </label>
            <input
              type="date"
              name="dueDate"
              className="input input-bordered"
              value={editedInvoice.dueDate}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* TVA */}
      <div className="bg-base-200/90 p-6 rounded-xl shadow">
        <h3 className="text-xl font-bold mb-4">TVA</h3>
        <div className="space-y-4">
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Activer la TVA</span>
              <input
                type="checkbox"
                name="vatActive"
                className="checkbox checkbox-accent"
                checked={editedInvoice.vatActive}
                onChange={handleChange}
              />
            </label>
          </div>
          {editedInvoice.vatActive && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Taux de TVA (%)</span>
              </label>
              <input
                type="number"
                name="vatRate"
                min="0"
                max="100"
                className="input input-bordered"
                value={editedInvoice.vatRate}
                onChange={handleChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-4 justify-end">
        <button
          className="btn btn-ghost gap-2"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="w-4"/>
          Annuler
        </button>
        <button
          className="btn btn-accent gap-2"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Save className="w-4"/>
          )}
          Sauvegarder
        </button>
      </div>
    </div>
  )
}

export default InvoiceEditForm
