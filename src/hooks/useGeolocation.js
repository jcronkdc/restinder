import { useState, useEffect } from "react";

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const defaultLocation = {
      latitude: 30.2672,
      longitude: -97.7431,
      city: "Your Area",
      accuracy: 0,
    };

    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        setLocation(defaultLocation);
        setLoading(false);
      }
    }, 3000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(fallbackTimeout);
        const { latitude, longitude } = position.coords;

        const mockCities = [
          { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
          { name: "New York", lat: 40.7128, lng: -74.006 },
          { name: "Chicago", lat: 41.8781, lng: -87.6298 },
          { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
          { name: "Austin", lat: 30.2672, lng: -97.7431 },
        ];

        let closestCity = mockCities[0];
        let minDistance = Infinity;

        mockCities.forEach((city) => {
          const distance = Math.sqrt(
            Math.pow(latitude - city.lat, 2) +
              Math.pow(longitude - city.lng, 2),
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestCity = city;
          }
        });

        setLocation({
          latitude,
          longitude,
          city: closestCity.name,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      () => {
        clearTimeout(fallbackTimeout);
        setLocation(defaultLocation);
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      },
    );

    return () => clearTimeout(fallbackTimeout);
  }, []);

  return { location, loading, error };
}
