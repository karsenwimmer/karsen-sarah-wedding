"use client";

import { useActionState, useState } from "react";
import { deleteAdminHousehold } from "@/app/admin/actions";
import { initialAdminHouseholdFormState } from "@/lib/admin-household-form-state";

type AdminDeleteHouseholdProps = {
  householdId: string;
  householdName: string;
};

export function AdminDeleteHousehold({
  householdId,
  householdName
}: AdminDeleteHouseholdProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const action = deleteAdminHousehold.bind(null, householdId, householdName);
  const [state, formAction, pending] = useActionState(
    action,
    initialAdminHouseholdFormState
  );
  const confirmationMatches = confirmation.trim() === householdName;

  return (
    <section className="admin-delete-panel" aria-labelledby="delete-household-heading">
      <div>
        <p className="admin-kicker">Remove record</p>
        <h2 id="delete-household-heading">Delete household</h2>
        <p>
          This permanently removes the household and everyone listed on it. Submission history
          is retained without being attached to the deleted household.
        </p>
      </div>

      {!isConfirming ? (
        <button
          className="button admin-button--danger"
          onClick={() => setIsConfirming(true)}
          type="button"
        >
          Delete household
        </button>
      ) : (
        <form className="admin-delete-confirmation" action={formAction}>
          <label className="admin-field">
            <span>
              Enter <strong>{householdName}</strong> to confirm
            </span>
            <input
              aria-describedby={
                state.fieldErrors.confirmation ? "delete-confirmation-error" : undefined
              }
              aria-invalid={state.fieldErrors.confirmation ? true : undefined}
              autoComplete="off"
              name="confirmation"
              onChange={(event) => setConfirmation(event.currentTarget.value)}
              value={confirmation}
            />
          </label>

          {state.status === "error" ? (
            <p className="admin-field-error" id="delete-confirmation-error" role="alert">
              {state.message}
            </p>
          ) : null}

          <div className="admin-delete-confirmation__actions">
            <button
              className="button button--secondary"
              disabled={pending}
              onClick={() => {
                setConfirmation("");
                setIsConfirming(false);
              }}
              type="button"
            >
              Keep household
            </button>
            <button
              className="button admin-button--danger"
              disabled={!confirmationMatches || pending}
              type="submit"
            >
              {pending ? "Deleting…" : "Permanently delete"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
