'use client'

import { getInvoiceById } from '@/app/actions'
import { Invoice } from '@/type'
import React, { useEffect, useState } from 'react'

const InvoicePage = ({ params }: { params: Promise<{ invoiceId: string }> }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [initialInvoice, setInitialInvoice] = useState<Invoice | null>(null)
  
  // Unwrap the params Promise using React.use()
  const resolvedParams = React.use(params)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const fetchedInvoice = await getInvoiceById(resolvedParams.invoiceId)
        if (fetchedInvoice) {
          setInvoice(fetchedInvoice)
          setInitialInvoice(fetchedInvoice)
        }
      } catch (error) {
        console.error(error)
      }
    }

    fetchInvoice()
  }, [resolvedParams.invoiceId])

  if (!invoice) {
    return <div>Loading...</div>
  }

  return (
    <div>
      
        <p className='badge badge-ghost badge-lg uppercase'>
            <span> Facture-</span>{invoice.id}      
        </p>
    </div>
  )
}

export default InvoicePage

// "use client"
// import { getInvoiceById } from '@/app/actions'
// import { Invoice } from '@/type'
// import React, { useEffect, useState } from 'react'

// const page = async ({params}: {params:Promise<{invoiceId : string}>}) => {
//     const [invoice, setInvoice] = useState<Invoice | null>(null);
//     const [initialInvoice, setInitialeInvoice] = useState<Invoice | null>(null);
//     const fetchInvoice = async () =>{
//         try{
//             const {invoiceId} = await params
//             const fetchedInvoice = await getInvoiceById(invoiceId)
//             if(fetchedInvoice){
//                 setInvoice(fetchedInvoice)
//                 setInitialeInvoice(fetchedInvoice)
//             }
            
//         } catch (erreur) {
//         console.error( erreur);
//     }
//     }

//     useEffect(()=>{
//         fetchInvoice()
//     }, [])
//   return (
//     <div>page{(await params).invoiceId}</div>
//   )
// }

// export default page