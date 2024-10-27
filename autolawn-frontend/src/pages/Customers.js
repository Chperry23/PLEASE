import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Use axiosInstance
import { PlusIcon, ArrowUpOnSquareIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';
import InputMask from 'react-input-mask';
import Select from 'react-select';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';

// Full list of U.S. states
const stateOptions = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

const Customers = () => {
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    notes: '',
    status: 'Active',
    yardSize: '', // Added field
    landscapingPotential: false // Added field
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [showCsvFormat, setShowCsvFormat] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);

  // Load Google Maps Places API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();

      // Extract address components
      const addressComponents = place.address_components;
      const streetNumber = addressComponents.find(component => component.types.includes('street_number'))?.long_name || '';
      const route = addressComponents.find(component => component.types.includes('route'))?.long_name || '';
      const city = addressComponents.find(component => component.types.includes('locality') || component.types.includes('sublocality'))?.long_name || '';
      const state = addressComponents.find(component => component.types.includes('administrative_area_level_1'))?.short_name || '';
      const zipCode = addressComponents.find(component => component.types.includes('postal_code'))?.long_name || '';

      setCustomer(prev => ({
        ...prev,
        address: {
          ...prev.address,
          street: `${streetNumber} ${route}`.trim(),
          city,
          state,
          zipCode
        }
      }));
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  const onLoadAutocomplete = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setCustomer(prev => ({ ...prev, [name]: checked }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCustomer(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCustomer(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axiosInstance.post('https://autolawn.app/api/customers', customer, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Customer added successfully!');
      setCustomer({
        name: '',
        email: '',
        phone: '',
        address: { street: '', city: '', state: '', zipCode: '' },
        notes: '',
        status: 'Active'
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      setError('Failed to add customer. Please try again.');
    }
    setLoading(false);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a CSV file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    setLoading(true);
    try {
      await axiosInstance.post('https://autolawn.app/api/customers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSuccess('Customers imported successfully!');
      setCsvFile(null);
    } catch (error) {
      console.error('Error importing customers:', error);
      setError('Failed to import customers. Please try again.');
    }
    setLoading(false);
  };

  // Custom styles for react-select
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      color: 'black',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'black',
    }),
    input: (provided) => ({
      ...provided,
      color: 'black',
    }),
    menu: (provided) => ({
      ...provided,
      color: 'black',
    }),
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold">Add Customers</h1>
          </div>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              {success}
            </div>
          )}

          <div className="bg-surface overflow-hidden shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Customer</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={customer.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                  required
                />
              </div>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customer.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                  required
                />
              </div>
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium">
                  Phone <span className="text-red-500">*</span>
                </label>
                <InputMask
                  mask="(999) 999-9999"
                  value={customer.phone}
                  onChange={handleChange}
                >
                  {(inputProps) => (
                    <input
                      {...inputProps}
                      type="tel"
                      id="phone"
                      name="phone"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                      required
                    />
                  )}
                </InputMask>
              </div>
              {/* Street Address with Autocomplete */}
              <div>
                <label htmlFor="address.street" className="block text-sm font-medium">
                  Address <span className="text-red-500">*</span>
                </label>
                {isLoaded && (
                  <Autocomplete
                    onLoad={onLoadAutocomplete}
                    onPlaceChanged={handlePlaceChanged}
                  >
                    <input
                      type="text"
                      id="address.street"
                      name="address.street"
                      value={customer.address.street}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                      required
                    />
                  </Autocomplete>
                )}
                {!isLoaded && (
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={customer.address.street}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                    required
                  />
                )}
              </div>
              {/* City */}
              <div>
                <label htmlFor="address.city" className="block text-sm font-medium">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={customer.address.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                  required
                />
              </div>
              {/* State */}
              <div>
                <label htmlFor="address.state" className="block text-sm font-medium">
                  State <span className="text-red-500">*</span>
                </label>
                <Select
                  id="address.state"
                  name="address.state"
                  options={stateOptions}
                  value={stateOptions.find((option) => option.value === customer.address.state)}
                  onChange={(selectedOption) => {
                    handleChange({ target: { name: 'address.state', value: selectedOption.value } });
                  }}
                  styles={customSelectStyles}
                  className="mt-1"
                  required
                />
              </div>
              {/* Zip Code */}
              <div>
                <label htmlFor="address.zipCode" className="block text-sm font-medium">
                  Zip Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address.zipCode"
                  name="address.zipCode"
                  value={customer.address.zipCode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                  required
                />
              </div>
              {/* Notes */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={customer.notes}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                ></textarea>
              </div>
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium">Status</label>
                <select
                  id="status"
                  name="status"
                  value={customer.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
              {/* Submit Button */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 flex items-center justify-center"
                  disabled={loading}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>

          {/* CSV Import Section */}
          <div className="bg-surface overflow-hidden shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Import Customers from CSV</h2>
            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div>
                <label htmlFor="csvFile" className="block text-sm font-medium">Select CSV File</label>
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="mt-1 block w-full text-black"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 flex items-center justify-center"
                disabled={loading || !csvFile}
              >
                <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" />
                {loading ? 'Importing...' : 'Import Customers'}
              </button>
            </form>
            <div className="mt-4 flex justify-center items-center">
              <button
                className="flex items-center text-primary hover:text-primary-dark"
                onClick={() => setShowCsvFormat(true)}
              >
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                CSV Format Info
              </button>
            </div>
          </div>

          {/* CSV Format Modal */}
          {showCsvFormat && (
            <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-center justify-center min-h-screen">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
                <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      CSV Format Information
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        Please ensure your CSV file is formatted as follows:
                      </p>
                      <table className="mt-2 bg-gray-100 p-2 rounded-md w-full text-center">
                        <thead>
                          <tr>
                            <th className="border px-1 py-1 text-xs">name</th>
                            <th className="border px-1 py-1 text-xs">email</th>
                            <th className="border px-1 py-1 text-xs">phone</th>
                            <th className="border px-1 py-1 text-xs">street</th>
                            <th className="border px-1 py-1 text-xs">city</th>
                            <th className="border px-1 py-1 text-xs">state</th>
                            <th className="border px-1 py-1 text-xs">zipCode</th>
                            <th className="border px-1 py-1 text-xs">notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border px-1 py-1 text-xs">John Doe</td>
                            <td className="border px-1 py-1 text-xs">john@example.com</td>
                            <td className="border px-1 py-1 text-xs">(123) 456-7890</td>
                            <td className="border px-1 py-1 text-xs">123 Main St</td>
                            <td className="border px-1 py-1 text-xs">Anytown</td>
                            <td className="border px-1 py-1 text-xs">CA</td>
                            <td className="border px-1 py-1 text-xs">12345</td>
                            <td className="border px-1 py-1 text-xs">Sample note</td>
                          </tr>
                          {/* Add more example rows if needed */}
                        </tbody>
                      </table>
                      <p className="text-sm text-gray-700 mt-2">
                        Only the <strong>'name'</strong>, <strong>'email'</strong>, <strong>'phone'</strong>, <strong>'street'</strong>, <strong>'city'</strong>, <strong>'state'</strong>, and <strong>'zipCode'</strong> fields are required. The <strong>'notes'</strong> field is optional.
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      onClick={() => setShowCsvFormat(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Customers;
