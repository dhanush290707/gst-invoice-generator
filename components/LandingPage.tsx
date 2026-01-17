
import React from 'react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
}

const LogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="p-4 bg-blue-100 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const PricingCard: React.FC<{plan: string; price: string; features: string[], popular?: boolean}> = ({plan, price, features, popular}) => (
    <div className={`border rounded-lg p-8 flex flex-col ${popular ? 'border-blue-500 relative shadow-xl' : 'border-gray-200'}`}>
        {popular && <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full absolute -top-3 right-6">POPULAR</span>}
        <h3 className="text-2xl font-bold text-center mb-2">{plan}</h3>
        <p className="text-4xl font-extrabold text-center mb-6">{price}<span className="text-lg font-medium text-gray-500">/mo</span></p>
        <ul className="space-y-4 mb-8 text-gray-600 flex-grow">
            {features.map(feature => (
                <li key={feature} className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {feature}
                </li>
            ))}
        </ul>
        <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Choose Plan
        </button>
    </div>
)


const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToSignUp }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-10 shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LogoIcon />
            <a href="#" className="text-2xl font-bold text-gray-800">GSTInvoice</a>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</a>
            <a href="#about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Pricing</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
          </div>
          <div className="space-x-4">
            <button onClick={onNavigateToLogin} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Login
            </button>
            <button onClick={onNavigateToSignUp} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Sign Up
            </button>
          </div>
        </nav>
      </header>
      
      <main className="flex-grow">
        <section id="home" className="bg-blue-50 pt-32 pb-20 text-center">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4 leading-tight">Effortless GST Invoicing for Your Business</h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Create, manage, and send professional GST-compliant invoices in minutes. Simplify your billing process and get paid faster.
            </p>
            <button onClick={onNavigateToSignUp} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-lg">
              Get Started for Free
            </button>
          </div>
        </section>

        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Why Choose GSTInvoice?</h2>
              <p className="text-gray-600 mt-2">Everything you need for seamless invoicing.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Feature 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="GST Compliant"
                description="Generate invoices that adhere to the latest GST regulations automatically."
              />
              <Feature 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                title="Fast & Easy"
                description="An intuitive interface designed to help you create invoices in seconds."
              />
              <Feature 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                title="Secure & Private"
                description="Your data is safe with us. We prioritize security and data protection."
              />
            </div>
          </div>
        </section>

        <section id="about" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">About Us</h2>
              <p className="text-gray-600 mt-2">We're passionate about simplifying finances for businesses.</p>
            </div>
            <div className="max-w-4xl mx-auto text-center text-gray-700 text-lg">
                <p>GSTInvoice was born from a simple idea: invoicing should be easy, fast, and accessible for everyone. We saw countless freelancers and small business owners struggling with complicated software and confusing GST rules. Our mission is to provide a powerful, yet incredibly simple, tool that takes the headache out of invoicing, so you can focus on what you do best—running your business.</p>
            </div>
          </div>
        </section>
        
        <section id="pricing" className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Simple, Transparent Pricing</h2>
                    <p className="text-gray-600 mt-2">Choose the plan that's right for you.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <PricingCard 
                        plan="Starter"
                        price="₹0"
                        features={["Up to 5 invoices/month", "Basic GST calculation", "Email support"]}
                    />
                    <PricingCard 
                        plan="Pro"
                        price="₹499"
                        features={["Unlimited invoices", "Advanced GST reporting", "Priority email support", "Custom branding"]}
                        popular
                    />
                    <PricingCard 
                        plan="Business"
                        price="₹999"
                        features={["All Pro features", "Multi-user access", "Dedicated account manager", "Phone support"]}
                    />
                </div>
            </div>
        </section>

        <section id="contact" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Get in Touch</h2>
              <p className="text-gray-600 mt-2">Have questions? We'd love to hear from you.</p>
            </div>
            <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg">
                <form className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" id="name" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="John Doe" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" id="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="you@example.com" />
                    </div>
                     <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                        <textarea id="message" rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Your message..."></textarea>
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            Send Message
                        </button>
                    </div>
                </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
                <h4 className="font-semibold text-gray-800 mb-3">GSTInvoice</h4>
                <p className="text-gray-500 text-sm">Simplifying your billing.</p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-800 mb-3">Navigate</h4>
                <a href="#features" className="block text-gray-500 hover:text-blue-600 text-sm mb-2">Features</a>
                <a href="#about" className="block text-gray-500 hover:text-blue-600 text-sm mb-2">About</a>
                <a href="#pricing" className="block text-gray-500 hover:text-blue-600 text-sm mb-2">Pricing</a>
                <a href="#contact" className="block text-gray-500 hover:text-blue-600 text-sm mb-2">Contact</a>
            </div>
             <div>
                <h4 className="font-semibold text-gray-800 mb-3">Legal</h4>
                <a href="#" className="block text-gray-500 hover:text-blue-600 text-sm mb-2">Privacy Policy</a>
                <a href="#" className="block text-gray-500 hover:text-blue-600 text-sm mb-2">Terms of Service</a>
            </div>
            <div>
                 <h4 className="font-semibold text-gray-800 mb-3">Connect</h4>
                 <a href="#" className="block text-gray-500 hover:text-blue-600 text-sm mb-2">Twitter</a>
                 <a href="#" className="block text-gray-500 hover:text-blue-600 text-sm mb-2">LinkedIn</a>
            </div>
          </div>
          <div className="mt-10 border-t pt-6 text-center text-gray-500">
             <p>&copy; {new Date().getFullYear()} GSTInvoice. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
