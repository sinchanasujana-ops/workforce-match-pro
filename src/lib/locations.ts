export const INDIAN_LOCATIONS = [
  "Bengaluru, Karnataka", "Mysuru, Karnataka", "Hubballi, Karnataka", "Mangaluru, Karnataka",
  "Belagavi, Karnataka", "Kalaburagi, Karnataka", "Davanagere, Karnataka", "Shivamogga, Karnataka",
  "Tumakuru, Karnataka", "Ballari, Karnataka", "Udupi, Karnataka", "Hassan, Karnataka",
  "Mumbai, Maharashtra", "Pune, Maharashtra", "Nagpur, Maharashtra", "Nashik, Maharashtra",
  "Thane, Maharashtra", "Aurangabad, Maharashtra", "Solapur, Maharashtra",
  "Delhi, Delhi", "Noida, Uttar Pradesh", "Ghaziabad, Uttar Pradesh", "Lucknow, Uttar Pradesh",
  "Kanpur, Uttar Pradesh", "Varanasi, Uttar Pradesh", "Agra, Uttar Pradesh",
  "Gurugram, Haryana", "Faridabad, Haryana", "Chandigarh, Chandigarh",
  "Jaipur, Rajasthan", "Jodhpur, Rajasthan", "Kota, Rajasthan",
  "Ahmedabad, Gujarat", "Surat, Gujarat", "Vadodara, Gujarat", "Rajkot, Gujarat",
  "Chennai, Tamil Nadu", "Coimbatore, Tamil Nadu", "Madurai, Tamil Nadu", "Tiruppur, Tamil Nadu",
  "Salem, Tamil Nadu", "Tiruchirappalli, Tamil Nadu",
  "Hyderabad, Telangana", "Warangal, Telangana",
  "Visakhapatnam, Andhra Pradesh", "Vijayawada, Andhra Pradesh", "Guntur, Andhra Pradesh",
  "Kochi, Kerala", "Thiruvananthapuram, Kerala", "Kozhikode, Kerala", "Thrissur, Kerala", "Munnar, Kerala",
  "Kolkata, West Bengal", "Siliguri, West Bengal", "Asansol, West Bengal",
  "Bhopal, Madhya Pradesh", "Indore, Madhya Pradesh", "Gwalior, Madhya Pradesh",
  "Patna, Bihar", "Bhubaneswar, Odisha", "Raipur, Chhattisgarh", "Ranchi, Jharkhand",
  "Guwahati, Assam", "Dehradun, Uttarakhand", "Amritsar, Punjab", "Ludhiana, Punjab", "Goa, Goa",
];

export function suggestLocations(query: string, extra: string[] = [], limit = 7) {
  const pool = Array.from(new Set([...extra, ...INDIAN_LOCATIONS]));
  const q = query.trim().toLowerCase();
  if (!q) return pool.slice(0, limit);
  const starts = pool.filter((l) => l.toLowerCase().startsWith(q));
  const contains = pool.filter((l) => !l.toLowerCase().startsWith(q) && l.toLowerCase().includes(q));
  return [...starts, ...contains].slice(0, limit);
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { city?: string; locality?: string; principalSubdivision?: string };
    const city = data.city || data.locality;
    if (!city) return data.principalSubdivision ?? null;
    return data.principalSubdivision ? `${city}, ${data.principalSubdivision}` : city;
  } catch {
    return null;
  }
}
