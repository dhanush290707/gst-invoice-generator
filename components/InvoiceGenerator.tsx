
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Invoice, InvoiceSettings, InvoiceStatus, Client, Template, LineItem } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

declare const jspdf: any;

interface InvoiceGeneratorProps {
  user: User;
  invoices: Invoice[];
  clients: Client[];
  settings: InvoiceSettings;
  onLogout: () => void;
  onAddInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'firmDetails'>) => Invoice;
  onUpdateInvoice: (invoice: Invoice) => void;
  onUpdateUser: (details: Partial<User>) => void;
  onUpdateSettings: (settings: Partial<InvoiceSettings>) => void;
}

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const FirmSettingsView: React.FC<{ user: User; onUpdateUser: (details: Partial<User>) => void }> = ({ user, onUpdateUser }) => {
    const [firmName, setFirmName] = useState(user.firmName);
    const [firmHolderName, setFirmHolderName] = useState(user.firmHolderName);
    const [firmEmail, setFirmEmail] = useState(user.firmEmail);
    const [logo, setLogo] = useState(user.logo);
    const [isSaved, setIsSaved] = useState(false);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64Logo = await fileToBase64(e.target.files[0]);
            setLogo(base64Logo);
        }
    };

    const handleSave = () => {
        onUpdateUser({ firmName, firmHolderName, firmEmail, logo });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Firm Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <label htmlFor="firmName" className="block text-sm font-medium text-gray-700">Firm Name</label>
                        <input type="text" id="firmName" value={firmName} onChange={e => setFirmName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="firmHolderName" className="block text-sm font-medium text-gray-700">Firm Holder Name</label>
                        <input type="text" id="firmHolderName" value={firmHolderName} onChange={e => setFirmHolderName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="firmEmail" className="block text-sm font-medium text-gray-700">Firm Email</label>
                        <input type="email" id="firmEmail" value={firmEmail} onChange={e => setFirmEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Firm Logo</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {logo ? <img src={logo} alt="logo preview" className="mx-auto h-24 w-auto"/> : <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            <div className="flex text-sm text-gray-600 justify-center">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                    <span>{logo ? 'Change logo' : 'Upload a file'}</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/png, image/jpeg" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG up to 1MB</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={handleSave} className={`px-6 py-2 rounded-md font-semibold text-white transition-colors ${isSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isSaved ? 'Saved!' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

// Form state for a single line item, including UI state like loading
type FormLineItem = LineItem & {
    loadingGst: boolean;
    aiConfidence?: number;
    aiError: boolean;
};
type PreviousItem = Omit<LineItem, 'id' | 'quantity'>;

const InvoiceForm: React.FC<{
    user: User;
    onSave: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'firmDetails'>) => void;
    onCancel: () => void;
    clients: Client[];
    previousItems: PreviousItem[];
    settings: InvoiceSettings;
}> = ({ user, onSave, onCancel, clients, previousItems, settings }) => {
    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('Thank you for your business. Please make payment by the due date.');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState(0);

    const [lineItems, setLineItems] = useState<FormLineItem[]>([{ id: 'item-1', description: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 18, loadingGst: false, aiError: false }]);
    const [error, setError] = useState('');
    
    const ai = useMemo(() => process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null, []);

    useEffect(() => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 15);
        setDueDate(futureDate.toISOString().split('T')[0]);
    }, []);

    const fetchGstDetails = useCallback(async (description: string, itemIndex: number) => {
        if (!ai || description.length < 3) return;
        setLineItems(currentItems => currentItems.map((item, index) => index === itemIndex ? { ...item, loadingGst: true, aiError: false, aiConfidence: undefined } : item));
        try {
            const prompt = `Given the item description "${description}", provide the most likely 8-digit HSN code, the corresponding GST rate in percentage, and a confidence score from 0.0 to 1.0 for your suggestion.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview', contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.OBJECT, properties: { hsnCode: { type: Type.STRING }, gstRate: { type: Type.NUMBER }, confidence: { type: Type.NUMBER } }, required: ['hsnCode', 'gstRate', 'confidence'] }
                },
            });
            if (response.text) {
                const { hsnCode, gstRate, confidence } = JSON.parse(response.text);
                if (hsnCode && typeof gstRate === 'number' && typeof confidence === 'number') {
                    setLineItems(currentItems => currentItems.map((item, index) => index === itemIndex ? { ...item, hsnCode, gstRate, aiConfidence: confidence, loadingGst: false } : item));
                } else { setLineItems(currentItems => currentItems.map((item, index) => index === itemIndex ? { ...item, loadingGst: false, aiError: true } : item)); }
            } else { setLineItems(currentItems => currentItems.map((item, index) => index === itemIndex ? { ...item, loadingGst: false, aiError: true } : item)); }
        } catch (error) { console.error("AI GST suggestion failed:", error); setLineItems(currentItems => currentItems.map((item, index) => index === itemIndex ? { ...item, loadingGst: false, aiError: true } : item)); }
    }, [ai]);

    const handleItemChange = (index: number, field: keyof Omit<FormLineItem, 'id' | 'loadingGst'>, value: string | number) => {
        let updatedItems = lineItems.map((item, i) => {
             if (i === index) { const updatedItem = { ...item, [field]: value }; if (field === 'hsnCode' || field === 'gstRate') { updatedItem.aiConfidence = undefined; updatedItem.aiError = false; } return updatedItem; } return item;
        });
        if (field === 'description' && typeof value === 'string') {
            const matchedItem = previousItems.find(p => p.description.toLowerCase() === value.toLowerCase());
            if (matchedItem) { updatedItems = updatedItems.map((item, i) => i === index ? { ...item, description: matchedItem.description, unitPrice: matchedItem.unitPrice, hsnCode: matchedItem.hsnCode, gstRate: matchedItem.gstRate, aiConfidence: undefined, aiError: false } : item); }
        }
        setLineItems(updatedItems);
    };
    
    const addItem = () => setLineItems([...lineItems, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 18, loadingGst: false, aiError: false }]);
    const removeItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));
    const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => { const name = e.target.value; setClientName(name); const existingClient = clients.find(c => c.name.toLowerCase() === name.toLowerCase()); if (existingClient) { setClientAddress(existingClient.address); setClientEmail(existingClient.email); } };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!clientName || !clientAddress || !clientEmail || lineItems.some(item => !item.description || item.quantity <= 0)) { setError('Please fill in all client details and ensure all line items have a description and valid quantity.'); return; }
        onSave({ clientName, clientAddress, clientEmail, date, dueDate, template: Template.MODERN, lineItems: lineItems.map(({loadingGst, aiConfidence, aiError, ...rest}) => rest), notes, terms, discount: { type: discountType, value: discountValue } });
    };

    const { subtotal, discountAmount, taxableAmount, totalGst, grandTotal } = useMemo(() => {
        const sub = lineItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
        let disc = discountType === 'percentage' ? sub * (discountValue / 100) : discountValue;
        disc = Math.min(sub, disc > 0 ? disc : 0);
        const taxable = sub - disc;
        const gst = lineItems.reduce((acc, item) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            const itemShareOfSubtotal = sub > 0 ? itemTotal / sub : 0;
            const itemDiscount = disc * itemShareOfSubtotal;
            const itemTaxableAmount = itemTotal - itemDiscount;
            return acc + (itemTaxableAmount * ((item.gstRate || 0) / 100));
        }, 0);
        const grand = taxable + gst;
        return { subtotal: sub, discountAmount: disc, taxableAmount: taxable, totalGst: gst, grandTotal: grand };
    }, [lineItems, discountType, discountValue]);

    return (
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg my-12 p-12">
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit}>
                <header className="flex justify-between items-start pb-8 border-b">
                    <div className="flex items-center gap-4">
                        {user.logo && <img src={user.logo} alt="Firm Logo" className="h-16 w-auto" />}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{user.firmName}</h2>
                            <p className="text-sm text-gray-500">{user.firmHolderName}</p>
                            <p className="text-sm text-gray-500">{user.firmEmail}</p>
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-300 uppercase">Invoice</h1>
                </header>

                <section className="flex justify-between items-start py-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
                        <input type="text" list="clients-datalist" value={clientName} onChange={handleClientChange} className="text-lg font-bold text-gray-800 p-1 -ml-1 border-transparent focus:border-gray-300 rounded" placeholder="Client Name" />
                        <datalist id="clients-datalist">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
                        <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} rows={2} className="w-full text-sm text-gray-600 p-1 -ml-1 border-transparent focus:border-gray-300 rounded" placeholder="Client Address"></textarea>
                        <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full text-sm text-gray-600 p-1 -ml-1 border-transparent focus:border-gray-300 rounded" placeholder="Client Email" />
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end">
                            <span className="text-sm font-semibold text-gray-500">Invoice #:&nbsp;</span>
                            <span className="text-sm font-bold">{`${settings.prefix}-${String(settings.nextInvoiceNumber).padStart(4, '0')}`}</span>
                        </div>
                         <div className="flex items-center justify-end mt-2">
                            <label htmlFor="date" className="text-sm font-semibold text-gray-500">Date:&nbsp;</label>
                            <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm text-right border-gray-300 rounded-md p-1"/>
                        </div>
                        <div className="flex items-center justify-end mt-2">
                            <label htmlFor="dueDate" className="text-sm font-semibold text-gray-500">Due Date:&nbsp;</label>
                            <input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-sm text-right border-gray-300 rounded-md p-1"/>
                        </div>
                    </div>
                </section>

                <section className="mt-4">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left font-semibold text-gray-600 w-full">Item & Description</th>
                                <th className="p-2 text-left font-semibold text-gray-600">HSN</th>
                                <th className="p-2 text-right font-semibold text-gray-600">Qty</th>
                                <th className="p-2 text-right font-semibold text-gray-600">Rate</th>
                                <th className="p-2 text-right font-semibold text-gray-600">Amount</th>
                                <th className="p-2 text-right font-semibold text-gray-600"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.map((item, index) => (
                                <tr key={item.id} className="border-b">
                                    <td><input type="text" list="item-descriptions" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Item description" className="w-full p-2 border-transparent focus:border-gray-300 rounded" /></td>
                                    <td><input type="text" value={item.hsnCode} onChange={e => handleItemChange(index, 'hsnCode', e.target.value)} className="w-24 p-2 border-transparent focus:border-gray-300 rounded" /></td>
                                    <td><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} className="w-16 p-2 text-right border-transparent focus:border-gray-300 rounded" /></td>
                                    <td><input type="number" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-24 p-2 text-right border-transparent focus:border-gray-300 rounded" /></td>
                                    <td className="p-2 text-right text-gray-700">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                    <td><button type="button" onClick={() => removeItem(index)} className="text-red-500 p-2 rounded-full hover:bg-red-100">&times;</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" onClick={addItem} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800">+ Add Line Item</button>
                </section>

                <section className="flex justify-between mt-8">
                    <div className="w-1/2 pr-8">
                        <div>
                            <label className="text-sm font-semibold text-gray-500">Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full mt-1 p-2 text-sm border-gray-300 rounded-md" placeholder="Any notes for the client..."></textarea>
                        </div>
                        <div className="mt-4">
                             <label className="text-sm font-semibold text-gray-500">Terms & Conditions</label>
                            <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={2} className="w-full mt-1 p-2 text-sm border-gray-300 rounded-md"></textarea>
                        </div>
                    </div>
                    <div className="w-1/2 max-w-xs">
                        <div className="flex justify-between py-1"><span className="text-gray-600">Subtotal:</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Discount:</span>
                            <div className="flex items-center">
                                <input type="number" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)} className="w-16 p-1 text-right border-gray-300 rounded-md" />
                                <select value={discountType} onChange={e => setDiscountType(e.target.value as 'percentage' | 'fixed')} className="p-1 border-gray-300 rounded-md text-sm">
                                    <option value="percentage">%</option><option value="fixed">Amt</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between py-1 text-red-500"><span className="text-red-500"></span><span className="font-semibold">- ${discountAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between py-1 border-t mt-1"><span className="text-gray-600">Taxable Amount:</span><span className="font-semibold">${taxableAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between py-1"><span className="text-gray-600">Total GST:</span><span className="font-semibold">+ ${totalGst.toFixed(2)}</span></div>
                        <div className="flex justify-between py-2 mt-2 border-t-2 border-gray-800 text-lg font-bold"><span className="text-gray-800">Grand Total:</span><span>${grandTotal.toFixed(2)}</span></div>
                    </div>
                </section>

                <footer className="flex justify-end items-center gap-4 pt-8 mt-8 border-t">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md font-semibold hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700">Save & Download</button>
                </footer>
            </form>
        </div>
    );
};


const StatusBadge: React.FC<{status: InvoiceStatus}> = ({status}) => {
    const colorMap: Record<InvoiceStatus, string> = {
        'Draft': 'bg-gray-200 text-gray-800',
        'Delivered': 'bg-blue-200 text-blue-800',
        'Payment Pending': 'bg-yellow-200 text-yellow-800',
        'Paid': 'bg-green-200 text-green-800',
    };
    return <span className={`px-3 py-1 text-xs font-medium rounded-full ${colorMap[status]}`}>{status}</span>
};

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = (props) => {
  const { user, invoices, clients, settings, onLogout, onAddInvoice, onUpdateInvoice, onUpdateUser, onUpdateSettings } = props;
  const [mainView, setMainView] = useState<'invoices' | 'settings'>('invoices');
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [prefix, setPrefix] = useState(settings.prefix);
  const [selectedInvoices, setSelectedInvoices] = useState(new Set<string>());
  
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Omit<Invoice, 'lineItems' | 'template' | 'firmDetails' | 'notes' | 'terms' | 'discount'>>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const uniqueDescriptions = useMemo(() => {
    const allItems = invoices.flatMap(inv => inv.lineItems); const descriptionMap = new Map<string, PreviousItem>();
    for (let i = allItems.length - 1; i >= 0; i--) { const item = allItems[i]; if (item.description && !descriptionMap.has(item.description.toLowerCase())) { descriptionMap.set(item.description.toLowerCase(), { description: item.description, unitPrice: item.unitPrice, hsnCode: item.hsnCode, gstRate: item.gstRate }); } }
    return Array.from(descriptionMap.values());
  }, [invoices]);

  const calculateInvoiceTotal = (invoice: Invoice): number => {
      const subtotal = invoice.lineItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
      const discountAmount = invoice.discount.type === 'percentage' ? subtotal * (invoice.discount.value / 100) : invoice.discount.value;
      const taxableAmount = subtotal - discountAmount;
      const totalGst = invoice.lineItems.reduce((acc, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemShare = subtotal > 0 ? itemTotal / subtotal : 0;
        const itemDiscount = discountAmount * itemShare;
        const itemTaxable = itemTotal - itemDiscount;
        return acc + (itemTaxable * (item.gstRate / 100));
      }, 0);
      return taxableAmount + totalGst;
  };

  const renderClassicTemplate = (doc: any, invoice: Invoice, user: User) => {
    // PDF Generation logic can be updated later to use the new fields
  };
  const renderModernTemplate = (doc: any, invoice: Invoice, user: User) => {
    // PDF Generation logic can be updated later to use the new fields
  };
  const generatePdf = useCallback((invoicesToExport: Invoice[]) => {}, [user]);
  const handleDownloadSingle = (invoice: Invoice) => generatePdf([invoice]);
  const handleExportSelected = () => generatePdf(invoices.filter(inv => selectedInvoices.has(inv.id)));
  
  const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'| 'status' | 'firmDetails'>) => {
    const newInvoice = onAddInvoice(invoiceData);
    // handleDownloadSingle(newInvoice); // disabling auto-download for now
    setInvoiceFormOpen(false);
  };
  
  const handleStatusChange = (invoice: Invoice, newStatus: InvoiceStatus) => { onUpdateInvoice({ ...invoice, status: newStatus }); };
  useEffect(() => setPrefix(settings.prefix), [settings.prefix]);
  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => setPrefix(e.target.value.toUpperCase());
  const handleSaveSettings = () => onUpdateSettings({ prefix });

  const handleSort = (column: any) => { if (sortColumn === column) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortColumn(column); setSortDirection('asc'); } };
  const clearFilters = () => { setFilterCustomerName(''); setFilterStartDate(''); setFilterEndDate(''); };

  const filteredAndSortedInvoices = useMemo(() => {
    return [...invoices]
      .filter(invoice => {
        const customerMatch = invoice.clientName.toLowerCase().includes(filterCustomerName.toLowerCase()); const invoiceDate = new Date(invoice.date);
        const startDateMatch = filterStartDate ? invoiceDate >= new Date(filterStartDate) : true; const endDateMatch = filterEndDate ? invoiceDate <= new Date(filterEndDate) : true;
        return customerMatch && startDateMatch && endDateMatch;
      }).sort((a, b) => {
        const field = sortColumn as keyof Invoice; const dir = sortDirection === 'asc' ? 1 : -1;
        let aValue: any = a[field]; let bValue: any = b[field];
        if (field === 'date') { aValue = new Date(aValue).getTime(); bValue = new Date(bValue).getTime(); }
        if (typeof aValue === 'string' && typeof bValue === 'string') { return aValue.toLowerCase().localeCompare(bValue.toLowerCase()) * dir; }
        if (aValue < bValue) return -1 * dir; if (aValue > bValue) return 1 * dir; return 0;
      });
  }, [invoices, filterCustomerName, filterStartDate, filterEndDate, sortColumn, sortDirection]);
  
  const handleSelectOne = (invoiceId: string) => setSelectedInvoices(prev => { const newSet = new Set(prev); if (newSet.has(invoiceId)) newSet.delete(invoiceId); else newSet.add(invoiceId); return newSet; });
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedInvoices(e.target.checked ? new Set(filteredAndSortedInvoices.map(inv => inv.id)) : new Set());

  const renderContent = () => {
    if (invoiceFormOpen) {
        return <InvoiceForm user={user} onSave={handleSaveInvoice} onCancel={() => setInvoiceFormOpen(false)} clients={clients} previousItems={uniqueDescriptions} settings={settings} />;
    }
    switch (mainView) {
        case 'settings': return <FirmSettingsView user={user} onUpdateUser={onUpdateUser} />;
        case 'invoices': default:
            const headers: { label: string; key: any | null }[] = [ { label: 'Invoice #', key: 'invoiceNumber' }, { label: 'Client', key: 'clientName' }, { label: 'Date', key: 'date' }, { label: 'Amount', key: null }, { label: 'Status', key: 'status' }, { label: 'Actions', key: null }, ];
            return (
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                        <div><h1 className="text-3xl font-bold text-gray-800">Invoices</h1><p className="text-gray-600">Manage and track all your invoices.</p></div>
                        <button onClick={() => setInvoiceFormOpen(true)} className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700">Create New Invoice</button>
                    </div>
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <input type="text" value={filterCustomerName} onChange={e => setFilterCustomerName(e.target.value)} placeholder="Search client..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                            <button onClick={clearFilters} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300">Clear</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50"><tr><th className="p-3"></th>{headers.map(({ label, key }) => (<th key={label} className="p-3 text-left text-xs font-medium text-gray-500 uppercase select-none" onClick={key ? () => handleSort(key) : undefined} style={{ cursor: key ? 'pointer' : 'default' }}><div className="flex items-center">{label}{sortColumn === key && (<span className="ml-1 text-gray-800">{sortDirection === 'asc' ? '▲' : '▼'}</span>)}</div></th>))}</tr></thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredAndSortedInvoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="p-3"></td>
                                        <td className="p-3 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                                        <td className="p-3 text-sm text-gray-600">{invoice.clientName}</td>
                                        <td className="p-3 text-sm text-gray-600">{invoice.date}</td>
                                        <td className="p-3 text-sm text-gray-800 font-semibold">${calculateInvoiceTotal(invoice).toFixed(2)}</td>
                                        <td className="p-3 text-sm"><StatusBadge status={invoice.status} /></td>
                                        <td className="p-3 text-sm"><button onClick={() => {}} className="text-blue-600 hover:text-blue-800 ml-2" title="View/Edit">View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2"><span className="text-2xl font-bold text-gray-800">GSTInvoice</span></div>
                <div className="flex items-center space-x-4">
                    <span className="text-gray-700 hidden sm:block">Welcome, {user.firmHolderName}</span>
                    <button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600">Logout</button>
                </div>
            </div>
        </header>
        <div className="flex-grow container mx-auto p-6 flex">
            <aside className="w-64 pr-8 flex-shrink-0">
                <nav className="space-y-2 sticky top-24">
                    <button onClick={() => {setMainView('invoices'); setInvoiceFormOpen(false);}} className={`w-full text-left px-4 py-2 rounded-md ${mainView === 'invoices' && !invoiceFormOpen ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}>Invoices</button>
                    <button onClick={() => {setMainView('settings'); setInvoiceFormOpen(false);}} className={`w-full text-left px-4 py-2 rounded-md ${mainView === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}>Firm Settings</button>
                    <div className="border-t my-4"></div>
                     <div className="bg-white p-4 rounded-lg shadow-sm mt-4 border">
                        <h3 className="text-md font-bold text-gray-800 mb-2">Invoice Settings</h3>
                        <label htmlFor="prefix" className="block text-xs font-medium text-gray-700">Prefix</label>
                        <input id="prefix" type="text" value={prefix} onChange={handlePrefixChange} className="mt-1 w-full p-2 border rounded-md text-sm"/>
                        <p className="text-xs text-gray-500 mt-2">Next: {`${prefix}-${settings.nextInvoiceNumber.toString().padStart(4, '0')}`}</p>
                        <button onClick={handleSaveSettings} className="w-full mt-2 bg-gray-700 text-white p-2 rounded hover:bg-gray-800 text-sm">Save</button>
                    </div>
                </nav>
            </aside>
            <main className="flex-grow">
                {renderContent()}
            </main>
        </div>
    </div>
  );
};

export default InvoiceGenerator;
