import type { Metadata } from "next";
import Link from "next/link";
import { loginAdmin, logoutAdmin } from "@/app/admin/actions";
import { hasAdminSession, isAdminConfigured } from "@/lib/admin-auth";
import {
  invitationPackageLabels,
  invitationPackages,
  invitationStatusLabels,
  invitationStatuses,
  invitationSourceLabels,
  type InvitationPackage,
  type InvitationStatus
} from "@/lib/admin-household-schema";
import {
  filterAdminHouseholds,
  getAdminDashboardData,
  type AdminHousehold
} from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin - Karsen & Sarah",
  robots: {
    index: false,
    follow: false
  }
};

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string;
    package?: string;
    q?: string;
    status?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto"
  }).format(new Date(value));
}

function SetupPanel() {
  return (
    <main className="admin-shell admin-shell--centered">
      <section className="admin-card admin-card--login">
        <p className="admin-kicker">Admin</p>
        <h1>Dashboard password needed</h1>
        <p>
          Add `ADMIN_DASHBOARD_PASSWORD` in Vercel, then redeploy. The dashboard is built and
          waiting behind that password.
        </p>
      </section>
    </main>
  );
}

function LoginPanel({ hasError }: { hasError: boolean }) {
  return (
    <main className="admin-shell admin-shell--centered">
      <section className="admin-card admin-card--login">
        <p className="admin-kicker">Karsen & Sarah</p>
        <h1>Admin dashboard</h1>
        <p>Enter the private dashboard password to manage the wedding invitation list.</p>
        <form className="admin-login-form" action={loginAdmin}>
          <label>
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {hasError ? <p className="admin-error">That password did not work.</p> : null}
          <button className="button button--primary" type="submit">
            Open dashboard
          </button>
        </form>
      </section>
    </main>
  );
}

function HouseholdCard({ household }: { household: AdminHousehold }) {
  return (
    <article className="admin-household">
      <div className="admin-household__header">
        <div>
          <p className="admin-kicker">Updated {formatDate(household.updatedAt)}</p>
          <h2>{household.householdName}</h2>
          <p className="admin-household__primary">Primary contact: {household.primaryName}</p>
        </div>
        <div className="admin-household__actions">
          <span className={`admin-status admin-status--${household.invitationStatus}`}>
            {invitationStatusLabels[household.invitationStatus]}
          </span>
          <Link className="button button--secondary" href={`/admin/households/${household.id}`}>
            Edit household
          </Link>
        </div>
      </div>

      <div className="admin-household__invitation">
        <strong>{invitationPackageLabels[household.invitationPackage]}</strong>
        <span>{invitationSourceLabels[household.invitationSource]}</span>
      </div>

      <div className="admin-household__grid">
        <section>
          <h3>Contact</h3>
          <p>
            {household.primaryEmail ? (
              <a href={`mailto:${household.primaryEmail}`}>{household.primaryEmail}</a>
            ) : (
              "No email provided"
            )}
          </p>
          <p>{household.primaryPhone ?? "No phone provided"}</p>
        </section>
        <section>
          <h3>Mailing address</h3>
          {household.address.length ? (
            household.address.map((line) => <p key={line}>{line}</p>)
          ) : (
            <p>No address provided</p>
          )}
        </section>
        <section>
          <h3>Invited people ({household.members.length})</h3>
          {household.members.map((member, index) => (
            <p key={`${member.firstName}-${member.lastName}-${index}`}>
              {member.firstName} {member.lastName}
            </p>
          ))}
        </section>
        <section>
          <h3>Private notes</h3>
          <p>{household.internalNotes ?? "No private notes"}</p>
        </section>
      </div>

      {household.missingInformation.length ? (
        <p className="admin-household__warning">
          Missing: {household.missingInformation.join(", ")}.
        </p>
      ) : (
        <p className="admin-household__complete">Contact and mailing details look complete.</p>
      )}
    </article>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;

  if (!isAdminConfigured()) {
    return <SetupPanel />;
  }

  if (!(await hasAdminSession())) {
    return <LoginPanel hasError={params?.error === "1"} />;
  }

  const dashboard = await getAdminDashboardData();
  const selectedPackage = invitationPackages.includes(params?.package as InvitationPackage)
    ? (params?.package as InvitationPackage)
    : "all";
  const selectedStatus = invitationStatuses.includes(params?.status as InvitationStatus)
    ? (params?.status as InvitationStatus)
    : "all";
  const filteredHouseholds = filterAdminHouseholds(dashboard.households, {
    query: params?.q,
    invitationPackage: selectedPackage,
    invitationStatus: selectedStatus
  });
  const hasFilters = Boolean(params?.q || selectedPackage !== "all" || selectedStatus !== "all");

  return (
    <main className="admin-shell">
      <header className="admin-hero">
        <div>
          <p className="admin-kicker">Wedding admin</p>
          <h1>Invitation list</h1>
          <p>
            Review Save the Date submissions, correct household information and add missing
            invitees before generating access codes.
          </p>
        </div>
        <div className="admin-hero__actions">
          <Link className="button button--primary" href="/admin/households/new">
            Add household
          </Link>
          <form action={logoutAdmin}>
            <button className="button button--secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="admin-stats" aria-label="Invitation list summary">
        <div>
          <span>{dashboard.totalHouseholds}</span>
          <p>Households</p>
        </div>
        <div>
          <span>{dashboard.totalGuests}</span>
          <p>Invited people</p>
        </div>
        <div>
          <span>{dashboard.needsReview}</span>
          <p>Need review</p>
        </div>
        <div>
          <span>{dashboard.readyToInvite}</span>
          <p>Ready</p>
        </div>
      </section>

      <form className="admin-filters" method="get">
        <label className="admin-field admin-filter-search">
          <span>Search households</span>
          <input
            defaultValue={params?.q ?? ""}
            name="q"
            placeholder="Name, email, phone or address"
            type="search"
          />
        </label>
        <label className="admin-field">
          <span>Invitation</span>
          <select defaultValue={selectedPackage} name="package">
            <option value="all">All invitations</option>
            {invitationPackages.map((invitationPackage) => (
              <option key={invitationPackage} value={invitationPackage}>
                {invitationPackageLabels[invitationPackage]}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Status</span>
          <select defaultValue={selectedStatus} name="status">
            <option value="all">All statuses</option>
            {invitationStatuses.map((status) => (
              <option key={status} value={status}>
                {invitationStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <button className="button button--primary" type="submit">
          Apply filters
        </button>
        {hasFilters ? (
          <Link className="admin-clear-filters" href="/admin">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="admin-results-count" aria-live="polite">
        Showing {filteredHouseholds.length} of {dashboard.totalHouseholds} households
      </div>

      <section className="admin-list" aria-label="Invitation households">
        {filteredHouseholds.length > 0 ? (
          filteredHouseholds.map((household) => (
            <HouseholdCard household={household} key={household.id} />
          ))
        ) : (
          <div className="admin-card">
            <h2>{dashboard.totalHouseholds ? "No households match" : "No households yet"}</h2>
            <p>
              {dashboard.totalHouseholds
                ? "Clear or adjust the filters to see more invitation records."
                : "Add the first household to begin preparing the invitation list."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
