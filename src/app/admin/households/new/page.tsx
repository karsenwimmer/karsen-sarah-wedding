import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHouseholdForm } from "@/components/AdminHouseholdForm";
import { hasAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add household - Wedding admin",
  robots: {
    index: false,
    follow: false
  }
};

export default async function NewAdminHouseholdPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin");
  }

  return (
    <main className="admin-shell">
      <header className="admin-editor-hero">
        <Link className="admin-back-link" href="/admin">
          ← Invitation list
        </Link>
        <p className="admin-kicker">Wedding admin</p>
        <h1>Add a household</h1>
        <p>
          Start with the names you know. Missing contact or mailing information can be filled in
          later.
        </p>
      </header>
      <AdminHouseholdForm />
    </main>
  );
}
