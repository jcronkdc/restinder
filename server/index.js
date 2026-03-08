import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import {
  createDeliveryQuote,
  createDelivery,
  getDeliveryStatus,
  cancelDelivery,
  updateDelivery,
} from "./doordash-api.js";
import { generateDoorDashJWT } from "./doordash-jwt.js";

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory store for deliveries and webhook events
const deliveries = new Map();
const webhookEvents = new Map();

// CORS — restrict to known origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:4173"];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.) in dev
      if (!origin && process.env.NODE_ENV !== "production")
        return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

// Body size limit to prevent abuse
app.use(express.json({ limit: "100kb" }));

// Rate limiting — 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test JWT generation
app.get("/api/auth/test", (req, res) => {
  try {
    const token = generateDoorDashJWT();
    res.json({ success: true, token_preview: token.substring(0, 50) + "..." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── QUOTES ─────────────────────────────────────────────

app.post("/api/quotes", async (req, res) => {
  try {
    const {
      pickup_address,
      pickup_phone_number,
      pickup_business_name,
      dropoff_address,
      dropoff_phone_number,
      dropoff_contact_given_name,
      dropoff_contact_family_name,
      order_value,
    } = req.body;

    if (!pickup_address || !dropoff_address) {
      return res.status(400).json({
        error: "pickup_address and dropoff_address are required",
      });
    }

    const quoteData = {
      external_delivery_id: uuidv4(),
      pickup_address,
      pickup_phone_number: pickup_phone_number || "+1(555)555-5555",
      pickup_business_name: pickup_business_name || "Restaurant",
      dropoff_address,
      dropoff_phone_number: dropoff_phone_number || "+1(555)555-5555",
      dropoff_contact_given_name: dropoff_contact_given_name || "Customer",
      dropoff_contact_family_name: dropoff_contact_family_name || "",
      order_value: order_value || 0,
    };

    const quote = await createDeliveryQuote(quoteData);
    res.json(quote);
  } catch (error) {
    console.error("Quote error:", error);
    res.status(error.status || 500).json({
      error: error.message,
      details: error.details || null,
    });
  }
});

// ─── DELIVERIES ─────────────────────────────────────────

app.post("/api/deliveries", async (req, res) => {
  try {
    const {
      pickup_address,
      pickup_business_name,
      pickup_phone_number,
      pickup_instructions,
      dropoff_address,
      dropoff_business_name,
      dropoff_phone_number,
      dropoff_instructions,
      dropoff_contact_given_name,
      dropoff_contact_family_name,
      order_value,
      tip,
      items,
      pickup_time,
      dropoff_time,
    } = req.body;

    if (!pickup_address || !dropoff_address || !dropoff_phone_number) {
      return res.status(400).json({
        error:
          "pickup_address, dropoff_address, and dropoff_phone_number are required",
      });
    }

    const externalDeliveryId = uuidv4();

    const deliveryData = {
      external_delivery_id: externalDeliveryId,
      pickup_address,
      pickup_business_name: pickup_business_name || "Restaurant",
      pickup_phone_number: pickup_phone_number || "+1(555)555-5555",
      pickup_instructions: pickup_instructions || "",
      dropoff_address,
      dropoff_business_name: dropoff_business_name || "",
      dropoff_phone_number,
      dropoff_instructions: dropoff_instructions || "",
      dropoff_contact_given_name: dropoff_contact_given_name || "Customer",
      dropoff_contact_family_name: dropoff_contact_family_name || "",
      order_value: order_value || 0,
      tip: tip || 0,
      items: items || [],
      pickup_time,
      dropoff_time,
    };

    const delivery = await createDelivery(deliveryData);

    // Store delivery locally for tracking
    deliveries.set(externalDeliveryId, {
      ...delivery,
      created_at: new Date().toISOString(),
      events: [],
    });

    res.json(delivery);
  } catch (error) {
    console.error("Delivery creation error:", error);
    res.status(error.status || 500).json({
      error: error.message,
      details: error.details || null,
    });
  }
});

// Get delivery status
app.get("/api/deliveries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await getDeliveryStatus(id);
    res.json(delivery);
  } catch (error) {
    console.error("Delivery status error:", error);
    res.status(error.status || 500).json({
      error: error.message,
      details: error.details || null,
    });
  }
});

// Cancel delivery
app.put("/api/deliveries/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cancelDelivery(id);
    res.json(result);
  } catch (error) {
    console.error("Delivery cancel error:", error);
    res.status(error.status || 500).json({
      error: error.message,
      details: error.details || null,
    });
  }
});

// Update delivery
app.patch("/api/deliveries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateDelivery(id, req.body);
    res.json(result);
  } catch (error) {
    console.error("Delivery update error:", error);
    res.status(error.status || 500).json({
      error: error.message,
      details: error.details || null,
    });
  }
});

// List local deliveries (for demo tracking)
app.get("/api/deliveries", (req, res) => {
  const allDeliveries = Array.from(deliveries.values());
  res.json(allDeliveries);
});

// ─── WEBHOOKS ───────────────────────────────────────────

app.post("/api/webhooks/doordash", (req, res) => {
  try {
    const event = req.body;

    console.log("Webhook received:", JSON.stringify(event, null, 2));

    // Store the event
    const deliveryId = event.external_delivery_id;
    if (deliveryId) {
      if (!webhookEvents.has(deliveryId)) {
        webhookEvents.set(deliveryId, []);
      }
      webhookEvents.get(deliveryId).push({
        ...event,
        received_at: new Date().toISOString(),
      });

      // Update local delivery store
      if (deliveries.has(deliveryId)) {
        const delivery = deliveries.get(deliveryId);
        delivery.delivery_status =
          event.delivery_status || delivery.delivery_status;
        delivery.events.push(event);
        deliveries.set(deliveryId, delivery);
      }
    }

    // DoorDash expects a 200 response
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(200).json({ received: true });
  }
});

// Get webhook events for a delivery
app.get("/api/webhooks/events/:deliveryId", (req, res) => {
  const { deliveryId } = req.params;
  const events = webhookEvents.get(deliveryId) || [];
  res.json(events);
});

// ─── DELIVERY STATUS POLLING (SSE) ─────────────────────

app.get("/api/deliveries/:id/stream", (req, res) => {
  const { id } = req.params;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Poll DoorDash every 10 seconds and send updates
  const interval = setInterval(async () => {
    try {
      const delivery = await getDeliveryStatus(id);
      res.write(`data: ${JSON.stringify(delivery)}\n\n`);

      // Stop polling if delivery is complete or cancelled
      if (
        ["delivered", "cancelled", "returned"].includes(
          delivery.delivery_status,
        )
      ) {
        clearInterval(interval);
        res.end();
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
  }, 10000);

  // Send initial status
  getDeliveryStatus(id)
    .then((delivery) => {
      res.write(`data: ${JSON.stringify(delivery)}\n\n`);
    })
    .catch((error) => {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    });

  req.on("close", () => {
    clearInterval(interval);
  });
});

// ─── START SERVER ───────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Restinder API server running on http://localhost:${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/api/webhooks/doordash`);
  console.log("");

  // Validate credentials
  try {
    generateDoorDashJWT();
    console.log("DoorDash JWT generation: OK");
  } catch (error) {
    console.warn("DoorDash JWT generation: FAILED -", error.message);
    console.warn(
      "Set your credentials in server/.env to enable DoorDash integration",
    );
  }
});
