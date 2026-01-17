
import React, { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import InvoiceGenerator from './components/InvoiceGenerator';
import { Page, User, Invoice, InvoiceSettings, Client } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    prefix: 'INV',
    nextInvoiceNumber: 1,
  });

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentPage(Page.DASHBOARD);
  }, []);
  
  const handleSignUp = useCallback((newUser: User) => {
    setUser(newUser);
    setCurrentPage(Page.DASHBOARD);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setInvoices([]);
    setClients([]);
    setCurrentPage(Page.LANDING);
  }, []);

  const handleAddInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'firmDetails'>): Invoice => {
    if (!user) {
      throw new Error("Cannot create an invoice without a logged-in user.");
    }
    
    const { prefix, nextInvoiceNumber } = invoiceSettings;
    const paddedNumber = String(nextInvoiceNumber).padStart(4, '0');
    const newInvoiceNumber = `${prefix}-${paddedNumber}`;

    const newInvoice: Invoice = {
      id: new Date().toISOString() + Math.random(),
      invoiceNumber: newInvoiceNumber,
      status: 'Draft',
      ...invoiceData,
      firmDetails: { ...user },
    };
    
    setInvoices(prev => [...prev, newInvoice]);
    setInvoiceSettings(prev => ({ ...prev, nextInvoiceNumber: prev.nextInvoiceNumber + 1 }));

    // Add client to list if they don't exist
    setClients(prevClients => {
      const clientExists = prevClients.some(c => c.name.toLowerCase() === newInvoice.clientName.toLowerCase());
      if (!clientExists) {
        return [...prevClients, {
          id: `client-${Date.now()}`,
          name: newInvoice.clientName,
          address: newInvoice.clientAddress,
          email: newInvoice.clientEmail
        }];
      }
      return prevClients;
    });

    return newInvoice;
  }, [invoiceSettings, user]);

  const handleUpdateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  }, []);
  
  const handleUpdateUser = useCallback((updatedDetails: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedDetails } : null);
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<InvoiceSettings>) => {
    setInvoiceSettings(prev => ({...prev, ...newSettings}));
  }, []);

  const renderContent = () => {
    if (user) {
      return (
        <InvoiceGenerator 
          user={user} 
          invoices={invoices}
          clients={clients}
          settings={invoiceSettings}
          onLogout={handleLogout}
          onAddInvoice={handleAddInvoice}
          onUpdateInvoice={handleUpdateInvoice}
          onUpdateUser={handleUpdateUser}
          onUpdateSettings={handleUpdateSettings}
        />
      );
    }

    switch (currentPage) {
      case Page.LOGIN:
        return <LoginPage onLogin={handleLogin} onNavigateToSignUp={() => navigate(Page.SIGNUP)} onNavigateHome={() => navigate(Page.LANDING)} />;
      case Page.SIGNUP:
        return <SignUpPage onSignUp={handleSignUp} onNavigateToLogin={() => navigate(Page.LOGIN)} onNavigateHome={() => navigate(Page.LANDING)} />;
      case Page.LANDING:
      default:
        return <LandingPage onNavigateToLogin={() => navigate(Page.LOGIN)} onNavigateToSignUp={() => navigate(Page.SIGNUP)} />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-800">
      {renderContent()}
    </div>
  );
};

export default App;
