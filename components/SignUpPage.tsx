
import React, { useState } from 'react';
import { User } from '../types';

interface SignUpPageProps {
  onSignUp: (user: User) => void;
  onNavigateToLogin: () => void;
  onNavigateHome: () => void;
}

const LogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onNavigateToLogin, onNavigateHome }) => {
  const [firmName, setFirmName] = useState('');
  const [firmHolderName, setFirmHolderName] = useState('');
  const [firmEmail, setFirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName || !firmHolderName || !firmEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    onSignUp({ firmName, firmHolderName, firmEmail });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 cursor-pointer" onClick={onNavigateHome}>
            <div className="flex items-center justify-center space-x-2">
                <LogoIcon />
                <span className="text-3xl font-bold text-gray-800">GSTInvoice</span>
            </div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Your Account</h2>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firmName" className="block text-sm font-medium text-gray-700">Firm Name</label>
              <input
                id="firmName"
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Your Company Inc."
              />
            </div>
            <div>
              <label htmlFor="firmHolderName" className="block text-sm font-medium text-gray-700">Firm Holder Name</label>
              <input
                id="firmHolderName"
                type="text"
                value={firmHolderName}
                onChange={(e) => setFirmHolderName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="firmEmail" className="block text-sm font-medium text-gray-700">Firm Email</label>
              <input
                id="firmEmail"
                type="email"
                value={firmEmail}
                onChange={(e) => setFirmEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center mt-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Up
              </button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={onNavigateToLogin} className="font-medium text-blue-600 hover:text-blue-500">
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
