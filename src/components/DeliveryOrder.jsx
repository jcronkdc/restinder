import React, { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  DollarSign,
  Package,
  Truck,
  Clock,
} from "lucide-react";

const DELIVERY_STATUSES = {
  created: { label: "Order Created", color: "bg-blue-500/20 text-blue-300" },
  confirmed: { label: "Confirmed", color: "bg-blue-500/20 text-blue-300" },
  enroute_to_pickup: {
    label: "Dasher En Route to Pickup",
    color: "bg-yellow-500/20 text-yellow-300",
  },
  arrived_at_pickup: {
    label: "Dasher at Restaurant",
    color: "bg-yellow-500/20 text-yellow-300",
  },
  picked_up: {
    label: "Order Picked Up",
    color: "bg-orange-500/20 text-orange-300",
  },
  enroute_to_dropoff: {
    label: "On the Way to You",
    color: "bg-orange-500/20 text-orange-300",
  },
  arrived_at_dropoff: {
    label: "Dasher Arriving",
    color: "bg-green-500/20 text-green-300",
  },
  delivered: { label: "Delivered!", color: "bg-green-500/20 text-green-300" },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-300" },
  returned: { label: "Returned", color: "bg-red-500/20 text-red-300" },
};

const PROGRESS_STEPS = [
  "created",
  "confirmed",
  "enroute_to_pickup",
  "arrived_at_pickup",
  "picked_up",
  "enroute_to_dropoff",
  "arrived_at_dropoff",
  "delivered",
];

export function DeliveryOrder({ restaurant, onBack, onDeliveryCreated }) {
  const [step, setStep] = useState("form"); // form | quote | tracking
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [trackingData, setTrackingData] = useState(null);

  const [form, setForm] = useState({
    dropoff_address: "",
    dropoff_phone_number: "",
    dropoff_contact_given_name: "",
    dropoff_contact_family_name: "",
    dropoff_instructions: "",
    tip: 500, // $5.00 in cents
  });

  const API_BASE = "http://localhost:3001/api";

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGetQuote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_address:
            restaurant.address || "1 Market St, San Francisco, CA 94105",
          pickup_business_name: restaurant.name,
          pickup_phone_number: restaurant.phone || "+1(555)555-5555",
          dropoff_address: form.dropoff_address,
          dropoff_phone_number: form.dropoff_phone_number,
          dropoff_contact_given_name: form.dropoff_contact_given_name,
          dropoff_contact_family_name: form.dropoff_contact_family_name,
          order_value: 2500, // $25 placeholder
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get quote");
      }

      setQuote(data);
      setStep("quote");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelivery = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_address:
            restaurant.address || "1 Market St, San Francisco, CA 94105",
          pickup_business_name: restaurant.name,
          pickup_phone_number: restaurant.phone || "+1(555)555-5555",
          dropoff_address: form.dropoff_address,
          dropoff_phone_number: form.dropoff_phone_number,
          dropoff_contact_given_name: form.dropoff_contact_given_name,
          dropoff_contact_family_name: form.dropoff_contact_family_name,
          dropoff_instructions: form.dropoff_instructions,
          order_value: 2500,
          tip: form.tip,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create delivery");
      }

      setDelivery(data);
      setStep("tracking");
      onDeliveryCreated?.(data);

      // Start polling for status updates
      pollDeliveryStatus(data.external_delivery_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pollDeliveryStatus = (deliveryId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/deliveries/${deliveryId}`);
        const data = await response.json();
        setTrackingData(data);

        if (
          ["delivered", "cancelled", "returned"].includes(data.delivery_status)
        ) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 10000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  const handleCancelDelivery = async () => {
    if (!delivery) return;
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/deliveries/${delivery.external_delivery_id}/cancel`,
        {
          method: "PUT",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel delivery");
      }

      setTrackingData((prev) => ({ ...prev, delivery_status: "cancelled" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercent = (status) => {
    const idx = PROGRESS_STEPS.indexOf(status);
    if (idx === -1) return 0;
    return ((idx + 1) / PROGRESS_STEPS.length) * 100;
  };

  const currentStatus =
    trackingData?.delivery_status || delivery?.delivery_status || "created";
  const statusInfo =
    DELIVERY_STATUSES[currentStatus] || DELIVERY_STATUSES.created;

  return (
    <div className="flex flex-col">
      <header className="glass rounded-2xl mb-4">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-brand-muted" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {step === "tracking" ? "Track Delivery" : "Order Delivery"}
              </h1>
              <p className="text-sm text-brand-muted">{restaurant.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div>
        <div className="max-w-md mx-auto">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">
                Dismiss
              </button>
            </div>
          )}

          {/* ─── DELIVERY FORM ─── */}
          {step === "form" && (
            <form onSubmit={handleGetQuote} className="space-y-4">
              <div className="glass rounded-2xl p-5">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-brand-purple" />
                  <span>Delivery Details</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-muted mb-1">
                      <span className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Your Name</span>
                      </span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={form.dropoff_contact_given_name}
                        onChange={(e) =>
                          updateForm(
                            "dropoff_contact_given_name",
                            e.target.value,
                          )
                        }
                        placeholder="First name"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-brand-muted focus:outline-none focus:border-brand-purple/50"
                        required
                      />
                      <input
                        type="text"
                        value={form.dropoff_contact_family_name}
                        onChange={(e) =>
                          updateForm(
                            "dropoff_contact_family_name",
                            e.target.value,
                          )
                        }
                        placeholder="Last name"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-brand-muted focus:outline-none focus:border-brand-purple/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-muted mb-1">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>Delivery Address</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.dropoff_address}
                      onChange={(e) =>
                        updateForm("dropoff_address", e.target.value)
                      }
                      placeholder="123 Main St, City, State ZIP"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-brand-muted focus:outline-none focus:border-brand-purple/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-muted mb-1">
                      <span className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>Phone Number</span>
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={form.dropoff_phone_number}
                      onChange={(e) =>
                        updateForm("dropoff_phone_number", e.target.value)
                      }
                      placeholder="+1(555)555-5555"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-brand-muted focus:outline-none focus:border-brand-purple/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-muted mb-1">
                      Delivery Instructions (optional)
                    </label>
                    <textarea
                      value={form.dropoff_instructions}
                      onChange={(e) =>
                        updateForm("dropoff_instructions", e.target.value)
                      }
                      placeholder="Gate code, building name, etc."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-brand-muted focus:outline-none focus:border-brand-purple/50"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-muted mb-1">
                      <span className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Dasher Tip</span>
                      </span>
                    </label>
                    <div className="flex space-x-2">
                      {[0, 300, 500, 800, 1000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => updateForm("tip", amount)}
                          className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
                            form.tip === amount
                              ? "gradient-bg text-white"
                              : "bg-white/5 text-brand-muted hover:bg-white/10"
                          }`}
                        >
                          {amount === 0
                            ? "None"
                            : `$${(amount / 100).toFixed(0)}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-2 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-brand-purple" />
                  <span>Pickup from</span>
                </h3>
                <p className="text-white font-medium">{restaurant.name}</p>
                <p className="text-sm text-brand-muted">
                  {restaurant.cuisine} • {restaurant.distance || "0.5"} mi away
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-bg text-white py-4 px-4 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Getting Quote..." : "Get Delivery Quote"}
              </button>
            </form>
          )}

          {/* ─── QUOTE REVIEW ─── */}
          {step === "quote" && quote && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5">
                <h2 className="text-lg font-bold text-white mb-4">
                  Delivery Quote
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-brand-muted">Delivery Fee</span>
                    <span className="font-semibold text-white">
                      ${((quote.fee || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-brand-muted">Dasher Tip</span>
                    <span className="font-semibold text-white">
                      ${(form.tip / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-brand-muted">Estimated Pickup</span>
                    <span className="font-semibold text-white flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {quote.pickup_time_estimated
                          ? new Date(
                              quote.pickup_time_estimated,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "ASAP"}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-brand-muted">Estimated Delivery</span>
                    <span className="font-semibold text-white flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {quote.dropoff_time_estimated
                          ? new Date(
                              quote.dropoff_time_estimated,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "ASAP"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-brand-purple"></div>
                    <div className="w-0.5 h-8 bg-white/20"></div>
                    <div className="w-3 h-3 rounded-full bg-brand-green"></div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="font-medium text-white">
                        {restaurant.name}
                      </p>
                      <p className="text-sm text-brand-muted">
                        {restaurant.address || "Restaurant address"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {form.dropoff_contact_given_name}{" "}
                        {form.dropoff_contact_family_name}
                      </p>
                      <p className="text-sm text-brand-muted">
                        {form.dropoff_address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 glass text-white py-3 px-4 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateDelivery}
                  disabled={loading}
                  className="flex-1 gradient-bg text-white py-3 px-4 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Confirming..." : "Confirm Delivery"}
                </button>
              </div>
            </div>
          )}

          {/* ─── DELIVERY TRACKING ─── */}
          {step === "tracking" && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    Delivery Status
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="gradient-bg h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getProgressPercent(currentStatus)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-brand-muted">
                    <span>Ordered</span>
                    <span>Picked Up</span>
                    <span>Delivered</span>
                  </div>
                </div>

                {/* Dasher info */}
                {trackingData?.dasher && (
                  <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/10">
                    <p className="text-sm font-medium text-white">
                      Your Dasher
                    </p>
                    <p className="text-sm text-brand-muted">
                      {trackingData.dasher.first_name}{" "}
                      {trackingData.dasher.last_name}
                    </p>
                    {trackingData.dasher.phone_number && (
                      <a
                        href={`tel:${trackingData.dasher.phone_number}`}
                        className="text-sm text-brand-purple underline"
                      >
                        {trackingData.dasher.phone_number}
                      </a>
                    )}
                  </div>
                )}

                {/* Tracking URL */}
                {(trackingData?.tracking_url || delivery?.tracking_url) && (
                  <a
                    href={trackingData?.tracking_url || delivery?.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-white/5 text-brand-muted py-2 px-4 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors mb-4 border border-white/10"
                  >
                    View Live Tracking Map
                  </a>
                )}

                {/* Route details */}
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-brand-purple"></div>
                    <div className="w-0.5 h-8 bg-white/20"></div>
                    <div className="w-3 h-3 rounded-full bg-brand-green"></div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="font-medium text-white">
                        {restaurant.name}
                      </p>
                      <p className="text-sm text-brand-muted">Pickup</p>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {form.dropoff_address}
                      </p>
                      <p className="text-sm text-brand-muted">Dropoff</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery ID for reference */}
              <div className="glass rounded-2xl p-5">
                <p className="text-xs text-brand-muted mb-1">Delivery ID</p>
                <p className="text-sm font-mono text-white/80 break-all">
                  {delivery?.external_delivery_id}
                </p>
              </div>

              {/* Cancel button */}
              {!["delivered", "cancelled", "returned"].includes(
                currentStatus,
              ) && (
                <button
                  onClick={handleCancelDelivery}
                  disabled={loading}
                  className="w-full bg-red-500/10 text-red-400 py-3 px-4 rounded-xl font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50 border border-red-500/20"
                >
                  {loading ? "Cancelling..." : "Cancel Delivery"}
                </button>
              )}

              {currentStatus === "delivered" && (
                <div className="text-center py-4">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-lg font-semibold text-white">
                    Enjoy your meal!
                  </p>
                  <button
                    onClick={onBack}
                    className="mt-4 gradient-bg text-white py-3 px-6 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Back to Home
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
