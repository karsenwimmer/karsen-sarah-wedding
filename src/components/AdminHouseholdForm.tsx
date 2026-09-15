"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  createAdminHousehold,
  updateAdminHousehold
} from "@/app/admin/actions";
import {
  invitationPackageLabels,
  invitationPackages,
  invitationSourceLabels,
  invitationSources,
  invitationStatusLabels,
  invitationStatuses
} from "@/lib/admin-household-schema";
import { initialAdminHouseholdFormState } from "@/lib/admin-household-form-state";
import type { AdminHousehold } from "@/lib/admin-data";
import { MAX_HOUSEHOLD_MEMBERS } from "@/lib/household-schema";

type MemberRow = {
  key: number;
  firstName: string;
  lastName: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span className="admin-field-error" id={id}>
      {message}
    </span>
  );
}

function inputErrorAttributes(error: string | undefined, errorId: string) {
  return error
    ? { "aria-describedby": errorId, "aria-invalid": true as const }
    : {};
}

export function AdminHouseholdForm({ household }: { household?: AdminHousehold }) {
  const action = household
    ? updateAdminHousehold.bind(null, household.id)
    : createAdminHousehold;
  const [state, formAction, pending] = useActionState(
    action,
    initialAdminHouseholdFormState
  );
  const nextMemberKey = useRef(household?.members.length ?? 1);
  const [members, setMembers] = useState<MemberRow[]>(
    household?.members.length
      ? household.members.map((member, index) => ({ key: index, ...member }))
      : [{ key: 0, firstName: "", lastName: "" }]
  );

  function updateMember(key: number, field: "firstName" | "lastName", value: string) {
    setMembers((current) =>
      current.map((member) => (member.key === key ? { ...member, [field]: value } : member))
    );
  }

  function addMember() {
    if (members.length >= MAX_HOUSEHOLD_MEMBERS) {
      return;
    }

    const key = nextMemberKey.current;
    nextMemberKey.current += 1;
    setMembers((current) => [...current, { key, firstName: "", lastName: "" }]);
  }

  function removeMember(key: number) {
    if (members.length === 1) {
      return;
    }

    setMembers((current) => current.filter((member) => member.key !== key));
  }

  return (
    <form className="admin-editor" action={formAction}>
      <input name="memberCount" type="hidden" value={members.length} readOnly />

      {state.status === "error" ? (
        <div className="admin-form-message admin-form-message--error" role="alert">
          {state.message}
        </div>
      ) : null}

      <section className="admin-editor__section">
        <div className="admin-editor__section-heading">
          <div>
            <p className="admin-kicker">Invitation</p>
            <h2>Household setup</h2>
          </div>
          <p>Choose what this household receives and where it came from.</p>
        </div>

        <div className="admin-form-grid">
          <label className="admin-field admin-field--full">
            <span>Household name *</span>
            <input
              defaultValue={household?.householdName ?? ""}
              maxLength={140}
              name="householdName"
              required
              {...inputErrorAttributes(state.fieldErrors.householdName, "householdName-error")}
            />
            <FieldError id="householdName-error" message={state.fieldErrors.householdName} />
          </label>

          <label className="admin-field">
            <span>List source</span>
            <select
              defaultValue={household?.invitationSource ?? "manual"}
              name="invitationSource"
            >
              {invitationSources.map((source) => (
                <option key={source} value={source}>
                  {invitationSourceLabels[source]}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>Preparation status</span>
            <select
              defaultValue={household?.invitationStatus ?? "needs_review"}
              name="invitationStatus"
            >
              {invitationStatuses.map((status) => (
                <option key={status} value={status}>
                  {invitationStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="admin-package-options">
          <legend>Invitation package</legend>
          {invitationPackages.map((invitationPackage) => (
            <label className="admin-package-option" key={invitationPackage}>
              <input
                defaultChecked={
                  household
                    ? household.invitationPackage === invitationPackage
                    : invitationPackage === "full_celebration"
                }
                name="invitationPackage"
                type="radio"
                value={invitationPackage}
              />
              <span>
                <strong>{invitationPackageLabels[invitationPackage]}</strong>
                <small>
                  {invitationPackage === "full_celebration"
                    ? "Includes the separate venue and future meal selections."
                    : "Shows only the ceremony and two-hour church reception."}
                </small>
              </span>
            </label>
          ))}
          <FieldError
            id="invitationPackage-error"
            message={state.fieldErrors.invitationPackage}
          />
        </fieldset>
      </section>

      <section className="admin-editor__section">
        <div className="admin-editor__section-heading">
          <div>
            <p className="admin-kicker">People</p>
            <h2>Invited household members</h2>
          </div>
          <p>Add every named person included on this invitation.</p>
        </div>

        <div className="admin-member-list">
          {members.map((member, index) => {
            const firstNameError = state.fieldErrors[`members.${index}.firstName`];
            const lastNameError = state.fieldErrors[`members.${index}.lastName`];

            return (
              <div className="admin-member-row" key={member.key}>
                <label className="admin-field">
                  <span>First name *</span>
                  <input
                    maxLength={80}
                    name={`members.${index}.firstName`}
                    onChange={(event) =>
                      updateMember(member.key, "firstName", event.currentTarget.value)
                    }
                    required
                    value={member.firstName}
                    {...inputErrorAttributes(firstNameError, `members-${index}-firstName-error`)}
                  />
                  <FieldError
                    id={`members-${index}-firstName-error`}
                    message={firstNameError}
                  />
                </label>
                <label className="admin-field">
                  <span>Last name *</span>
                  <input
                    maxLength={80}
                    name={`members.${index}.lastName`}
                    onChange={(event) =>
                      updateMember(member.key, "lastName", event.currentTarget.value)
                    }
                    required
                    value={member.lastName}
                    {...inputErrorAttributes(lastNameError, `members-${index}-lastName-error`)}
                  />
                  <FieldError
                    id={`members-${index}-lastName-error`}
                    message={lastNameError}
                  />
                </label>
                <button
                  className="admin-member-remove"
                  disabled={members.length === 1}
                  onClick={() => removeMember(member.key)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <FieldError id="members-error" message={state.fieldErrors.members} />
        <button
          className="button button--secondary admin-add-member"
          disabled={members.length >= MAX_HOUSEHOLD_MEMBERS}
          onClick={addMember}
          type="button"
        >
          Add another person
        </button>
      </section>

      <section className="admin-editor__section">
        <div className="admin-editor__section-heading">
          <div>
            <p className="admin-kicker">Contact</p>
            <h2>Primary contact</h2>
          </div>
          <p>These details can remain incomplete while the household needs review.</p>
        </div>

        <div className="admin-form-grid">
          <label className="admin-field">
            <span>First name</span>
            <input
              autoComplete="given-name"
              defaultValue={household?.primaryFirstName ?? ""}
              maxLength={80}
              name="primaryFirstName"
            />
          </label>
          <label className="admin-field">
            <span>Last name</span>
            <input
              autoComplete="family-name"
              defaultValue={household?.primaryLastName ?? ""}
              maxLength={80}
              name="primaryLastName"
            />
          </label>
          <label className="admin-field">
            <span>Email</span>
            <input
              autoComplete="email"
              defaultValue={household?.primaryEmail ?? ""}
              maxLength={320}
              name="primaryEmail"
              type="email"
              {...inputErrorAttributes(state.fieldErrors.primaryEmail, "primaryEmail-error")}
            />
            <FieldError id="primaryEmail-error" message={state.fieldErrors.primaryEmail} />
          </label>
          <label className="admin-field">
            <span>Phone</span>
            <input
              autoComplete="tel"
              defaultValue={household?.primaryPhone ?? ""}
              maxLength={40}
              name="primaryPhone"
              type="tel"
            />
          </label>
        </div>
      </section>

      <section className="admin-editor__section">
        <div className="admin-editor__section-heading">
          <div>
            <p className="admin-kicker">Delivery</p>
            <h2>Mailing address</h2>
          </div>
          <p>Leave unknown fields blank and the dashboard will flag them for review.</p>
        </div>

        <div className="admin-form-grid">
          <label className="admin-field admin-field--full">
            <span>Street address</span>
            <input
              autoComplete="street-address"
              defaultValue={household?.streetAddress ?? ""}
              maxLength={180}
              name="streetAddress"
            />
          </label>
          <label className="admin-field">
            <span>Unit</span>
            <input
              defaultValue={household?.unit ?? ""}
              maxLength={80}
              name="unit"
            />
          </label>
          <label className="admin-field">
            <span>City</span>
            <input
              autoComplete="address-level2"
              defaultValue={household?.city ?? ""}
              maxLength={100}
              name="city"
            />
          </label>
          <label className="admin-field">
            <span>Province or state</span>
            <input
              autoComplete="address-level1"
              defaultValue={household?.provinceState ?? ""}
              maxLength={100}
              name="provinceState"
            />
          </label>
          <label className="admin-field">
            <span>Postal or ZIP code</span>
            <input
              autoComplete="postal-code"
              defaultValue={household?.postalZip ?? ""}
              maxLength={24}
              name="postalZip"
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Country</span>
            <input
              autoComplete="country-name"
              defaultValue={household?.country ?? "Canada"}
              maxLength={80}
              name="country"
            />
          </label>
        </div>
      </section>

      <section className="admin-editor__section">
        <div className="admin-editor__section-heading">
          <div>
            <p className="admin-kicker">Planning</p>
            <h2>Private notes</h2>
          </div>
          <p>Only the two of you can see these notes.</p>
        </div>
        <label className="admin-field">
          <span className="sr-only">Private notes</span>
          <textarea
            defaultValue={household?.internalNotes ?? ""}
            maxLength={2000}
            name="internalNotes"
            rows={5}
          />
        </label>

        {household?.notes ? (
          <div className="admin-guest-note">
            <strong>Note submitted by guest</strong>
            <p>{household.notes}</p>
          </div>
        ) : null}
      </section>

      <div className="admin-editor__actions">
        <Link className="button button--secondary" href="/admin">
          Cancel
        </Link>
        <button className="button button--primary" disabled={pending} type="submit">
          {pending ? "Saving…" : household ? "Save household" : "Add household"}
        </button>
      </div>
    </form>
  );
}
