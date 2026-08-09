import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type HouseholdRow = {
  id: string;
  household_name: string;
  primary_first_name: string;
  primary_last_name: string;
  primary_email: string;
  primary_phone: string | null;
  street_address: string;
  unit: string | null;
  city: string;
  province_state: string;
  postal_zip: string;
  country: string;
  notes: string | null;
  confirmation_email_status: string | null;
  couple_notification_status: string | null;
  last_email_error: string | null;
  physical_invitation_sent: boolean;
  created_at: string;
  updated_at: string;
};

type HouseholdMemberRow = {
  household_id: string;
  first_name: string;
  last_name: string;
  display_order: number;
};

export type AdminHousehold = {
  id: string;
  householdName: string;
  primaryName: string;
  primaryEmail: string;
  primaryPhone: string | null;
  address: string[];
  notes: string | null;
  confirmationEmailStatus: string | null;
  coupleNotificationStatus: string | null;
  lastEmailError: string | null;
  physicalInvitationSent: boolean;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    firstName: string;
    lastName: string;
  }>;
};

export type AdminDashboardData = {
  households: AdminHousehold[];
  totalHouseholds: number;
  totalGuests: number;
};

function addressFor(row: HouseholdRow) {
  const lines = [
    row.street_address,
    row.unit,
    `${row.city}, ${row.province_state} ${row.postal_zip}`,
    row.country
  ];

  return lines.filter((line): line is string => Boolean(line));
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createSupabaseAdminClient();
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select(
      "id, household_name, primary_first_name, primary_last_name, primary_email, primary_phone, street_address, unit, city, province_state, postal_zip, country, notes, confirmation_email_status, couple_notification_status, last_email_error, physical_invitation_sent, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (householdsError) {
    throw new Error(householdsError.message);
  }

  const householdRows = (households ?? []) as HouseholdRow[];
  const householdIds = householdRows.map((household) => household.id);
  let memberRows: HouseholdMemberRow[] = [];

  if (householdIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from("household_members")
      .select("household_id, first_name, last_name, display_order")
      .in("household_id", householdIds)
      .order("display_order", { ascending: true });

    if (membersError) {
      throw new Error(membersError.message);
    }

    memberRows = (members ?? []) as HouseholdMemberRow[];
  }

  const membersByHousehold = new Map<string, HouseholdMemberRow[]>();

  for (const member of memberRows) {
    const current = membersByHousehold.get(member.household_id) ?? [];
    current.push(member);
    membersByHousehold.set(member.household_id, current);
  }

  const mappedHouseholds = householdRows.map((household) => ({
    id: household.id,
    householdName: household.household_name,
    primaryName: `${household.primary_first_name} ${household.primary_last_name}`.trim(),
    primaryEmail: household.primary_email,
    primaryPhone: household.primary_phone,
    address: addressFor(household),
    notes: household.notes,
    confirmationEmailStatus: household.confirmation_email_status,
    coupleNotificationStatus: household.couple_notification_status,
    lastEmailError: household.last_email_error,
    physicalInvitationSent: household.physical_invitation_sent,
    createdAt: household.created_at,
    updatedAt: household.updated_at,
    members: (membersByHousehold.get(household.id) ?? []).map((member) => ({
      firstName: member.first_name,
      lastName: member.last_name
    }))
  }));

  return {
    households: mappedHouseholds,
    totalHouseholds: mappedHouseholds.length,
    totalGuests: mappedHouseholds.reduce(
      (total, household) => total + Math.max(household.members.length, 1),
      0
    )
  };
}
