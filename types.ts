
export enum Page {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  DASHBOARD = 'DASHBOARD',
}

export enum Template {
  CLASSIC = 'Classic',
  MODERN = 'Modern',
}

export type InvoiceStatus = 'Draft' | 'Delivered' | 'Payment Pending' | 'Paid';

export interface User {
  firmName: string;
  firmHolderName: string;
  firmEmail: string;
  logo?: string; // Base64 encoded string
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  hsnCode: string;
  gstRate: number; // Percentage
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  template: Template;
  lineItems: LineItem[];
  firmDetails: User;
  notes: string;
  terms: string;
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface Client {
  id: string;
  name: string;
  address: string;
  email: string;
}

export interface InvoiceSettings {
  prefix: string;
  nextInvoiceNumber: number;
}
