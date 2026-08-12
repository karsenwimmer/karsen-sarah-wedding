"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitMailingInformation } from "@/app/actions";
import { MAX_HOUSEHOLD_MEMBERS } from "@/lib/household-schema";
import { initialMailingFormState } from "@/lib/mailing-form-state";

const defaultCountry = "Canada";
const initialFormValues: Record<string, string> = {
  primaryFirstName: "",
  primaryLastName: "",
  primaryEmail: "",
  primaryPhone: "",
  streetAddress: "",
  unit: "",
  city: "",
  provinceState: "",
  postalZip: "",
  country: defaultCountry,
  notes: ""
};

const requiredFieldMessages: Record<string, string> = {
  primaryFirstName: "Primary contact first name is required.",
  primaryLastName: "Primary contact last name is required.",
  primaryEmail: "Primary email address is required.",
  streetAddress: "Street address is required.",
  city: "City is required.",
  provinceState: "Province or state is required.",
  postalZip: "Postal or ZIP code is required.",
  country: "Country is required."
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="form-error">{message}</p>;
}

type TextFieldProps = {
  autoComplete?: string;
  error?: string;
  label: string;
  maxLength?: number;
  name: string;
  onValueChange: (name: string, value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
};

function TextField({
  autoComplete,
  error,
  label,
  maxLength,
  name,
  onValueChange,
  placeholder,
  required = false,
  type = "text",
  value
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
        maxLength={maxLength}
        name={name}
        onChange={(event) => onValueChange(name, event.currentTarget.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
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
  onValueChange,
  placeholder,
  value
}: {
  error?: string;
  label: string;
  maxLength?: number;
  name: string;
  onValueChange: (name: string, value: string) => void;
  placeholder?: string;
  value: string;
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
        onChange={(event) => onValueChange(name, event.currentTarget.value)}
        placeholder={placeholder}
        rows={4}
        value={value}
      />
      <span id={errorId}>
        <FieldError message={error} />
      </span>
    </label>
  );
}

function buildErrorSummary(fieldErrors: Record<string, string>, fallbackMessage: string) {
  const messages = Array.from(new Set(Object.values(fieldErrors).filter(Boolean)));

  if (messages.length === 0) {
    return fallbackMessage || "Please review the highlighted fields above.";
  }

  return `Please finish this before saving: ${messages.join(" ")}`;
}

export function MailingForm() {
  const [state, formAction, pending] = useActionState(
    submitMailingInformation,
    initialMailingFormState
  );
  const [memberRows, setMemberRows] = useState<number[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>(initialFormValues);
  const [clientFieldErrors, setClientFieldErrors] = useState<Record<string, string>>({});
  const [communicationConsent, setCommunicationConsent] = useState(false);
  const formStartedAtRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      statusRef.current?.focus();
    }
  }, [state.status, state.message]);

  const displayedFieldErrors = { ...state.fieldErrors, ...clientFieldErrors };
  const bottomErrorMessage = Object.keys(clientFieldErrors).length
    ? buildErrorSummary(clientFieldErrors, "Please review the highlighted fields.")
    : state.status === "error"
      ? buildErrorSummary(state.fieldErrors, state.message)
      : "";

  const canAddMember = memberRows.length < MAX_HOUSEHOLD_MEMBERS - 1;
  const canSubmit = communicationConsent && !pending;

  function updateFormValue(name: string, value: string) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
    setClientFieldErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  }

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
    setMemberRows((rows) => {
      const removedIndex = rows.findIndex((rowId) => rowId === id);
      const nextRows = rows.filter((rowId) => rowId !== id);

      if (removedIndex >= 0) {
        setFormValues((currentValues) => {
          const nextValues = { ...currentValues };

          nextRows.forEach((_, nextIndex) => {
            const previousIndex = nextIndex >= removedIndex ? nextIndex + 1 : nextIndex;
            nextValues[`members.${nextIndex}.firstName`] =
              currentValues[`members.${previousIndex}.firstName`] ?? "";
            nextValues[`members.${nextIndex}.lastName`] =
              currentValues[`members.${previousIndex}.lastName`] ?? "";
          });

          delete nextValues[`members.${nextRows.length}.firstName`];
          delete nextValues[`members.${nextRows.length}.lastName`];
          return nextValues;
        });
      }

      return nextRows;
    });
  }

  function markFormStarted() {
    const input = formStartedAtRef.current;

    if (input && !input.value) {
      input.value = Date.now().toString();
    }
  }

  function validateBeforeSubmit(event: React.FormEvent<HTMLFormElement>) {
    const nextErrors: Record<string, string> = {};

    for (const [name, message] of Object.entries(requiredFieldMessages)) {
      if (!formValues[name]?.trim()) {
        nextErrors[name] = message;
      }
    }

    if (formValues.primaryEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.primaryEmail)) {
      nextErrors.primaryEmail = "Enter a valid email address.";
    }

    memberRows.forEach((_, index) => {
      const firstNameKey = `members.${index}.firstName`;
      const lastNameKey = `members.${index}.lastName`;

      if (!formValues[firstNameKey]?.trim()) {
        nextErrors[firstNameKey] = `Additional member ${index + 1} first name is required.`;
      }

      if (!formValues[lastNameKey]?.trim()) {
        nextErrors[lastNameKey] = `Additional member ${index + 1} last name is required.`;
      }
    });

    if (!communicationConsent) {
      nextErrors.communicationConsent =
        "Please agree to receive wedding-related emails from Karsen and Sarah.";
    }

    if (Object.keys(nextErrors).length) {
      event.preventDefault();
      setClientFieldErrors(nextErrors);
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
      onReset={(event) => event.preventDefault()}
      onSubmit={validateBeforeSubmit}
    >
      <input name="website" tabIndex={-1} autoComplete="off" className="honeypot" />
      <input
        ref={formStartedAtRef}
        name="formStartedAt"
        type="hidden"
        defaultValue=""
        readOnly
      />

      <div className="form-status" ref={statusRef} tabIndex={-1} role="status" aria-live="polite">
        Please share the details for one invited household.
      </div>

      <fieldset>
        <legend>Primary Contact</legend>
        <div className="form-grid">
          <TextField
            autoComplete="given-name"
            error={displayedFieldErrors.primaryFirstName}
            label="Primary contact first name"
            maxLength={80}
            name="primaryFirstName"
            onValueChange={updateFormValue}
            required
            value={formValues.primaryFirstName}
          />
          <TextField
            autoComplete="family-name"
            error={displayedFieldErrors.primaryLastName}
            label="Primary contact last name"
            maxLength={80}
            name="primaryLastName"
            onValueChange={updateFormValue}
            required
            value={formValues.primaryLastName}
          />
          <TextField
            autoComplete="email"
            error={displayedFieldErrors.primaryEmail}
            label="Primary email address"
            maxLength={320}
            name="primaryEmail"
            onValueChange={updateFormValue}
            required
            type="email"
            value={formValues.primaryEmail}
          />
          <TextField
            autoComplete="tel"
            error={displayedFieldErrors.primaryPhone}
            label="Primary phone number"
            maxLength={40}
            name="primaryPhone"
            onValueChange={updateFormValue}
            type="tel"
            value={formValues.primaryPhone}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Household Members</legend>
        <p className="form-help">
          The primary contact is included automatically. This helps us address the invitation; it is not an RSVP or attendance confirmation.
        </p>
        <input name="memberCount" type="hidden" value={memberRows.length} readOnly />
        <FieldError message={displayedFieldErrors.members} />

        <div className="member-list">
          {memberRows.map((id, index) => (
            <div className="member-row" key={id}>
              <TextField
                error={displayedFieldErrors[`members.${index}.firstName`]}
                label={`Additional member ${index + 1} first name`}
                maxLength={80}
                name={`members.${index}.firstName`}
                onValueChange={updateFormValue}
                required
                value={formValues[`members.${index}.firstName`] ?? ""}
              />
              <TextField
                error={displayedFieldErrors[`members.${index}.lastName`]}
                label={`Additional member ${index + 1} last name`}
                maxLength={80}
                name={`members.${index}.lastName`}
                onValueChange={updateFormValue}
                required
                value={formValues[`members.${index}.lastName`] ?? ""}
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
            error={displayedFieldErrors.streetAddress}
            label="Street address"
            maxLength={180}
            name="streetAddress"
            onValueChange={updateFormValue}
            required
            value={formValues.streetAddress}
          />
          <TextField
            autoComplete="address-line2"
            error={displayedFieldErrors.unit}
            label="Apartment, suite or unit"
            maxLength={80}
            name="unit"
            onValueChange={updateFormValue}
            value={formValues.unit}
          />
          <TextField
            autoComplete="address-level2"
            error={displayedFieldErrors.city}
            label="City"
            maxLength={100}
            name="city"
            onValueChange={updateFormValue}
            required
            value={formValues.city}
          />
          <TextField
            autoComplete="address-level1"
            error={displayedFieldErrors.provinceState}
            label="Province or state"
            maxLength={100}
            name="provinceState"
            onValueChange={updateFormValue}
            required
            value={formValues.provinceState}
          />
          <TextField
            autoComplete="postal-code"
            error={displayedFieldErrors.postalZip}
            label="Postal or ZIP code"
            maxLength={24}
            name="postalZip"
            onValueChange={updateFormValue}
            required
            value={formValues.postalZip}
          />
          <TextField
            autoComplete="country-name"
            error={displayedFieldErrors.country}
            label="Country"
            maxLength={80}
            name="country"
            onValueChange={updateFormValue}
            placeholder={defaultCountry}
            required
            value={formValues.country}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Other Details</legend>
        <TextAreaField
          error={displayedFieldErrors.notes}
          label="Notes"
          maxLength={1000}
          name="notes"
          onValueChange={updateFormValue}
          placeholder="Anything helpful for mailing your invitation."
          value={formValues.notes}
        />
        <label className="consent-field">
          <input
            checked={communicationConsent}
            name="communicationConsent"
            onChange={(event) => {
              setCommunicationConsent(event.currentTarget.checked);
              setClientFieldErrors((currentErrors) => {
                if (!currentErrors.communicationConsent) {
                  return currentErrors;
                }

                const nextErrors = { ...currentErrors };
                delete nextErrors.communicationConsent;
                return nextErrors;
              });
            }}
            required
            type="checkbox"
          />
          <span>I agree to receive wedding-related emails from Karsen and Sarah.</span>
        </label>
        <FieldError message={displayedFieldErrors.communicationConsent} />
      </fieldset>

      {bottomErrorMessage ? (
        <div className="form-status form-status--error form-status--bottom" role="alert">
          {bottomErrorMessage}
        </div>
      ) : null}

      <button
        className="button button--primary form-submit"
        type="submit"
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
      >
        {pending ? "Saving..." : "Save Our Details"}
      </button>
      {!communicationConsent ? (
        <p className="form-help form-help--submit">
          Please check the email consent box above to save your details.
        </p>
      ) : null}
    </form>
  );
}
