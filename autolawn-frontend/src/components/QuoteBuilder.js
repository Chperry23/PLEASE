// src/components/QuoteBuilder.js
import React, { useState } from 'react';
import Header from './Header';
import { PDFDownloadLink } from '@react-pdf/renderer';
import QuotePDF from './QuotePDF';
import { v4 as uuidv4 } from 'uuid';

const QuoteBuilder = () => {
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Your Company Name',
    logo: '',
    address: '123 Business St, City, State, ZIP',
    phone: '555-555-5555',
    email: 'info@yourcompany.com',
    website: 'www.yourcompany.com',
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  const [quoteNumber, setQuoteNumber] = useState(`QUOTE-${uuidv4().slice(0, 8).toUpperCase()}`);
  const [quoteName, setQuoteName] = useState('quote.pdf');
  const [mode, setMode] = useState('residential'); // 'residential' or 'commercial'
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0,10);
  });
  const [terms, setTerms] = useState('Payment due upon completion. Valid for 30 days.');

  const [lineItems, setLineItems] = useState([
    { service: '', description: '', price: '' }
  ]);

  const addLineItem = () => {
    setLineItems([...lineItems, { service: '', description: '', price: '' }]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const price = parseFloat(item.price);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto py-6 px-4 text-white">
        <h1 className="text-3xl font-bold mb-4">Quote Builder</h1>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Business Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              Name:
              <input
                type="text"
                value={businessInfo.name}
                onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
            <label>
              Logo URL:
              <input
                type="text"
                value={businessInfo.logo}
                onChange={(e) => setBusinessInfo({...businessInfo, logo: e.target.value})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
            <label className="md:col-span-2">
              Address:
              <input
                type="text"
                value={businessInfo.address}
                onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
            <label>
              Phone:
              <input
                type="text"
                value={businessInfo.phone}
                onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
            <label>
              Email:
              <input
                type="text"
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
            <label>
              Website:
              <input
                type="text"
                value={businessInfo.website}
                onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Customer Info</h2>
          <label>
            Name:
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
              className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
            />
          </label>
          <label>
            Phone:
            <input
              type="text"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
            />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <label>
              Street:
              <input
                type="text"
                value={customerInfo.address.street}
                onChange={(e) => setCustomerInfo({...customerInfo, address: {...customerInfo.address, street: e.target.value}})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
            <label>
              City:
              <input
                type="text"
                value={customerInfo.address.city}
                onChange={(e) => setCustomerInfo({...customerInfo, address: {...customerInfo.address, city: e.target.value}})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
            <label>
              State:
              <input
                type="text"
                value={customerInfo.address.state}
                onChange={(e) => setCustomerInfo({...customerInfo, address: {...customerInfo.address, state: e.target.value}})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
            <label>
              Zip Code:
              <input
                type="text"
                value={customerInfo.address.zipCode}
                onChange={(e) => setCustomerInfo({...customerInfo, address: {...customerInfo.address, zipCode: e.target.value}})}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Quote Details</h2>
          <label className="block mb-2">
            Quote Number:
            <input
              type="text"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
            />
          </label>
          <label className="block mb-2">
            File Name (for PDF):
            <input
              type="text"
              value={quoteName}
              onChange={(e) => setQuoteName(e.target.value)}
              className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
            />
          </label>
          <label className="block mb-2">
            Mode:
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </label>

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Line Items</h3>
            {lineItems.map((item, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded mb-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label>
                    Service:
                    <input
                      type="text"
                      value={item.service}
                      onChange={(e) => updateLineItem(index, 'service', e.target.value)}
                      className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
                    />
                  </label>
                  <label className="md:col-span-2">
                    Description:
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
                    />
                  </label>
                  <label>
                    Price:
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateLineItem(index, 'price', e.target.value)}
                      className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
                    />
                  </label>
                </div>
                {index > 0 && (
                  <button
                    onClick={() => removeLineItem(index)}
                    className="mt-2 text-red-400 hover:text-red-300"
                  >
                    Remove this item
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addLineItem}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
            >
              Add Line Item
            </button>
          </div>

          {mode === 'commercial' && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Commercial Options</h3>
              <p>Here you could add fields like 'Man Hours', 'Crew Size', etc.</p>
              {/* Implement as needed */}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              Valid Until:
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded"
              />
            </label>
            <label className="md:col-span-2">
              Terms & Conditions:
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="mt-1 w-full bg-gray-700 text-white p-2 rounded h-24"
              />
            </label>
          </div>
        </section>

        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-xl font-semibold mb-2">Preview & Export</h3>
          <p>Total: ${lineItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2)}</p>
          <PDFDownloadLink
            document={
              <QuotePDF
                quote={{
                  _id: quoteNumber,
                  lineItems: lineItems.map(item => ({
                    ...item,
                    price: parseFloat(item.price) || 0
                  })),
                  totalPrice: lineItems.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0),
                  expirationDate,
                  terms,
                  mode,
                }}
                customerInfo={customerInfo}
                businessInfo={businessInfo}
              />
            }
            fileName={quoteName}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500 mt-4 inline-block"
          >
            {({ blob, url, loading, error }) =>
              loading ? 'Generating PDF...' : 'Download PDF'
            }
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
};

export default QuoteBuilder;
