import { Invoice as PrismaInvoice } from "@prisma/client";
import { InvoiceLine } from "@prisma/client";

export interface Invoice extends PrismaInvoice {
  lines: InvoiceLine[];
}

export interface Totals {
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
}

export interface InvoiceUpdateData {
  name?: string;
  issuerName?: string;
  issuerAddress?: string;
  clientName?: string;
  clientAddress?: string;
  invoiceDate?: string;
  dueDate?: string;
  vatActive?: boolean;
  vatRate?: number;
  status?: number;
}

export interface InvoiceLineCreateData {
  description: string;
  quantity: number;
  unitPrice?: number;
}

export interface InvoiceLineUpdateData {
  description?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface AppError {
  message?: string;
  [key: string]: unknown;
}