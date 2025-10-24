import { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation, MapPin, Route, Clock } from 'lucide-react';

interface MapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  services?: any[];
  showUserLocation?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  showDirections?: boolean;
  pickup?: { lat: number; lng: number; address?: string };
  delivery?: { lat: number; lng: number; address?: string };
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  enableAddressSearch?: boolean;
}

const MapComponent = ({
  center = { lat: -23.5505, lng: -46.6333 }, // São Paulo default
  zoom = 13,
  height = '400px',
  services = [],
  showUserLocation = false,
  onMapClick,
  className = '',
  showDirections = false,
  pickup,
  delivery,
  onAddressSelect,
  enableAddressSearch = false,
}: MapProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [serviceMarkers, setServiceMarkers] = useState<google.maps.Marker[]>([]);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [pickupMarker, setPickupMarker] = useState<google.maps.Marker | null>(null);
  const [deliveryMarker, setDeliveryMarker] = useState<google.maps.Marker | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { position, getCurrentPosition } = useGeolocation();

  // Initialize map
  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      // Initialize directions service and renderer
      const dirService = new google.maps.DirectionsService();
      const dirRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        draggable: true,
        polylineOptions: {
          strokeColor: '#FF6B35',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
      
      dirRenderer.setMap(newMap);
      setDirectionsService(dirService);
      setDirectionsRenderer(dirRenderer);

      // Add click listener
      if (onMapClick) {
        newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onMapClick(e.latLng.lat(), e.latLng.lng());
          }
        });
      }

      // Setup autocomplete if enabled
      if (enableAddressSearch && searchInputRef.current) {
        const autocompleteInstance = new google.maps.places.Autocomplete(
          searchInputRef.current,
          {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'BR' },
          }
        );
        
        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();
          if (place.geometry?.location && onAddressSelect) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            onAddressSelect(place.formatted_address || place.name || '', { lat, lng });
            newMap.setCenter({ lat, lng });
            newMap.setZoom(15);
          }
        });
        
        setAutocomplete(autocompleteInstance);
      }

      setMap(newMap);
    }
  }, [ref, map, center, zoom, onMapClick, enableAddressSearch, onAddressSelect]);

  // Update user location
  useEffect(() => {
    if (!map || !showUserLocation) return;

    if (position) {
      const userPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      if (userMarker) {
        userMarker.setPosition(userPos);
      } else {
        const marker = new google.maps.Marker({
          position: userPos,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: 'Sua localização',
        });
        setUserMarker(marker);
      }

      // Center map on user location (first time only)
      if (!userMarker) {
        map.setCenter(userPos);
      }
    }
  }, [map, position, showUserLocation, userMarker]);

  // Update service markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    serviceMarkers.forEach(marker => marker.setMap(null));
    setServiceMarkers([]);

    // Add new markers
    const newMarkers = services.map((service, index) => {
      const marker = new google.maps.Marker({
        position: {
          lat: parseFloat(service.pickup_lat || service.origem_lat || service.lat),
          lng: parseFloat(service.pickup_lng || service.origem_lng || service.lng),
        },
        map,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: getServiceColor(service.service_type || service.tipo),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          rotation: 0,
        },
        title: service.title || service.descricao || `Serviço ${index + 1}`,
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
              ${service.title || service.descricao || 'Serviço'}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 12px;">
              <strong>Tipo:</strong> ${service.service_type || service.tipo || 'N/A'}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 12px;">
              <strong>Valor:</strong> R$ ${(service.price || service.valor || 0).toFixed(2)}
            </p>
            <p style="margin: 0; font-size: 12px;">
              <strong>Status:</strong> ${service.status || 'Disponível'}
            </p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setServiceMarkers(newMarkers);
  }, [map, services]);

  // Handle pickup and delivery markers with directions
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer) return;

    // Clear existing pickup/delivery markers
    if (pickupMarker) {
      pickupMarker.setMap(null);
      setPickupMarker(null);
    }
    if (deliveryMarker) {
      deliveryMarker.setMap(null);
      setDeliveryMarker(null);
    }

    // Add pickup marker
    if (pickup) {
      const marker = new google.maps.Marker({
        position: pickup,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981', // Green
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `Coleta: ${pickup.address || 'Local de retirada'}`,
      });
      setPickupMarker(marker);
    }

    // Add delivery marker
    if (delivery) {
      const marker = new google.maps.Marker({
        position: delivery,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#EF4444', // Red
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `Entrega: ${delivery.address || 'Local de entrega'}`,
      });
      setDeliveryMarker(marker);
    }

    // Show directions if both pickup and delivery are set
    if (pickup && delivery && showDirections) {
      directionsService.route(
        {
          origin: pickup,
          destination: delivery,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
            
            // Extract route information
            const route = result.routes[0];
            const leg = route.legs[0];
            setRouteInfo({
              distance: leg.distance?.text || 'N/A',
              duration: leg.duration?.text || 'N/A',
            });
          } else {
            console.error('Directions request failed:', status);
            setRouteInfo(null);
          }
        }
      );
    } else {
      directionsRenderer.setDirections({ routes: [] } as any);
      setRouteInfo(null);
    }
  }, [map, pickup, delivery, showDirections, directionsService, directionsRenderer]);

  // Get user location on mount
  useEffect(() => {
    if (showUserLocation && !position) {
      getCurrentPosition().catch(console.error);
    }
  }, [showUserLocation, position, getCurrentPosition]);

  return (
    <div className={`relative ${className}`}>
      {/* Address Search */}
      {enableAddressSearch && (
        <Card className="absolute top-4 left-4 z-10">
          <CardContent className="p-3">
            <div className="flex gap-2 items-center">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar endereço..."
                className="w-64"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Info */}
      {routeInfo && (
        <Card className="absolute top-4 right-4 z-10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <Route className="h-4 w-4 text-primary" />
              <span className="font-medium">{routeInfo.distance}</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{routeInfo.duration}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Container */}
      <div
        ref={ref}
        style={{ height }}
        className="w-full rounded-lg"
      />

      {/* Navigation Button */}
      {pickup && delivery && (
        <Button
          className="absolute bottom-4 right-4 z-10"
          onClick={() => {
            const destination = `${delivery.lat},${delivery.lng}`;
            window.open(
              `https://maps.google.com/dir/?api=1&destination=${destination}&travelmode=driving`,
              '_blank'
            );
          }}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Navegar
        </Button>
      )}
    </div>
  );
};

// Helper function to get service color
const getServiceColor = (type: string): string => {
  const colors: Record<string, string> = {
    alimentos: '#FF6B35',
    documentos: '#004E89',
    encomendas: '#00D9FF',
    medicamentos: '#10B981',
    outros: '#6B7280',
    default: '#FF6B35',
  };
  return colors[type?.toLowerCase()] || colors.default;
};

const GoogleMapWrapper = (props: MapProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div 
        style={{ height: props.height || '400px' }}
        className={`w-full bg-gray-100 flex items-center justify-center rounded-lg ${props.className || ''}`}
      >
        <p className="text-gray-500">Google Maps API Key não configurada</p>
      </div>
    );
  }

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div 
            style={{ height: props.height || '400px' }}
            className={`w-full bg-gray-100 flex items-center justify-center rounded-lg ${props.className || ''}`}
          >
            <p className="text-gray-500">Carregando mapa...</p>
          </div>
        );
      case Status.FAILURE:
        return (
          <div 
            style={{ height: props.height || '400px' }}
            className={`w-full bg-red-100 flex items-center justify-center rounded-lg ${props.className || ''}`}
          >
            <p className="text-red-500">Erro ao carregar Google Maps</p>
          </div>
        );
      default:
        return <MapComponent {...props} />;
    }
  };

  return (
    <Wrapper apiKey={apiKey} render={render} libraries={['places', 'geometry', 'directions']}>
      <MapComponent {...props} />
    </Wrapper>
  );
};

export default GoogleMapWrapper;
