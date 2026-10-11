// Regional tags that map to a mining zone; country names come from the registry.
const REGIONS = [
  { keys: ['copperbelt'], label: 'Zambia Copperbelt', lat: -15.416, lng: 28.283 },
  { keys: ['freeport'], label: 'UK Freeport Zone', lat: 50.375, lng: -4.716 }
];

export function parseLocation(query, countries = []) {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const nums = q.match(/-?\d+(\.\d+)?/g);
  if (nums && nums.length === 2 && /^[-\d.\s,°nsew]+$/.test(q)) {
    const lat = parseFloat(nums[0]);
    const lng = parseFloat(nums[1]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng, label: 'GPS coordinate' };
    }
    return null;
  }

  const hit = REGIONS.find((r) => r.keys.some((k) => q.includes(k)));
  if (hit) return { lat: hit.lat, lng: hit.lng, label: hit.label };

  const find = (fn) => countries.find((c) => fn(c.name.toLowerCase()));
  const country = find((n) => n === q) || find((n) => n.startsWith(q)) || find((n) => n.includes(q));
  return country ? { lat: country.lat, lng: country.lng, label: country.name } : null;
}
