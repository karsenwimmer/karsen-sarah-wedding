import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminHouseholdForm } from "@/components/AdminHouseholdForm";
import { hasAdminSession } from "@/lib/admin-auth";
import { getAdminHousehold } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit household - Wedding admin",
  robots: {
    index: false,
    follow: false
  }
};

type EditAdminHouseholdPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ notice?: string }>;
};

export default async function EditAdminHouseholdPage({
  params,
  searchParams
}: EditAdminHouseholdPageProps) {
  if (!(await hasAdminSession())) {
    redirect("/admin");
  }

  const { id } = await params;
  const household = await getAdminHousehold(id);

  if (!household) {
    notFound();
  }

  const notice = (await searchParams)?.notice;

  return (
    <main className="admin-shell">
      <header className="admin-editor-hero">
        <Link className="admin-back-link" href="/admin">
          ← Invitation list
        </Link>
        <p className="admin-kicker">Wedding admin</p>
        <h1>{household.householdName}</h1>
        <p>Edit the people, contact details and invitation access for this household.</p>
      </header>

      {notice === "created" || notice === "updated" ? (
        <div className="admin-form-message admin-form-message--success" role="status">
          {notice === "created" ? "Household added successfully." : "Household changes saved."}
        </div>
      ) : null}

      <AdminHouseholdForm household={household} />
    </main>
  );
}
