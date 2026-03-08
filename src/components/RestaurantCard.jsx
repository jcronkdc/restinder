import React from "react";
import { Heart, X, Star, DollarSign, Clock, MapPin } from "lucide-react";

export function RestaurantCard({ restaurant, isDragging, direction }) {
  const getRotation = () => {
    if (!isDragging) return 0;
    return direction === "right" ? 10 : direction === "left" ? -10 : 0;
  };

  const getOverlay = () => {
    if (!isDragging) return null;
    if (direction === "right") {
      return (
        <div className="like-overlay">
          <Heart className="w-24 h-24 text-green-500" />
        </div>
      );
    }
    if (direction === "left") {
      return (
        <div className="nope-overlay">
          <X className="w-24 h-24 text-red-500" />
        </div>
      );
    }
    return null;
  };

  const getPriceLevel = (level) => {
    return Array(level)
      .fill("")
      .map((_, i) => (
        <DollarSign key={i} className="w-4 h-4 text-yellow-500" />
      ));
  };

  return (
    <div
      className="swipe-card"
      style={{
        transform: `rotate(${getRotation()}deg)`,
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      {getOverlay()}

      <div className="relative h-full">
        {/* Restaurant Image */}
        <div className="h-3/5 bg-gray-200 relative overflow-hidden">
          <img
            src={
              restaurant.image ||
              `https://picsum.photos/seed/${restaurant.id}/400/300.jpg`
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold">{restaurant.rating}</span>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="h-2/5 bg-white p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-800">
              {restaurant.name}
            </h3>
            <div className="flex items-center space-x-1">
              {getPriceLevel(restaurant.priceLevel || 2)}
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{restaurant.distance || "0.5"} mi away</span>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>
                {restaurant.cuisine || "American"} •{" "}
                {restaurant.waitTime || "15-20"} min
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {restaurant.tags?.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {restaurant.description && (
            <p className="mt-3 text-sm text-gray-500 line-clamp-2">
              {restaurant.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
