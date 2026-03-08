import { useState, useEffect } from 'react';

// Mock restaurant data - in a real app, this would come from an API
const mockRestaurants = [
  {
    id: '1',
    name: 'The Garden Bistro',
    cuisine: 'American',
    rating: 4.5,
    priceLevel: 2,
    distance: 0.3,
    waitTime: '15-20',
    tags: ['Outdoor Seating', 'Vegetarian Options', 'Brunch'],
    description: 'Cozy neighborhood spot with farm-to-table cuisine and beautiful garden patio.',
    image: null
  },
  {
    id: '2',
    name: 'Sakura Sushi House',
    cuisine: 'Japanese',
    rating: 4.7,
    priceLevel: 3,
    distance: 0.5,
    waitTime: '30-45',
    tags: ['Sushi Bar', 'Omakase', 'Sake Selection'],
    description: 'Authentic Japanese dining experience with fresh sushi and traditional dishes.',
    image: null
  },
  {
    id: '3',
    name: 'Pasta Paradise',
    cuisine: 'Italian',
    rating: 4.3,
    priceLevel: 2,
    distance: 0.8,
    waitTime: '20-30',
    tags: ['Homemade Pasta', 'Wine Bar', 'Romantic'],
    description: 'Family-owned Italian restaurant serving traditional recipes passed down for generations.',
    image: null
  },
  {
    id: '4',
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    rating: 4.6,
    priceLevel: 1,
    distance: 0.2,
    waitTime: '10-15',
    tags: ['Tacos', 'Margaritas', 'Casual'],
    description: 'Lively Mexican cantina with authentic street tacos and creative margaritas.',
    image: null
  },
  {
    id: '5',
    name: 'The Steakhouse',
    cuisine: 'American',
    rating: 4.8,
    priceLevel: 4,
    distance: 1.2,
    waitTime: '45-60',
    tags: ['Fine Dining', 'Wine Selection', 'Special Occasion'],
    description: 'Upscale steakhouse with prime cuts, extensive wine list, and elegant atmosphere.',
    image: null
  },
  {
    id: '6',
    name: 'Green Garden Vegan',
    cuisine: 'Vegan',
    rating: 4.4,
    priceLevel: 2,
    distance: 0.6,
    waitTime: '15-25',
    tags: ['Plant-Based', 'Organic', 'Gluten-Free Options'],
    description: 'Innovative plant-based cuisine using organic, locally-sourced ingredients.',
    image: null
  },
  {
    id: '7',
    name: 'Bangkok Street',
    cuisine: 'Thai',
    rating: 4.5,
    priceLevel: 2,
    distance: 0.9,
    waitTime: '20-30',
    tags: ['Spicy', 'Curry', 'Takeout Available'],
    description: 'Authentic Thai street food with bold flavors and aromatic spices.',
    image: null
  },
  {
    id: '8',
    name: 'The French Corner',
    cuisine: 'French',
    rating: 4.6,
    priceLevel: 3,
    distance: 0.7,
    waitTime: '30-40',
    tags: ['Fine Dining', 'Wine Bar', 'Romantic'],
    description: 'Classic French bistro with elegant decor and traditional French cuisine.',
    image: null
  },
  {
    id: '9',
    name: 'Pizza Palace',
    cuisine: 'Italian',
    rating: 4.2,
    priceLevel: 1,
    distance: 0.4,
    waitTime: '15-25',
    tags: ['Wood-Fired Pizza', 'Family Friendly', 'Delivery'],
    description: 'Neighborhood pizza joint with wood-fired oven and creative toppings.',
    image: null
  },
  {
    id: '10',
    name: 'Ocean Fresh Seafood',
    cuisine: 'Seafood',
    rating: 4.7,
    priceLevel: 3,
    distance: 1.0,
    waitTime: '25-35',
    tags: ['Fresh Catch', 'Oyster Bar', 'Waterfront Views'],
    description: 'Premium seafood restaurant with daily fresh catches and stunning ocean views.',
    image: null
  },
  {
    id: '11',
    name: 'Spice Route Indian',
    cuisine: 'Indian',
    rating: 4.4,
    priceLevel: 2,
    distance: 0.5,
    waitTime: '20-30',
    tags: ['Curry', 'Vegetarian Options', 'Lunch Buffet'],
    description: 'Regional Indian cuisine with tandoori specialties and extensive vegetarian menu.',
    image: null
  },
  {
    id: '12',
    name: 'The Coffee House',
    cuisine: 'Cafe',
    rating: 4.3,
    priceLevel: 1,
    distance: 0.1,
    waitTime: '5-10',
    tags: ['Coffee', 'Pastries', 'Free WiFi'],
    description: 'Cozy cafe with artisanal coffee, fresh pastries, and relaxed atmosphere.',
    image: null
  }
];

export function useRestaurants(location) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location) {
      setLoading(false);
      return;
    }

    // Simulate API call
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, you'd make an API call like:
        // const response = await fetch(`/api/restaurants?lat=${location.latitude}&lng=${location.longitude}`);
        // const data = await response.json();
        
        // For now, return mock data with some randomization
        const shuffled = [...mockRestaurants].sort(() => Math.random() - 0.5);
        setRestaurants(shuffled);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch restaurants');
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [location]);

  return { restaurants, loading, error };
}
