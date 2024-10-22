// components/CustomerMap.js

import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
/* global google */
const CustomerMap = ({ routes }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      version: "weekly",
    });

    loader.load().then(() => {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
          ],
        });
  
        const bounds = new google.maps.LatLngBounds();
        let hasValidCoordinates = false;
  
        routes.forEach((route, routeIndex) => {
          if (route.jobs && Array.isArray(route.jobs)) {
            const routeCoordinates = route.jobs
              .filter(job => job.customer && job.customer.address && 
                             job.customer.address.lat && job.customer.address.lng)
              .map(job => ({
                lat: parseFloat(job.customer.address.lat),
                lng: parseFloat(job.customer.address.lng)
              }));
  
            if (routeCoordinates.length > 0) {
              const routePath = new google.maps.Polyline({
                path: routeCoordinates,
                geodesic: true,
                strokeColor: getRouteColor(routeIndex),
                strokeOpacity: 1.0,
                strokeWeight: 2
              });
  
              routePath.setMap(map);
  
              route.jobs.forEach((job, jobIndex) => {
                if (job.customer && job.customer.address && 
                    job.customer.address.lat && job.customer.address.lng) {
                  const position = new google.maps.LatLng(
                    parseFloat(job.customer.address.lat),
                    parseFloat(job.customer.address.lng)
                  );
  
                  const marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    title: `${job.title} - ${job.customer.name}`,
                    label: `${routeIndex + 1}.${jobIndex + 1}`
                  });
  
                  bounds.extend(position);
                  hasValidCoordinates = true;
  
                  const infoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="color: #333;">
                        <h3 style="color: #1a202c;">${job.title}</h3>
                        <p><strong>Customer:</strong> ${job.customer.name}</p>
                        <p><strong>Address:</strong> ${job.customer.address.street}, ${job.customer.address.city}</p>
                        <p><strong>Scheduled:</strong> ${job.scheduledDate ? new Date(job.scheduledDate).toLocaleString() : 'Not scheduled'}</p>
                        <p><strong>Price:</strong> $${job.price}</p>
                      </div>
                    `
                  });
  
                  marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                  });
                }
              });
            }
          }
        });
  
        if (hasValidCoordinates) {
          map.fitBounds(bounds);
        } else {
          map.setCenter({ lat: 0, lng: 0 });
          map.setZoom(2);
        }
      });
    }, [routes]);
  
    const getRouteColor = (index) => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
      return colors[index % colors.length];
    };
  
    return (
      <div>
        <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '400px' }}></div>
        {routes.length === 0 && (
          <p className="text-center mt-4 text-gray-400">No routes available to display on the map.</p>
        )}
      </div>
    );
  };
  
  export default CustomerMap;