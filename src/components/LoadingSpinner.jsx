import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
