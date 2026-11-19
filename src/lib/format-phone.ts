const UKRAINIAN = /^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/;

// Groups a Ukrainian number the way people read it aloud; any other number is shown as stored.
export function formatPhone(phone: string): string {
  const match = UKRAINIAN.exec(phone);
  return match ? `+380 ${match.slice(1).join(" ")}` : phone;
}
