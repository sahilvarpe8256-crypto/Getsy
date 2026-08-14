/**
 * Geocoding helper for converting shop address/area text or explicit lat/lng into valid coordinates.
 */
const KNOWN_COORDINATES = [
  { keywords: ['sangamner'], lat: 19.5679, lng: 74.2153 },
  { keywords: ['kopargaon', 'kopargaun'], lat: 19.8906, lng: 74.4789 },
  { keywords: ['pune', 'punawale', 'kothrud', 'viman nagar', 'hinjewadi', 'baner'], lat: 18.5204, lng: 73.8567 },
  { keywords: ['shirdi'], lat: 19.7645, lng: 74.4762 },
  { keywords: ['nashik', 'nasik'], lat: 19.9975, lng: 73.7898 },
  { keywords: ['ahmednagar', 'nagar'], lat: 19.0948, lng: 74.7480 },
  { keywords: ['mumbai', 'thane'], lat: 19.0760, lng: 72.8777 },
];

function resolveCoordinates(address = '', area = '', explicitLat, explicitLng) {
  if (explicitLat != null && explicitLng != null) {
    const lat = parseFloat(explicitLat);
    const lng = parseFloat(explicitLng);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  const combinedText = `${address} ${area}`.toLowerCase();
  for (const item of KNOWN_COORDINATES) {
    if (item.keywords.some((k) => combinedText.includes(k))) {
      return { lat: item.lat, lng: item.lng };
    }
  }

  // Default fallback to Sangamner hub coordinates if town not found
  return { lat: 19.5679, lng: 74.2153 };
}

module.exports = { resolveCoordinates };
