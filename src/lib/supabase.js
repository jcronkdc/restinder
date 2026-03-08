import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kfmysuqioesnbclvncpr.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbXlzdXFpb2VzbmJjbHZuY3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzE0NDYsImV4cCI6MjA4NjM0NzQ0Nn0.QVmr1yx1J-fXHxBlqjPDuvZOcI0MxPx9lweFi25ciL8";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a stable device ID (persisted in localStorage)
export function getDeviceId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("rs_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("rs_device_id", id);
  }
  return id;
}

// Generate a 6-char partner code
export function generatePartnerCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
