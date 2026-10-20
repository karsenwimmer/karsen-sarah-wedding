// Fictional, public fixtures. Real invitation access must be checked on the server.
export const demoWedding = {
  names: "Alex & Jamie",
  date: "Saturday, June 12, 2027",
  location: "Oakville, Ontario",
  deadline: "May 12, 2027",
  ceremony: { name: "The Garden Chapel", address: "12 Chapel Lane, Oakville, ON", time: "2:00 PM" },
  reception: { name: "Willow House", address: "48 Willow Road, Oakville, ON", time: "4:30 PM" }
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

export const meals = [
  { id: "chicken", label: "Herb-roasted chicken" },
  { id: "salmon", label: "Lemon & dill salmon" },
  { id: "vegetarian", label: "Wild mushroom risotto (vegetarian)" },
  { id: "children", label: "Children’s meal" }
] as const;

export type Meal = "" | (typeof meals)[number]["id"];
export type GuestResponse = { guestId: string; attendance: "" | "yes" | "no"; meal: Meal; dietary: string };
export type DemoResponse = { guests: GuestResponse[]; note: string; savedAt: string };

export function findInvitation(code: string) {
  const normalized = code.toUpperCase().replace(/[\s-]/g, "");
  return demoInvitations.find((invite) => invite.code === normalized);
}

export function storageKey(invite: DemoInvitation) {
  return `wedding-rsvp-demo:v1:${invite.code}`;
}

export function emptyResponses(invite: DemoInvitation): GuestResponse[] {
  return invite.guests.map((guest) => ({ guestId: guest.id, attendance: "", meal: "", dietary: "" }));
}

export function responseErrors(invite: DemoInvitation, responses: GuestResponse[]) {
  const errors: Record<string, string> = {};
  for (const guest of invite.guests) {
    const answer = responses.find((response) => response.guestId === guest.id);
    if (!answer || !["yes", "no"].includes(answer.attendance)) {
      errors[guest.id] = "Please choose attending or declining.";
    } else if (invite.reception && answer.attendance === "yes" &&
      !meals.some((meal) => meal.id === answer.meal && (guest.child || meal.id !== "children"))) {
      errors[guest.id] = "Please choose a meal.";
    }
  }
  return errors;
}

export function readResponse(invite: DemoInvitation, raw: string | null): DemoResponse | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as DemoResponse;
    if (!Array.isArray(data.guests) || typeof data.note !== "string" || data.note.length > 1000 ||
      typeof data.savedAt !== "string" || !Number.isFinite(Date.parse(data.savedAt))) return null;
    const guests = invite.guests.map((guest) => {
      const answer = data.guests.find((item) => item?.guestId === guest.id);
      if (!answer || typeof answer.dietary !== "string" || answer.dietary.length > 300) throw new Error("Invalid response");
      return { guestId: guest.id, attendance: answer.attendance,
        meal: invite.reception && answer.attendance === "yes" ? answer.meal : "" as Meal,
        dietary: answer.attendance === "yes" ? answer.dietary : "" };
    });
    if (Object.keys(responseErrors(invite, guests)).length) return null;
    return { guests, note: data.note, savedAt: data.savedAt };
  } catch {
    return null;
  }
}
