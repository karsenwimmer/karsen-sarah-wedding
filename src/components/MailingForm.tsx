"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { submitMailingInformation } from "@/app/actions";
import { MAX_HOUSEHOLD_MEMBERS } from "@/lib/household-schema";
import { initialMailingFormState } from "@/lib/mailing-form-state";

const defaultCountry = "Canada";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="form-error">{message}</p>;
}

type TextFieldProps = {
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  label: string;
  maxLength?: number;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
};

function TextField({
  autoComplete,
  defaultValue,
  error,
  label,
  maxLength,
  name,
  placeholder,
  required = false,
  type = "text"
}: TextFieldProps) {
  const errorId = `${name}-error`;

  return (
    <label className="field">
      <span>
        {label}
        {required ? <strong aria-hidden="true">*</strong> : null}
      </span>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        maxLength={maxLength}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      <span id={errorId}>
        <FieldError message={error} />
      </span>
    </label>
  );
}

function TextAreaField({
  error,
  label,
  maxLength,
  name,
  placeholder
}: {
  error?: string;
  label: string;
  maxLength?: number;
  name: string;
  placeholder?: string;
}) {
  const errorId = `${name}-error`;

  return (
    <label className="field field--full">
      <span>{label}</span>
      <textarea
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        maxLength={maxLength}
        name={name}
        placeholder={placeholder}
        rows={4}
      />
      <span id={errorId}>
        <FieldError message={error} />
      </span>
    </label>
  );
}

export function MailingForm() {
  const [state, formAction, pending] = useActionState(
    submitMailingInformation,
    initialMailingFormState
  );
  const [memberRows, setMemberRows] = useState<number[]>([]);
  const formStartedAtRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") {
      statusRef.current?.focus();
    }
  }, [state.status, state.message]);

  const canAddMember = memberRows.length < MAX_HOUSEHOLD_MEMBERS - 1;
  const memberHelp = useMemo(
    () =>
      `${memberRows.length + 1} of ${MAX_HOUSEHOLD_MEMBERS} household members listed, including the primary contact.`,
    [memberRows.length]
  );

  function addMember() {
    setMemberRows((rows) => {
      if (rows.length >= MAX_HOUSEHOLD_MEMBERS - 1) {
        return rows;
      }

      const nextId = rows.length ? Math.max(...rows) + 1 : 0;
      return [...rows, nextId];
    });
  }

  function removeMember(id: number) {
    setMemberRows((rows) => rows.filter((rowId) => rowId !== id));
  }

  function markFormStarted() {
    const input = formStartedAtRef.current;

    if (input && !input.value) {
      input.value = Date.now().toString();
    }
  }

  if (state.status === "success") {
    return (
      <div className="mailing-form mailing-form--complete">
        <div
          className="form-status form-status--success form-status--complete"
          ref={statusRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </div>
      </div>
    );
  }

  return (
    <form
      className="mailing-form"
      action={formAction}
      noValidate
      onChangeCapture={markFormStarted}
      onFocusCapture={markFormStarted}
      onPointerDown={markFormStarted}
    >
      <input name="website" tabIndex={-1} autoComplete="off" className="honeypot" />
      <input
        ref={formStartedAtRef}
        name="formStartedAt"
        type="hidden"
        defaultValue=""
        readOnly
      />

      <div
        className={`form-status form-status--${state.status}`}
        ref={statusRef}
        tabIndex={-1}
        role={state.status === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {state.message || "Please share the details for one invited household."}
      </div>

      <fieldset>
        <legend>Household Information</legend>
        <div className="form-grid">
          <TextField
            error={state.fieldErrors.householdName}
            label="Household or family name"
            maxLength={140}
            name="householdName"
            placeholder="The Wimmer Household"
            required
          />
          <TextField
            autoComplete="given-name"
            error={state.fieldErrors.primaryFirstName}
            label="Primary contact first name"
            maxLength={80}
            name="primaryFirstName"
            required
          />
          <TextField
            autoComplete="family-name"
            error={state.fieldErrors.primaryLastName}
            label="Primary contact last name"
            maxLength={80}
            name="primaryLastName"
            required
          />
          <TextField
            autoComplete="email"
            error={state.fieldErrors.primaryEmail}
            label="Primary email address"
            maxLength={320}
            name="primaryEmail"
            required
            type="email"
          />
          <TextField
            autoComplete="tel"
            error={state.fieldErrors.primaryPhone}
            label="Primary phone number"
            maxLength={40}
            name="primaryPhone"
            type="tel"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Household Members</legend>
        <p className="form-help">
          The primary contact is included automatically. This helps us address the invitation; it is not an RSVP or attendance confirmation.
        </p>
        <p className="form-help" aria-live="polite">
          {memberHelp}
        </p>
        <input name="memberCount" type="hidden" value={memberRows.length} readOnly />
        <FieldError message={state.fieldErrors.members} />

        <div className="member-list">
          {memberRows.map((id, index) => (
            <div className="member-row" key={id}>
              <TextField
                label={`Additional member ${index + 1} first name`}
                maxLength={80}
                name={`members.${index}.firstName`}
                required
              />
              <TextField
                label={`Additional member ${index + 1} last name`}
                maxLength={80}
                name={`members.${index}.lastName`}
                required
              />
              <button
                className="member-remove"
                type="button"
                onClick={() => removeMember(id)}
                aria-label={`Remove additional member ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          className="button button--secondary button--compact"
          type="button"
          onClick={addMember}
          disabled={!canAddMember}
        >
          Add another household member
        </button>
      </fieldset>

      <fieldset>
        <legend>Mailing Address</legend>
        <div className="form-grid">
          <TextField
            autoComplete="address-line1"
            error={state.fieldErrors.streetAddress}
            label="Street address"
            maxLength={180}
            name="streetAddress"
            required
          />
          <TextField
            autoComplete="address-line2"
            error={state.fieldErrors.unit}
            label="Apartment, suite or unit"
            maxLength={80}
            name="unit"
          />
          <TextField
            autoComplete="address-level2"
            error={state.fieldErrors.city}
            label="City"
            maxLength={100}
            name="city"
            required
          />
          <TextField
            autoComplete="address-level1"
            error={state.fieldErrors.provinceState}
            label="Province or state"
            maxLength={100}
            name="provinceState"
            required
          />
          <TextField
            autoComplete="postal-code"
            error={state.fieldErrors.postalZip}
            label="Postal or ZIP code"
            maxLength={24}
            name="postalZip"
            required
          />
          <TextField
            autoComplete="country-name"
            error={state.fieldErrors.country}
            defaultValue={defaultCountry}
            label="Country"
            maxLength={80}
            name="country"
            placeholder={defaultCountry}
            required
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Other Details</legend>
        <TextAreaField
          error={state.fieldErrors.notes}
          label="Notes"
          maxLength={1000}
          name="notes"
          placeholder="Anything helpful for mailing your invitation."
        />
        <label className="consent-field">
          <input name="communicationConsent" required type="checkbox" />
          <span>I agree to receive wedding-related emails from Karsen and Sarah.</span>
        </label>
        <FieldError message={state.fieldErrors.communicationConsent} />
      </fieldset>

      <button className="button button--primary form-submit" type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Our Details"}
      </button>
    </form>
  );
}
