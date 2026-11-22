// Event details supplied by the couple. Guest fixtures below are fictional and public.
// Real invitation access must be checked on the server.
export const demoWedding = {
  names: "Luca & Victoria",
  date: "August 28, 2027",
  location: "Mississauga, Ontario",
  ceremony: { name: "Saints Peter and Paul Parish", address: "4070 Central Parkway East, Mississauga, Ontario L4Z 1T6", time: "12:00 PM" },
  reception: { name: "The Venetian Banquet Hall", address: "219 Romina Drive, Concord, Ontario L4K 4V3", time: "5:30 PM" }
};

export type DemoGuest = { id: string; name: string; child?: boolean };
export type DemoInvitation = {
  code: string;
  label: string;
  household: string;
  reception: boolean;
  guests: DemoGuest[];
};

export const demoInvitations: DemoInvitation[] = [
  { code: "ROSE24", label: "A couple", household: "Jordan & Taylor", reception: true,
    guests: [{ id: "jordan", name: "Jordan Morgan" }, { id: "taylor", name: "Taylor Morgan" }] },
  { code: "OAK123", label: "A family", household: "The Bennett Family", reception: true,
    guests: [{ id: "sam", name: "Sam Bennett" }, { id: "riley", name: "Riley Bennett" },
      { id: "avery", name: "Avery Bennett", child: true }, { id: "charlie", name: "Charlie Bennett", child: true }] },
  { code: "FERN26", label: "Ceremony only", household: "Casey & Drew", reception: false,
    guests: [{ id: "casey", name: "Casey Ellis" }, { id: "drew", name: "Drew Ellis" }] }
];

export type GuestResponse = { guestId: string; attendance: "" | "yes" | "no"; dietary: string };
export type DemoResponse = { guests: GuestResponse[]; note: string; savedAt: string };

export function findInvitation(code: string) {
  const normalized = code.toUpperCase().replace(/[\s-]/g, "");
  return demoInvitations.find((invite) => invite.code === normalized);
}

export function storageKey(invite: DemoInvitation) {
  return `wedding-rsvp-demo:v1:${invite.code}`;
}

export function emptyResponses(invite: DemoInvitation): GuestResponse[] {
  return invite.guests.map((guest) => ({ guestId: guest.id, attendance: "", dietary: "" }));
}

export function responseErrors(invite: DemoInvitation, responses: GuestResponse[]) {
  const errors: Record<string, string> = {};
  for (const guest of invite.guests) {
    const answer = responses.find((response) => response.guestId === guest.id);
    if (!answer || !["yes", "no"].includes(answer.attendance)) {
      errors[guest.id] = "Please choose attending or declining.";
    }
  }
  return errors;
}

export function readResponse(invite: DemoInvitation, raw: string | null): DemoResponse | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Omit<DemoResponse, "guests"> & { guests: (GuestResponse & { meal?: unknown })[] };
    if (!Array.isArray(data.guests) || typeof data.note !== "string" || data.note.length > 1000 ||
      typeof data.savedAt !== "string" || !Number.isFinite(Date.parse(data.savedAt))) return null;
    const guests = invite.guests.map((guest) => {
      const answer = data.guests.find((item) => item?.guestId === guest.id);
      if (!answer || typeof answer.dietary !== "string" || answer.dietary.length > 300) throw new Error("Invalid response");
      let dietary = invite.reception && answer.attendance === "yes" ? answer.dietary.trim() : "";
      // Preserve an alternative requested in an earlier demo when no dietary note was entered.
      if (!dietary && invite.reception && answer.attendance === "yes") {
        if (answer.meal === "vegetarian") dietary = "Vegetarian meal requested previously";
        if (answer.meal === "salmon") dietary = "Fish meal requested previously";
        if (answer.meal === "children") dietary = "Children’s meal requested previously";
      }
      return { guestId: guest.id, attendance: answer.attendance, dietary };
    });
    if (Object.keys(responseErrors(invite, guests)).length) return null;
    return { guests, note: data.note, savedAt: data.savedAt };
  } catch {
    return null;
  }
}
