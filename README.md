# Restaurant Tinder - "Restinder"

A Tinder-like app for finding the perfect restaurant for groups and dates. Swipe through restaurants together and find matches that everyone in your group likes!

## Features

- **Tinder-like swipe interface** - Swipe right for like, left for nope
- **Group sessions** - Create or join sessions with friends or your date
- **Location-based** - Automatically finds restaurants near you
- **Matching algorithm** - Shows restaurants that everyone in the group likes
- **Mobile-optimized** - Works great on phones with touch gestures
- **PWA ready** - Install as a mobile app

## How It Works

1. **Create or Join a Session** - Start a new group session or join an existing one
2. **Swipe Through Restaurants** - Each person swipes independently through local restaurants
3. **Find Matches** - The app shows restaurants that everyone in the group liked
4. **Choose Your Spot** - Pick from the matches and get directions!

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd restaurant-tinder
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin
- **Geolocation**: Browser Geolocation API
- **Touch Gestures**: Custom swipe implementation

## Project Structure

```
src/
├── components/
│   ├── GroupSession.jsx      # Session creation/joining
│   ├── RestaurantCard.jsx    # Swipeable restaurant cards
│   ├── MatchResults.jsx      # Results display
│   └── LoadingSpinner.jsx   # Loading states
├── hooks/
│   ├── useGeolocation.js     # Location services
│   ├── useRestaurants.js     # Restaurant data
│   └── useSwipe.js           # Touch/mouse gestures
├── utils/
│   └── session.js            # Session utilities
├── App.jsx                   # Main app component
├── main.jsx                  # App entry point
└── index.css                 # Global styles
```

## Features Implemented

✅ **Core Features**
- Tinder-like swipe interface
- Group session creation and joining
- Restaurant card display with images
- Touch and mouse gesture support
- Location-based restaurant discovery
- Matching algorithm and results
- Mobile-responsive design

✅ **UI/UX**
- Beautiful, modern interface
- Smooth animations and transitions
- Loading states and error handling
- PWA capabilities for mobile app experience

✅ **Technical**
- Component-based architecture
- Custom React hooks for logic separation
- Touch gesture support for mobile
- Geolocation integration
- Mock restaurant data (ready for real API)

## Future Enhancements

- **Real API Integration**: Connect to restaurant APIs like Yelp or Google Places
- **Real-time Sync**: Use WebSocket for live session updates
- **User Accounts**: Save preferences and history
- **Advanced Filters**: Cuisine types, price range, distance
- **Reservations**: Direct booking integration
- **Social Features**: Share matches, reviews, photos

## Mobile App Experience

The app is designed as a Progressive Web App (PWA) and works great on mobile devices:

- **Touch gestures** for natural swiping
- **Responsive design** adapts to any screen size
- **Installable** as a native app on iOS and Android
- **Offline support** for basic functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

---

Made with ❤️ for food lovers everywhere!
