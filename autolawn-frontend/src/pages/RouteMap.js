/* global google */ // This line tells the linter that google is globally available
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../components/utils';
import Header from '../components/Header';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const RouteMap = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [mapZoom, setMapZoom] = useState(12);  // Default zoom level
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching route, job, and customer data...');
      try {
        const routesResponse = await fetchWithAuth('/routes');
        const jobsResponse = await fetchWithAuth('/jobs');
        const customersResponse = await fetchWithAuth('/customers');

        console.log('Routes fetched:', routesResponse);
        console.log('Jobs fetched:', jobsResponse);
        console.log('Customers fetched:', customersResponse);

        const fetchedRoutes = routesResponse.routes || {};
        const fetchedJobs = jobsResponse || [];
        const fetchedCustomers = customersResponse || [];

        processRoutesData(fetchedRoutes, fetchedJobs, fetchedCustomers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processRoutesData = (fetchedRoutes, fetchedJobs, fetchedCustomers) => {
    console.log('Processing route data...');
    const jobMap = {};
    fetchedJobs.forEach((job) => {
      jobMap[job._id] = job;
    });

    const customerMap = {};
    fetchedCustomers.forEach((customer) => {
      customerMap[customer._id] = customer;
    });

    const processedRoutes = [];

    for (const [day, dayRoutes] of Object.entries(fetchedRoutes)) {
      dayRoutes.forEach((route) => {
        let fullJobs = [];
        if (Array.isArray(route.jobs)) {
          fullJobs = route.jobs.map((job) => (typeof job === 'string' ? jobMap[job] : job)).filter((job) => job);
        } else if (typeof route.jobs === 'object' && route.jobs !== null) {
          const jobGroups = Object.values(route.jobs).flat();
          fullJobs = jobGroups.map((job) => (typeof job === 'string' ? jobMap[job] : job)).filter((job) => job);
        }

        fullJobs = fullJobs.map((job) => ({
          ...job,
          customer: customerMap[job.customer] || job.customer,
        }));

        processedRoutes.push({
          day,
          ...route,
          jobs: fullJobs,
        });
      });
    }

    console.log('Processed routes:', processedRoutes);
    setRoutes(processedRoutes);
  };

  const geocodeAddresses = async (jobs) => {
    console.log('Geocoding addresses for jobs:', jobs);
    const markersData = [];
    const geocoder = new google.maps.Geocoder();  // `google` is now recognized globally

    for (const job of jobs) {
      const address = job.customer?.address || job.location?.address;
      console.log('Geocoding address:', address);

      if (address) {
        try {
          const results = await geocodeAddress(address, geocoder);
          if (results && results.length > 0) {
            const location = results[0].geometry.location;
            console.log('Geocoding successful, location:', location);
            markersData.push({
              position: { lat: location.lat(), lng: location.lng() },
              job,
            });
          } else {
            console.warn('No geocoding results found for address:', address);
          }
        } catch (err) {
          console.error('Geocoding error for address:', address, err);
        }
      } else {
        console.warn('No valid address found for job:', job);
      }
    }

    setMarkers(markersData);
    if (markersData.length > 0) {
      // Set the map to center on the first marker, and set zoom to 11 (approx 20 miles)
      setMapCenter(markersData[0].position);
      setMapZoom(10);  // Set zoom to show a 20-mile radius
    }
  };

  const geocodeAddress = (address, geocoder) => {
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK') {
          resolve(results);
        } else {
          reject(`Geocode was not successful for the following reason: ${status}`);
        }
      });
    });
  };

  const handleRouteSelection = async (event) => {
    const index = event.target.value;
    console.log('Selected route index:', index);
    setSelectedRouteIndex(index);
    const selectedRoute = routes[index];
    if (selectedRoute) {
      console.log('Geocoding addresses for selected route...');
      setLoading(true);
      await geocodeAddresses(selectedRoute.jobs);
      setLoading(false);
    } else {
      console.log('No selected route.');
      setMarkers([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6 text-white">Route Map</h1>
        <div className="mb-4">
          <label className="block text-white text-lg mb-2">Select a Route:</label>
          <select
            onChange={handleRouteSelection}
            value={selectedRouteIndex || ''}
            className="w-full p-2 bg-gray-700 text-white rounded"
          >
            <option value="">-- Select Route --</option>
            {routes.map((route, index) => (
              <option key={index} value={index}>
                {route.name || `Route ${index + 1}`} ({route.day})
              </option>
            ))}
          </select>
        </div>
        <LoadScript
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          onLoad={() => {
            console.log('Google Maps script loaded');
            setIsMapLoaded(true);  // Mark map as loaded only after script is loaded
          }}
        >
          {isMapLoaded && (
            <GoogleMap
              mapContainerStyle={{ height: '600px', width: '100%' }}
              center={mapCenter}
              zoom={mapZoom}  // Use the dynamic zoom level
              onLoad={() => console.log('Map loaded')}
            >
              {markers.map((marker, idx) => (
                <Marker
                  key={idx}
                  position={marker.position}
                  onClick={() => setSelectedMarker(marker)}
                />
              ))}
              {selectedMarker && (
                <InfoWindow
                  position={selectedMarker.position}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div>
                    <h3>{selectedMarker.job.title || 'Untitled Job'}</h3>
                    <p>{selectedMarker.job.customer?.name || 'No Customer'}</p>
                    <p>{selectedMarker.job.customer?.address || selectedMarker.job.location?.address}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </LoadScript>
      </main>
    </div>
  );
};

export default RouteMap;
