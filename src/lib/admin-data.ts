import { hasAdminSession } from "@/lib/admin-auth";
import type {
  AdminHouseholdInput,
  InvitationPackage,
  InvitationSource,
  InvitationStatus
} from "@/lib/admin-household-schema";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const householdSelect =
  "id, household_name, primary_first_name, primary_last_name, primary_email, primary_phone, street_address, unit, city, province_state, postal_zip, country, notes, internal_notes, confirmation_email_status, couple_notification_status, last_email_error, physical_invitation_sent, invitation_source, invitation_status, invitation_package, created_at, updated_at";

type HouseholdRow = {
  id: string;
  household_name: string;
  primary_first_name: string | null;
  primary_last_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  street_address: string | null;
  unit: string | null;
  city: string | null;
  province_state: string | null;
  postal_zip: string | null;
  country: string | null;
  notes: string | null;
  internal_notes: string | null;
  confirmation_email_status: string | null;
  couple_notification_status: string | null;
  last_email_error: string | null;
  physical_invitation_sent: boolean;
  invitation_source: InvitationSource;
  invitation_status: InvitationStatus;
  invitation_package: InvitationPackage;
  created_at: string;
  updated_at: string;
};

type HouseholdMemberRow = {
  household_id: string;
  first_name: string;
  last_name: string;
  display_order: number;
};

export type AdminHouseholdMember = {
  firstName: string;
  lastName: string;
};

export type AdminHousehold = {
  id: string;
  householdName: string;
  primaryFirstName: string | null;
  primaryLastName: string | null;
  primaryName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  streetAddress: string | null;
  unit: string | null;
  city: string | null;
  provinceState: string | null;
  postalZip: string | null;
  country: string | null;
  address: string[];
  notes: string | null;
  internalNotes: string | null;
  confirmationEmailStatus: string | null;
  coupleNotificationStatus: string | null;
  lastEmailError: string | null;
  physicalInvitationSent: boolean;
  invitationSource: InvitationSource;
  invitationStatus: InvitationStatus;
  invitationPackage: InvitationPackage;
  missingInformation: string[];
  createdAt: string;
  updatedAt: string;
  members: AdminHouseholdMember[];
};

export type AdminDashboardData = {
  households: AdminHousehold[];
  totalHouseholds: number;
  totalGuests: number;
  needsReview: number;
  readyToInvite: number;
};

function addressFor(row: HouseholdRow) {
  const regionPostal = [row.province_state, row.postal_zip].filter(Boolean).join(" ");
  const locality = [row.city, regionPostal || null].filter(Boolean).join(", ");
  const lines = [row.street_address, row.unit, locality || null, row.country];

  return lines.filter((line): line is string => Boolean(line));
}

function missingInformationFor(row: HouseholdRow, members: HouseholdMemberRow[]) {
  const missing: string[] = [];

  if (!row.primary_first_name || !row.primary_last_name) {
    missing.push("primary contact name");
  }

  if (!row.primary_email && !row.primary_phone) {
    missing.push("email or phone");
  }

  if (
    row.invitation_package === "full_celebration" &&
    (!row.street_address || !row.city || !row.province_state || !row.postal_zip)
  ) {
    missing.push("mailing address");
  }

  if (members.length === 0) {
    missing.push("invited people");
  }

  return missing;
}

function mapHousehold(row: HouseholdRow, members: HouseholdMemberRow[]): AdminHousehold {
  const primaryName = [row.primary_first_name, row.primary_last_name].filter(Boolean).join(" ");

  return {
    id: row.id,
    householdName: row.household_name,
    primaryFirstName: row.primary_first_name,
    primaryLastName: row.primary_last_name,
    primaryName: primaryName || row.household_name,
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    streetAddress: row.street_address,
    unit: row.unit,
    city: row.city,
    provinceState: row.province_state,
    postalZip: row.postal_zip,
    country: row.country,
    address: addressFor(row),
    notes: row.notes,
    internalNotes: row.internal_notes,
    confirmationEmailStatus: row.confirmation_email_status,
    coupleNotificationStatus: row.couple_notification_status,
    lastEmailError: row.last_email_error,
    physicalInvitationSent: row.physical_invitation_sent,
    invitationSource: row.invitation_source,
    invitationStatus: row.invitation_status,
    invitationPackage: row.invitation_package,
    missingInformation: missingInformationFor(row, members),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    members: members.map((member) => ({
      firstName: member.first_name,
      lastName: member.last_name
    }))
  };
}

async function requireAdminAccess() {
  if (!(await hasAdminSession())) {
    throw new Error("Unauthorized.");
  }
}

async function getMembersByHousehold(householdIds: string[]) {
  if (householdIds.length === 0) {
    return new Map<string, HouseholdMemberRow[]>();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id, first_name, last_name, display_order")
    .in("household_id", householdIds)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const membersByHousehold = new Map<string, HouseholdMemberRow[]>();

  for (const member of (data ?? []) as HouseholdMemberRow[]) {
    const current = membersByHousehold.get(member.household_id) ?? [];
    current.push(member);
    membersByHousehold.set(member.household_id, current);
  }

  return membersByHousehold;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireAdminAccess();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("households")
    .select(householdSelect)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const householdRows = (data ?? []) as HouseholdRow[];
  const membersByHousehold = await getMembersByHousehold(
    householdRows.map((household) => household.id)
  );
  const households = householdRows.map((household) =>
    mapHousehold(household, membersByHousehold.get(household.id) ?? [])
  );

  return {
    households,
    totalHouseholds: households.length,
    totalGuests: households.reduce((total, household) => total + household.members.length, 0),
    needsReview: households.filter((household) => household.invitationStatus === "needs_review")
      .length,
    readyToInvite: households.filter((household) => household.invitationStatus === "ready")
      .length
  };
}

export async function getAdminHousehold(id: string): Promise<AdminHousehold | null> {
  await requireAdminAccess();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("households")
    .select(householdSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as HouseholdRow;
  const membersByHousehold = await getMembersByHousehold([row.id]);
  return mapHousehold(row, membersByHousehold.get(row.id) ?? []);
}

export async function saveAdminHousehold(
  householdId: string | null,
  input: AdminHouseholdInput
) {
  await requireAdminAccess();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("admin_save_household", {
    p_household_id: householdId,
    p_household: {
      household_name: input.householdName,
      primary_first_name: input.primaryFirstName,
      primary_last_name: input.primaryLastName,
      primary_email: input.primaryEmail,
      normalized_email: input.normalizedEmail,
      primary_phone: input.primaryPhone,
      street_address: input.streetAddress,
      unit: input.unit,
      city: input.city,
      province_state: input.provinceState,
      postal_zip: input.normalizedPostalZip,
      country: input.country,
      internal_notes: input.internalNotes,
      invitation_source: input.invitationSource,
      invitation_status: input.invitationStatus,
      invitation_package: input.invitationPackage
    },
    p_members: input.members.map((member) => ({
      first_name: member.firstName,
      last_name: member.lastName
    }))
  });

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "string") {
    throw new Error("Supabase did not return the saved household ID.");
  }

  return data;
}

export function filterAdminHouseholds(
  households: AdminHousehold[],
  filters: {
    query?: string;
    invitationPackage?: InvitationPackage | "all";
    invitationStatus?: InvitationStatus | "all";
  }
) {
  const query = filters.query?.trim().toLowerCase() ?? "";

  return households.filter((household) => {
    if (
      filters.invitationPackage &&
      filters.invitationPackage !== "all" &&
      household.invitationPackage !== filters.invitationPackage
    ) {
      return false;
    }

    if (
      filters.invitationStatus &&
      filters.invitationStatus !== "all" &&
      household.invitationStatus !== filters.invitationStatus
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchable = [
      household.householdName,
      household.primaryName,
      household.primaryEmail,
      household.primaryPhone,
      ...household.address,
      ...household.members.flatMap((member) => [member.firstName, member.lastName])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });
}
