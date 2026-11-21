const IRISH_MOBILE = /^\+353(8\d)(\d{3})(\d{4})$/;

// Groups an Irish mobile number the way people read it aloud; any other number is shown as stored.
export function formatPhone(phone: string): string {
  const match = IRISH_MOBILE.exec(phone);
  return match ? `+353 ${match.slice(1).join(" ")}` : phone;
}
