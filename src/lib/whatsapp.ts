export function formatWhatsAppNumber(phone: string, countryCode: string = "595"): string {
  let clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("0")) {
    clean = countryCode + clean.substring(1);
  } else if (!clean.startsWith(countryCode)) {
    clean = countryCode + clean;
  }
  return clean;
}

export function generateWhatsAppLink(phone: string, text?: string): string {
  if (!phone) return "#";
  const number = formatWhatsAppNumber(phone);
  const baseUrl = `https://wa.me/${number}`;
  
  if (!text) return baseUrl;
  return `${baseUrl}?text=${encodeURIComponent(text)}`;
}
