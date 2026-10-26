// Public, fictional households for design review only. These codes grant no real access.
export type Guest = { id: string; name: string; child?: boolean };
export type Invite = { code: string; name: string; reception: boolean; guests: Guest[]; mealsOpen?: boolean };
export const invitations: Invite[] = [
  { code: "HARBOUR", name: "Avery & Jordan", reception: true,
    guests: [{ id: "avery", name: "Avery Morgan" }, { id: "jordan", name: "Jordan Morgan" }] },
  { code: "FAMILY", name: "The Parker Family", reception: true,
    guests: [{ id: "alex", name: "Alex Parker" }, { id: "robin", name: "Robin Parker" },
      { id: "ellie", name: "Ellie Parker", child: true }, { id: "leo", name: "Leo Parker", child: true }] },
  { code: "CHURCH", name: "Casey & Drew", reception: false,
    guests: [{ id: "casey", name: "Casey Ellis" }, { id: "drew", name: "Drew Ellis" }] }
];
export const mealOptions = [
  { value: "chicken", label: "Chicken" },
  { value: "fish", label: "Fish" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "children", label: "Children’s meal" }
] as const;
export type Answer = { id: string; attending: "" | "yes" | "no"; meal: string; dietary: string };
export type Reply = { answers: Answer[]; note: string; savedAt: string };
export function findInvite(code: string) {
  return invitations.find(invite => invite.code === code.toUpperCase().replace(/[\s-]/g, ""));
}
export function replyKey(invite: Invite) { return `ks-invitation-preview:v1:${invite.code}`; }
export function blankAnswers(invite: Invite): Answer[] {
  return invite.guests.map(guest => ({ id: guest.id, attending: "", meal: "", dietary: "" }));
}
export function validateAnswers(invite: Invite, answers: Answer[]) {
  const errors: Record<string, string> = {};
  for (const guest of invite.guests) {
    const answer = answers.find(item => item.id === guest.id);
    if (!answer || !["yes", "no"].includes(answer.attending)) errors[guest.id] = "Please let us know if you’ll be joining us.";
    else if (invite.reception && invite.mealsOpen !== false && answer.attending === "yes" &&
      !mealOptions.some(meal => meal.value === answer.meal && (guest.child || meal.value !== "children"))) {
      errors[guest.id] = "Please choose a meal for this guest.";
    }
  }
  return errors;
}
export function cleanAnswers(invite: Invite, answers: Answer[]): Answer[] {
  return invite.guests.map(guest => {
    const answer = answers.find(item => item.id === guest.id)!;
    return { id: guest.id, attending: answer.attending,
      meal: invite.reception && invite.mealsOpen !== false && answer.attending === "yes" ? answer.meal : "",
      dietary: answer.attending === "yes" ? answer.dietary.trim() : "" };
  });
}
export function readReply(invite: Invite, raw: string | null): Reply | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (typeof data.note !== "string" || data.note.length > 1000 || typeof data.savedAt !== "string" ||
      !Number.isFinite(Date.parse(data.savedAt)) || !Array.isArray(data.answers)) return null;
    const answers = invite.guests.map(guest => {
      const answer = data.answers.find((item: unknown) => typeof item === "object" && item !== null && "id" in item && item.id === guest.id);
      if (!answer || typeof answer.dietary !== "string" || answer.dietary.length > 300 || typeof answer.meal !== "string") throw new Error("Invalid reply");
      return { id: guest.id, attending: answer.attending, meal: answer.meal, dietary: answer.dietary } as Answer;
    });
    if (Object.keys(validateAnswers(invite, answers)).length) return null;
    return { answers: cleanAnswers(invite, answers), note: data.note, savedAt: data.savedAt };
  } catch { return null; }
}
