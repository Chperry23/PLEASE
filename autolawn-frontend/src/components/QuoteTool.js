import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { QuoteDownloadLink } from './QuotePDF';
import Header from './Header';

const difficultyLevels = ['Easy', 'Moderate', 'Difficult'];
const skillLevels = ['Basic', 'Intermediate', 'Expert'];

const requiredFields = {
  customerInfo: ['name', 'email', 'phone', 'address.street', 'address.city', 'address.state', 'address.zipCode'],
  quoteFields: ['area', 'timeEstimate']
};

const QuoteTool = () => {
  const [type, setType] = useState('lawncare');
  const [area, setArea] = useState('');
  const [options, setOptions] = useState({
    lawncare: {
      frequency: 'bi-weekly',
      terrain: 'flat',
      grassHeight: 'normal',
      obstacles: 'few',
      edging: false,
      fertilizing: false,
      debrisRemoval: false,
      seasonalCleanup: false,
    },
    hedge_trimming: {
      hedgeHeight: 'under6ft',
      hedgeDensity: 'normal',
      shapeComplexity: 'simple',
      accessDifficulty: 'easy',
      debrisVolume: 'low',
    },
    landscaping: {
      designComplexity: 'simple',
      soilQuality: 'good',
      plantDiversity: 'low',
      irrigationNeeds: 'basic',
      hardscapingAmount: 'none',
      siteAccessibility: 'easy',
    },
  });
  const [timeEstimate, setTimeEstimate] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [skillRequired, setSkillRequired] = useState('Basic');
  const [quote, setQuote] = useState(null);
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
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [activeCarousel, setActiveCarousel] = useState('quoting');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchSavedQuotes = useCallback(async () => {
    try {
      const response = await axios.get('/quotes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSavedQuotes(response.data);
    } catch (error) {
      console.error('Error fetching saved quotes:', error);
      showNotification('Failed to fetch quotes', 'error');
    }
  }, [showNotification]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get('/customers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showNotification('Failed to fetch customers', 'error');
    }
  }, [showNotification]);

  const fetchBusinessInfo = useCallback(async () => {
    try {
      const response = await axios.get('/business-info', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBusinessInfo(response.data);
    } catch (error) {
      console.error('Error fetching business info:', error);
      showNotification('Failed to fetch business information. Please set up your profile.', 'warning');
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSavedQuotes();
    fetchCustomers();
    fetchBusinessInfo();
  }, [fetchSavedQuotes, fetchCustomers, fetchBusinessInfo]);

  const validateFields = () => {
    const errors = [];
    
    requiredFields.customerInfo.forEach(field => {
      const value = field.includes('.') 
        ? customerInfo[field.split('.')[0]][field.split('.')[1]]
        : customerInfo[field];
      if (!value) {
        errors.push(`Customer ${field.replace('address.', '')} is required`);
      }
    });

    if (!area) errors.push('Area is required');
    if (!timeEstimate) errors.push('Time estimate is required');

    return errors;
  };

  const handleCalculateQuote = async () => {
    const errors = validateFields();
    if (errors.length > 0) {
      errors.forEach(error => showNotification(error, 'error'));
      return;
    }
  
    try {
      const response = await axios.post('/calculate', {
        type,
        area: parseFloat(area),
        options: options[type],
        timeEstimate: parseInt(timeEstimate),
        difficulty,
        skillRequired,
        customerInfo,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setQuote(response.data);
    } catch (error) {
      console.error('Error calculating quote:', error);
      showNotification('Error calculating quote', 'error');
    }
  };

  const handleSaveQuote = async () => {
    try {
      setSaving(true);
      const quoteIdentifier = `${type}-${Date.now()}`;
      const quoteData = {
        type,
        area: parseFloat(area),
        options: options[type],
        timeEstimate: parseInt(timeEstimate),
        difficulty,
        skillRequired,
        customerInfo,
        basePrice: quote.basePrice,
        weightedPrice: quote.weightedPrice,
        additionalPrice: quote.additionalPrice,
        totalPrice: quote.totalPrice,
        quoteIdentifier
      };
      
      const existingQuotes = await axios.get(`/quotes?identifier=${quoteIdentifier}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (existingQuotes.data.length > 0) {
        showNotification('This quote has already been saved.', 'warning');
        return;
      }
      
      const response = await axios.post('/quotes', quoteData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      showNotification('Quote saved successfully');
      setSavedQuotes(prevQuotes => [response.data, ...prevQuotes]);
    } catch (error) {
      console.error('Error saving quote:', error);
      showNotification('Error saving quote. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await axios.patch(`/quotes/${id}/status`, { quoteStatus: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Status update response:', response.data);
      setSavedQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          quote._id === id ? { ...quote, quoteStatus: newStatus } : quote
        )
      );
      showNotification('Quote status updated successfully');
    } catch (error) {
      console.error('Error updating quote status:', error);
      showNotification('Error updating quote status', 'error');
    }
  };

  const handleDeleteQuote = async (id) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await axios.delete(`/quotes/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSavedQuotes(prevQuotes => prevQuotes.filter(quote => quote._id !== id));
        showNotification('Quote deleted successfully');
      } catch (error) {
        console.error('Error deleting quote:', error);
        showNotification('Error deleting quote', 'error');
      }
    }
  };

  const handleConvertToJob = async (id) => {
    try {
      await axios.post('/quotes/convert-to-job', { quoteId: id }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchSavedQuotes();
      showNotification('Quote successfully converted to job');
    } catch (error) {
      console.error('Error converting quote to job:', error.response ? error.response.data : error.message);
      showNotification('Error converting quote to job', 'error');
    }
  };

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    setSelectedCustomerId(customerId);
    if (customerId) {
      const selectedCustomer = customers.find(c => c._id === customerId);
      if (selectedCustomer) {
        setCustomerInfo({
          _id: selectedCustomer._id,
          name: selectedCustomer.name || '',
          email: selectedCustomer.email || '',
          phone: selectedCustomer.phone || '',
          address: {
            street: selectedCustomer.address?.street || '',
            city: selectedCustomer.address?.city || '',
            state: selectedCustomer.address?.state || '',
            zipCode: selectedCustomer.address?.zipCode || '',
          },
        });
      }
    } else {
      setCustomerInfo({
        _id: null,
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
    }
  };

  const renderOptions = () => {
    const currentOptions = options[type];
    return Object.entries(currentOptions).map(([key, value]) => {
      if (typeof value === 'boolean') {
        return (
          <label key={key} className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setOptions({
                ...options,
                [type]: { ...options[type], [key]: e.target.checked }
              })}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-white">{key}</span>
          </label>
        );
      } else {
        return (
          <label key={key} className="block mb-2">
            <span className="text-white">{key}:</span>
            <select
              value={value}
              onChange={(e) => setOptions({
                ...options,
                [type]: { ...options[type], [key]: e.target.value }
              })}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-gray-500 focus:bg-gray-600 focus:ring-0 text-white"
            >
              {getOptionsForField(key)}
            </select>
          </label>
        );
      }
    });
  };

  const getOptionsForField = (field) => {
    switch (field) {
      case 'frequency':
        return ['weekly', 'bi-weekly', 'monthly'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'terrain':
        return ['flat', 'sloped', 'hilly'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'grassHeight':
        return ['normal', 'overgrown', 'very overgrown'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'obstacles':
        return ['few', 'some', 'many'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'hedgeHeight':
        return ['under6ft', '6-10ft', 'over10ft'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'hedgeDensity':
        return ['sparse', 'normal', 'dense'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'shapeComplexity':
      case 'designComplexity':
        return ['simple', 'moderate', 'complex'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'accessDifficulty':
      case 'siteAccessibility':
        return ['easy', 'moderate', 'difficult'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'debrisVolume':
        return ['low', 'medium', 'high'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'soilQuality':
        return ['poor', 'average', 'good'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'plantDiversity':
        return ['low', 'medium', 'high'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'irrigationNeeds':
        return ['basic', 'moderate', 'advanced'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      case 'hardscapingAmount':
        return ['none', 'some', 'extensive'].map(opt => <option key={opt} value={opt}>{opt}</option>);
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      {notification && (
        <div className={`fixed top-0 right-0 m-4 p-4 rounded-lg text-white ${
          notification.type === 'error' ? 'bg-red-500' :
          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
        }`}>
          {notification.message}
        </div>
      )}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Quoting Tool</h2>
              <button
                onClick={() => setActiveCarousel(activeCarousel === 'quoting' ? 'managing' : 'quoting')}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
              >
                {activeCarousel === 'quoting' ? 'Manage Quotes' : 'Create Quote'}
                  </button>
            </div>
  
            {activeCarousel === 'quoting' && (
              <div>
                <div className="mb-4">
                  {['lawncare', 'hedge_trimming', 'landscaping'].map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`mr-2 px-4 py-2 rounded ${type === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-white">
                      Customer:
                      <select
                        value={selectedCustomerId}
                        onChange={handleCustomerSelect}
                        className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-gray-500 focus:bg-gray-600 focus:ring-0 text-white"
                      >
                        <option value="">Select a customer or enter new</option>
                        {customers.map(customer => (
                          <option key={customer._id} value={customer._id}>{customer.name}</option>
                        ))}
                      </select>
                    </label>
                    {Object.entries(customerInfo).map(([key, value]) => (
                      key !== '_id' && (
                        <label key={key} className="block mb-2">
                          <span className="text-white">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                          {key === 'address' ? (
                            Object.entries(value).map(([addressKey, addressValue]) => (
                              <input
                                key={addressKey}
                                type="text"
                                value={addressValue}
                                onChange={(e) => setCustomerInfo({
                                  ...customerInfo,
                                  address: {
                                    ...customerInfo.address,
                                    [addressKey]: e.target.value
                                  }
                                })}
                                className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-gray-500 focus:bg-gray-600 focus:ring-0 text-white"
                                placeholder={addressKey}
                              />
                            ))
                          ) : (
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, [key]: e.target.value })}
                              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-gray-500 focus:bg-gray-600 focus:ring-0 text-white"
                            />
                          )}
                        </label>
                      )
                    ))}
                    <label className="block mb-2 text-white">
                      Area (sq ft):
                      <input
                        type="number"
                        value={area}
                        onChange={e => setArea(e.target.value)}
                        className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-gray-500 focus:bg-gray-600 focus:ring-0 text-white"
                      />
                    </label>
                    <label className="block mb-2 text-white">
                      Estimated Time (minutes):
                      <input
                        type="number"
                        value={timeEstimate}
                        onChange={e => setTimeEstimate(e.target.value)}
                        className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-gray-500 focus:bg-gray-600 focus:ring-0 text-white"
                      />
                    </label>
                    <label className="block mb-2">
                      <span className="text-white">Difficulty:</span>
                      <select
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-gray-500 focus:bg-gray-600 focus:ring-0 text-white"
                      >
                        {difficultyLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block mb-2">
                      <span className="text-white">Skill Required:</span>
                      <select
                        value={skillRequired}
                        onChange={e => setSkillRequired(e.target.value)}
                        className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-gray-500 focus:bg-gray-600 focus:ring-0 text-white"
                      >
                        {skillLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    {renderOptions()}
                  </div>
                </div>
                <button
                  onClick={handleCalculateQuote}
                  className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
                >
                  Calculate Quote
                </button>
                {quote && (
                  <div className="mt-6 bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Quote Result</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-white">Base Price: ${quote.basePrice}</p>
                      <p className="text-white">Weighted Price: ${quote.weightedPrice}</p>
                      <p className="text-white">Additional Price: ${quote.additionalPrice}</p>
                      <p className="text-white">Total Price: ${quote.totalPrice}</p>
                      <p className="text-white">Area: {quote.area} sq ft</p>
                      <p className="text-white">Time Estimate: {quote.timeEstimate} minutes</p>
                      <p className="text-white">Difficulty: {quote.difficulty}</p>
                      <p className="text-white">Skill Required: {quote.skillRequired}</p>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={handleSaveQuote}
                        disabled={saving}
                        className={`bg-green-600 text-white px-4 py-2 rounded ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500'}`}
                      >
                        {saving ? 'Saving...' : 'Save Quote'}
                      </button>
                      {businessInfo ? (
                        <QuoteDownloadLink 
                          quote={quote} 
                          customerInfo={customerInfo} 
                          type={type} 
                          options={options[type]} 
                          businessInfo={businessInfo}
                        />
                      ) : (
                        <button
                          onClick={() => showNotification('Please set up your business profile before generating a PDF.', 'warning')}
                          className="bg-gray-500 text-white px-4 py-2 rounded cursor-not-allowed"
                        >
                          Set Up Profile to Generate PDF
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
  
            {activeCarousel === 'managing' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Manage Quotes</h3>
                <div className="space-y-4">
                  {savedQuotes.map((quote) => (
                    <div key={quote._id} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-semibold">{quote.type} - ${quote.totalPrice}</p>
                          <p className="text-gray-300">Created: {new Date(quote.createdAt).toLocaleString()}</p>
                          <p className="text-gray-300">Customer: {quote.customerInfo.name}</p>
                          <p className="text-gray-300">Quote Status: {quote.quoteStatus}</p>
                          <p className="text-gray-300">Job Status: {quote.jobStatus}</p>
                        </div>
                        <div className="flex space-x-2">
                          <select
                            value={quote.quoteStatus}
                            onChange={(e) => handleStatusChange(quote._id, e.target.value)}
                            className="bg-gray-600 text-white rounded px-2 py-1"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          <button
                            onClick={() => handleConvertToJob(quote._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
                            disabled={quote.jobStatus === 'Converted to Job'}
                          >
                            Convert to Job
                          </button>
                          <button
                            onClick={() => handleDeleteQuote(quote._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteTool;
