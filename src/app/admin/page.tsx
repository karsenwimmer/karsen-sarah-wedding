import type { Metadata } from "next";
import { loginAdmin, logoutAdmin } from "@/app/admin/actions";
import { hasAdminSession, isAdminConfigured } from "@/lib/admin-auth";
import { getAdminDashboardData, type AdminHousehold } from "@/lib/admin-data";

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
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto"
  }).format(new Date(value));
}

function StatusPill({ label, value }: { label: string; value: string | null }) {
  const status = value ?? "not_configured";
  const statusLabel = status.replaceAll("_", " ");

  return <span className={`admin-status admin-status--${status}`}>{label}: {statusLabel}</span>;
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
        <p>Enter the private dashboard password to view household mailing submissions.</p>
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
          <h2>{household.primaryName}</h2>
        </div>
        <div className="admin-household__statuses" aria-label="Email statuses">
          <StatusPill label="Guest" value={household.confirmationEmailStatus} />
          <StatusPill label="Couple" value={household.coupleNotificationStatus} />
        </div>
      </div>

      <div className="admin-household__grid">
        <section>
          <h3>Contact</h3>
          <p>
            <a href={`mailto:${household.primaryEmail}`}>{household.primaryEmail}</a>
          </p>
          <p>{household.primaryPhone ?? "No phone provided"}</p>
        </section>
        <section>
          <h3>Mailing Address</h3>
          {household.address.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
        <section>
          <h3>Household Members</h3>
          {household.members.map((member) => (
            <p key={`${member.firstName}-${member.lastName}`}>
              {member.firstName} {member.lastName}
            </p>
          ))}
        </section>
        <section>
          <h3>Notes</h3>
          <p>{household.notes ?? "No notes provided"}</p>
        </section>
      </div>

      {household.lastEmailError ? (
        <p className="admin-household__warning">{household.lastEmailError}</p>
      ) : null}
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

  return (
    <main className="admin-shell">
      <header className="admin-hero">
        <div>
          <p className="admin-kicker">Wedding admin</p>
          <h1>Household submissions</h1>
          <p>Private mailing and contact details collected from the save-the-date form.</p>
        </div>
        <form action={logoutAdmin}>
          <button className="button button--secondary" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="admin-stats" aria-label="Dashboard summary">
        <div>
          <span>{dashboard.totalHouseholds}</span>
          <p>Households</p>
        </div>
        <div>
          <span>{dashboard.totalGuests}</span>
          <p>People listed</p>
        </div>
        <div>
          <span>{dashboard.households.filter((item) => item.confirmationEmailStatus === "sent").length}</span>
          <p>Guest emails sent</p>
        </div>
      </section>

      <section className="admin-list" aria-label="Household submissions">
        {dashboard.households.length > 0 ? (
          dashboard.households.map((household) => (
            <HouseholdCard household={household} key={household.id} />
          ))
        ) : (
          <div className="admin-card">
            <h2>No submissions yet</h2>
            <p>Household details will appear here after guests submit the form.</p>
          </div>
        )}
      </section>
    </main>
  );
}
