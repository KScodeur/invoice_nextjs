import { Invoice } from '@/type'
import { CheckCircle, Clock, FileText, SquareArrowOutUpRight, XCircle } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type InvoiceComponentProps = {
  invoice: Invoice
}

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
          Indefinis
        </div>
      )
  }
}

const InvoiceComponent: React.FC<InvoiceComponentProps> = ({ invoice }) => {
  const calculateTotal =() => {
    const totalHT = invoice?.lines?.reduce((acc, line)=>{
      const quantity = line.quantity ?? 0;
      const unitPrice = line.unitPrice ?? 0;
      return acc + quantity * unitPrice
    }, 0)
    const totalVAT = totalHT * (invoice.vatRate/100);

    return totalHT + totalVAT
  }
  return (
    <div className='bg-base-200/90 p-4 md:p-5 rounded-xl space-y-2 shadow hover:shadow-lg transition-shadow cursor-pointer'>
      <Link href={`/invoice/${invoice.id}`} className="block">
        <div className='flex justify-between items-center w-full'>
          <div>{getStatusBadge(invoice.status)}</div>
          <SquareArrowOutUpRight className="w-5 text-accent" />
        </div>
        <div className='w-full'>
          <div>
            <div className="stat-title">
              <div className='uppercase text-sm'>FACT-{invoice.id}</div>
            </div>
            <div>
              <div className="stat-value text-xl md:text-2xl">{calculateTotal().toFixed(2)} £ </div>
            </div>
            <div className="stat-desc truncate">
              {invoice.name}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default InvoiceComponent