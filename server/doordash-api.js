import { generateDoorDashJWT } from './doordash-jwt.js';

const DOORDASH_API_BASE = 'https://openapi.doordash.com/drive/v2';

async function doordashRequest(method, path, body = null) {
  const token = generateDoorDashJWT();

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${DOORDASH_API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `DoorDash API error: ${response.status}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function createDeliveryQuote(quoteData) {
  return doordashRequest('POST', '/quotes', {
    external_delivery_id: quoteData.external_delivery_id,
    pickup_address: quoteData.pickup_address,
    pickup_phone_number: quoteData.pickup_phone_number,
    pickup_business_name: quoteData.pickup_business_name,
    dropoff_address: quoteData.dropoff_address,
    dropoff_phone_number: quoteData.dropoff_phone_number,
    dropoff_contact_given_name: quoteData.dropoff_contact_given_name,
    dropoff_contact_family_name: quoteData.dropoff_contact_family_name,
    order_value: quoteData.order_value,
  });
}

export async function createDelivery(deliveryData) {
  return doordashRequest('POST', '/deliveries', {
    external_delivery_id: deliveryData.external_delivery_id,
    pickup_address: deliveryData.pickup_address,
    pickup_business_name: deliveryData.pickup_business_name,
    pickup_phone_number: deliveryData.pickup_phone_number,
    pickup_instructions: deliveryData.pickup_instructions || '',
    dropoff_address: deliveryData.dropoff_address,
    dropoff_business_name: deliveryData.dropoff_business_name || '',
    dropoff_phone_number: deliveryData.dropoff_phone_number,
    dropoff_instructions: deliveryData.dropoff_instructions || '',
    dropoff_contact_given_name: deliveryData.dropoff_contact_given_name,
    dropoff_contact_family_name: deliveryData.dropoff_contact_family_name || '',
    order_value: deliveryData.order_value || 0,
    tip: deliveryData.tip || 0,
    items: deliveryData.items || [],
    pickup_time: deliveryData.pickup_time || undefined,
    dropoff_time: deliveryData.dropoff_time || undefined,
  });
}

export async function getDeliveryStatus(externalDeliveryId) {
  return doordashRequest('GET', `/deliveries/${externalDeliveryId}`);
}

export async function cancelDelivery(externalDeliveryId) {
  return doordashRequest('PUT', `/deliveries/${externalDeliveryId}/cancel`, {});
}

export async function updateDelivery(externalDeliveryId, updates) {
  return doordashRequest('PATCH', `/deliveries/${externalDeliveryId}`, updates);
}
