import React, { useEffect, useRef } from 'react';

// Leaflet type definitions
interface LeafletMap {
  remove(): void;
  setView(latlng: [number, number], zoom: number): LeafletMap;
}

interface LeafletMarker {
  addTo(map: LeafletMap): LeafletMarker;
  bindPopup(content: string): LeafletMarker;
  openPopup(): LeafletMarker;
}

interface LeafletTileLayer {
  addTo(map: LeafletMap): LeafletTileLayer;
}

interface LeafletStatic {
  map(element: HTMLElement): LeafletMap;
  marker(latlng: [number, number]): LeafletMarker;
  tileLayer(urlTemplate: string, options?: any): LeafletTileLayer;
}

declare global {
  interface Window {
    L?: LeafletStatic;
  }
}

const InteractiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async (): Promise<void> => {
      try {
        // Add Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
          link.integrity = 'sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw==';
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        }

        // Load Leaflet JS if not already loaded
        if (!window.L) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
            script.integrity = 'sha512-puJW3E/qXDqYp9IfhAI54BJEaWIfloJ7JWs7OeD5i6ruC9JZL1gERT1wjtwXFlh7CjE7ZJ+/vcRZRkIYIb6p4g==';
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            document.head.appendChild(script);
          });
        }

        if (isMounted) {
          initializeMap();
        }
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    const initializeMap = (): void => {
      if (!mapRef.current || !window.L) return;

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        // Initialize the map - Murang'a Town, Kenya coordinates
        const map = window.L.map(mapRef.current).setView([-0.7211, 37.1543], 14);

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add a marker for your location
        const marker = window.L.marker([-0.7211, 37.1543]).addTo(map);
        marker.bindPopup('<b>Our Location</b><br>Murang\'a Town, Kenya<br>Visit us here!').openPopup();

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    loadLeaflet();

    // Cleanup function
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-6">Our Location</h2>
      <div className="w-full h-80 bg-gray-200 rounded-lg overflow-hidden">
        <div 
          ref={mapRef} 
          className="h-full w-full rounded-lg"
          style={{ minHeight: '320px' }}
        />
      </div>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Address</h3>
        <p className="text-gray-700">
          Murang'a Town<br />
          Murang'a County<br />
          Kenya
        </p>
        <div className="mt-3">
          <p className="text-sm text-gray-600">
            <strong>Phone:</strong> +254 xxx xxx xxx<br />
            <strong>Email:</strong> info@business.co.ke<br />
            <strong>Hours:</strong> Mon-Fri 8AM-5PM
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;