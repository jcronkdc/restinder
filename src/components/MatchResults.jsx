import React from "react";
import {
  Heart,
  MapPin,
  Star,
  DollarSign,
  Clock,
  ArrowLeft,
  ExternalLink,
  Truck,
} from "lucide-react";

export function MatchResults({ matches, onRestart, onOrderDelivery }) {
  const getTopMatch = () => matches[0];

  const getPriceLevel = (level) => {
    return Array(level || 2)
      .fill("")
      .map((_, i) => (
        <DollarSign key={i} className="w-4 h-4 text-yellow-500" />
      ));
  };

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onRestart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                No Matches Found
              </h1>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Perfect Matches
            </h2>
            <p className="text-gray-600 mb-6">
              Looks like everyone has different tastes! Try swiping again or
              expand your search area.
            </p>
            <button
              onClick={onRestart}
              className="bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onRestart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">Your Matches!</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Heart className="w-4 h-4 text-red-500" />
              <span>{matches.length} matches</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Top Match */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="relative">
              <img
                src={
                  getTopMatch().image ||
                  `https://picsum.photos/seed/${getTopMatch().id}/600/300.jpg`
                }
                alt={getTopMatch().name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Top Match! 🎉
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {getTopMatch().name}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{getTopMatch().rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getPriceLevel(getTopMatch().priceLevel)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{getTopMatch().waitTime || "15-20"} min</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{getTopMatch().distance || "0.5"} miles away</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {getTopMatch().tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {getTopMatch().description && (
                  <p className="text-gray-600">{getTopMatch().description}</p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => onOrderDelivery?.(getTopMatch())}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Truck className="w-5 h-5" />
                  <span>Order Delivery via DoorDash</span>
                </button>
                <div className="flex space-x-3">
                  <button className="flex-1 bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>Get Directions</span>
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                    Call Restaurant
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Other Matches */}
          {matches.length > 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Other Matches
              </h3>
              <div className="space-y-3">
                {matches.slice(1, 4).map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    className="bg-white rounded-lg shadow p-4 flex items-center space-x-4"
                  >
                    <img
                      src={
                        restaurant.image ||
                        `https://picsum.photos/seed/${restaurant.id}/100/100.jpg`
                      }
                      alt={restaurant.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {restaurant.name}
                      </h4>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span>{restaurant.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getPriceLevel(restaurant.priceLevel)}
                        </div>
                        <span>{restaurant.distance || "0.5"} mi</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onOrderDelivery?.(restaurant)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                      title="Order Delivery"
                    >
                      <Truck className="w-4 h-4 text-green-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={onRestart}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Start New Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
