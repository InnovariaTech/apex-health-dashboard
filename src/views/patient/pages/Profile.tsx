// @ts-nocheck
import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import {
  useProfile,
  useUpdateProfileUser,
  useUpdateProfileUserEmail,
} from "@/hooks/care-validate/useProfile";
import { buildUpdateEmailPayload } from "@/api/care-validate/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  User,
  Save,
  CheckCircle,
  ShieldCheck,
  Mail,
  MapPin,
  HeartPulse,
  Loader2,
} from "lucide-react";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "MALE",
  phoneNumber: "",
  address: "",
  address2: "",
  city: "",
  state: "",
  country: "US",
  postalCode: "",
  allergies: "",
  currentMedications: "",
  healthConditions: "",
  languagePreferences: "en",
};

function splitName(fullName = "") {
  const trimmed = String(fullName).trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = trimmed.split(" ");
  return { firstName, lastName: rest.join(" ") };
}

function normalizeDate(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("T")) return raw.slice(0, 10);
  return raw.slice(0, 10);
}

function Field({
  label,
  required = false,
  children,
  span = 1,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? "md:col-span-2" : ""}>
      <span className="apex-field-label flex items-center gap-1 mb-2">
        {label}
        {required && <em className="not-italic" style={{ color: "var(--apex-accent-bright)" }}>*</em>}
      </span>
      {children}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-9 h-9 rounded-[10px] grid place-items-center flex-shrink-0"
        style={{ background: "var(--apex-accent-soft)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "var(--apex-accent-bright)" }} />
      </div>
      <div>
        <span className="apex-eyebrow block">{eyebrow}</span>
        <h3 className="apex-card-title-ink" style={{ fontSize: 20 }}>
          {title}
        </h3>
      </div>
    </div>
  );
}

export default function Profile() {
  const { data: profileData, isLoading, isError } = useProfile();
  const updateProfileUser = useUpdateProfileUser();
  const updateProfileEmail = useUpdateProfileUserEmail();
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newEmail, setNewEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.auth
      .me()
      .then((user) => {
        setCurrentUser(user);
      })
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    const user = profileData || currentUser;
    if (!user) return;

    const mergedName = String(
      user.full_name ||
        user.fullName ||
        user.name ||
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        ""
    );
    const { firstName, lastName } = splitName(mergedName);

    setForm({
      firstName: String(user.firstName || firstName || ""),
      lastName: String(user.lastName || lastName || ""),
      phoneNumber: String(user.phone || user.phoneNumber || ""),
      dob: normalizeDate(String(user.date_of_birth || user.dateOfBirth || user.dob || "")),
      gender: String(user.gender || "MALE"),
      address: String(user.address || ""),
      address2: String(user.address2 || ""),
      city: String(user.city || ""),
      state: String(user.state || ""),
      country: String(user.country || "US"),
      postalCode: String(user.postalCode || user.postal_code || ""),
      allergies: String(user.allergies || ""),
      currentMedications: String(user.currentMedications || ""),
      healthConditions: String(user.healthConditions || ""),
      languagePreferences: Array.isArray(user.languagePreferences)
        ? user.languagePreferences.join(", ")
        : String(user.languagePreferences || "en"),
    });
  }, [profileData, currentUser]);

  const isProfileSaving = updateProfileUser.isPending;
  const isEmailSaving = updateProfileEmail.isPending;

  // The update endpoint (patient-api doc #24) is a PATCH — every field is
  // optional. We only require a name so the identity can't be blanked out;
  // any other field the user leaves empty is simply omitted from the payload
  // (never sent as ""), so a name-only edit saves fine and existing data on
  // the record is left untouched.
  const canSaveProfile =
    Boolean(form.firstName.trim()) && Boolean(form.lastName.trim());

  const handleSave = async () => {
    if (!canSaveProfile) {
      toast({
        title: "Name is required",
        description: "Please enter your first and last name before saving.",
        variant: "destructive",
      });
      return;
    }

    // Send name always; include every other field only when it has a value so
    // an incomplete profile can still be updated without tripping the backend's
    // per-field validation (e.g. phone min 3 chars, country 2-letter ISO).
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
    };
    const addIfSet = (key, value) => {
      const v = String(value ?? "").trim();
      if (v) payload[key] = v;
    };
    addIfSet("dob", form.dob);
    addIfSet("gender", form.gender);
    addIfSet("phoneNumber", form.phoneNumber);
    addIfSet("address", form.address);
    addIfSet("address2", form.address2);
    addIfSet("city", form.city);
    addIfSet("state", form.state);
    addIfSet("country", form.country);
    addIfSet("postalCode", form.postalCode);
    addIfSet("allergies", form.allergies);
    addIfSet("currentMedications", form.currentMedications);
    addIfSet("healthConditions", form.healthConditions);
    const languages = form.languagePreferences
      .split(",")
      .map((lang) => lang.trim())
      .filter(Boolean);
    if (languages.length) payload.languagePreferences = languages;

    try {
      await updateProfileUser.mutateAsync(payload);
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast({
        title: "Unable to update profile",
        description: String(error?.response?.data?.message || "Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleUpdateEmail = async () => {
    const currentEmail = String(currentUser?.email || "").trim();
    const targetEmail = newEmail.trim();

    if (!targetEmail) {
      toast({
        title: "Email is required",
        description: "Please provide a new email address.",
        variant: "destructive",
      });
      return;
    }
    if (currentEmail && currentEmail === targetEmail) {
      toast({
        title: "No email change detected",
        description: "Enter a different email address to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProfileEmail.mutateAsync(buildUpdateEmailPayload(currentEmail, targetEmail));
      toast({
        title: "Email updated",
        description: "Your email address has been updated successfully.",
      });
      setCurrentUser((prev) => ({ ...(prev || {}), email: targetEmail }));
    } catch (error) {
      toast({
        title: "Unable to update email",
        description: String(error?.response?.data?.message || "Please try again."),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--apex-accent-bright)" }} />
      </div>
    );
  }

  const displayName = currentUser?.full_name || [form.firstName, form.lastName].filter(Boolean).join(" ").trim() || "—";
  const initial = (displayName && displayName !== "—" ? displayName[0] : "U").toUpperCase();

  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground">
      {/* Page head */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="apex-ai-tag mb-3">
            <User className="w-3 h-3" strokeWidth={2.2} />
            Account settings
          </div>
          <h1 className="apex-page-title">
            Your <em>profile</em>
          </h1>
          <p className="apex-page-sub">
            Manage your personal information, contact details and medical background.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            fontWeight: 600,
            color: "var(--ink-3)",
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--apex-accent-bright)" }} />
          HIPAA protected
        </span>
      </div>

      {isError && (
        <div
          className="apex-card mb-[18px] p-4 text-sm"
          style={{ borderColor: "var(--att)", background: "var(--att-soft)" }}
        >
          <span style={{ color: "var(--att)" }}>
            Unable to load profile details right now. You can still edit and save manually.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.9fr] gap-[18px]">
        {/* Identity summary */}
        <div className="apex-card p-6 h-fit">
          <div className="flex flex-col items-center text-center">
            <div
              className="w-24 h-24 rounded-full grid place-items-center flex-shrink-0"
              style={{
                background: "var(--apex-accent-soft)",
                border: "1px solid var(--line)",
              }}
            >
              <span
                className="font-sans"
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--apex-accent-bright)",
                }}
              >
                {initial}
              </span>
            </div>

            <h2
              className="font-sans mt-4"
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.015em",
                color: "var(--ink)",
              }}
            >
              {displayName}
            </h2>
            <p
              className="font-mono mt-1"
              style={{ fontSize: 12.5, color: "var(--ink-2)" }}
            >
              {currentUser?.email || "—"}
            </p>
          </div>

          <div className="w-full mt-6 pt-5 space-y-3.5 text-left" style={{ borderTop: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between gap-3">
              <span className="apex-field-label">Phone</span>
              <span className="font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>
                {form.phoneNumber || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="apex-field-label">Date of birth</span>
              <span className="font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>
                {form.dob || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="apex-field-label">Gender</span>
              <span className="font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>
                {form.gender || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="apex-field-label">Location</span>
              <span className="font-mono text-[12.5px] text-right" style={{ color: "var(--ink)" }}>
                {[form.city, form.state].filter(Boolean).join(", ") || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-[18px]">
          {/* Personal information */}
          <div className="apex-card p-6 md:p-7">
            <SectionHeader
              eyebrow="Section 01"
              title="Personal information"
              icon={User}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First name" required>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </Field>
              <Field label="Last name" required>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </Field>
              <Field label="Phone number">
                <Input
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                />
              </Field>
              <Field label="Date of birth">
                <Input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                />
              </Field>
              <Field label="Gender">
                <Input
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  placeholder="MALE / FEMALE / OTHER"
                />
              </Field>
              <Field label="Language preferences">
                <Input
                  value={form.languagePreferences}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, languagePreferences: e.target.value }))
                  }
                  placeholder="en, es"
                />
              </Field>
            </div>
          </div>

          {/* Address */}
          <div className="apex-card p-6 md:p-7">
            <SectionHeader
              eyebrow="Section 02"
              title="Address"
              icon={MapPin}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Street address" span={2}>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </Field>
              <Field label="Address line 2" span={2}>
                <Input
                  value={form.address2}
                  onChange={(e) => setForm((f) => ({ ...f, address2: e.target.value }))}
                  placeholder="Apartment, suite, unit"
                />
              </Field>
              <Field label="City">
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </Field>
              <Field label="State">
                <Input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
              </Field>
              <Field label="Country">
                <Input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                />
              </Field>
              <Field label="Postal code">
                <Input
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                />
              </Field>
            </div>
          </div>

          {/* Medical background */}
          <div className="apex-card p-6 md:p-7">
            <SectionHeader
              eyebrow="Section 03"
              title="Medical background"
              icon={HeartPulse}
            />
            <div className="grid grid-cols-1 gap-4">
              <Field label="Allergies">
                <Input
                  value={form.allergies}
                  onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                  placeholder="e.g. Penicillin, latex"
                />
              </Field>
              <Field label="Current medications">
                <Input
                  value={form.currentMedications}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currentMedications: e.target.value }))
                  }
                  placeholder="e.g. Metformin 500mg, Atorvastatin"
                />
              </Field>
              <Field label="Health conditions">
                <Input
                  value={form.healthConditions}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, healthConditions: e.target.value }))
                  }
                  placeholder="e.g. Hypertension, Type 2 diabetes"
                />
              </Field>
            </div>
          </div>

          {/* Save changes bar */}
          <div
            className="apex-card p-4 md:p-5 flex flex-wrap items-center justify-between gap-3"
            style={{ background: "var(--apex-accent-soft)" }}
          >
            <div className="min-w-0 flex-1">
              <p
                className="font-sans"
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                }}
              >
                Ready to save your changes?
              </p>
              <p className="text-[12.5px] mt-0.5" style={{ color: "var(--ink-2)" }}>
                Update any field and save — only your first and last name are required.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isProfileSaving || !canSaveProfile}
              className="gap-2 min-w-[168px]"
              style={{
                background: saved
                  ? "var(--apex-accent-bright)"
                  : "var(--apex-accent-bright)",
                color: "#fff",
              }}
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Saved
                </>
              ) : isProfileSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save changes
                </>
              )}
            </Button>
          </div>

          {/* Update email */}
          <div className="apex-card p-6 md:p-7">
            <SectionHeader
              eyebrow="Sign-in"
              title="Update email"
              icon={Mail}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Current email">
                <Input value={String(currentUser?.email || "")} disabled />
              </Field>
              <Field label="New email">
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                onClick={handleUpdateEmail}
                disabled={isEmailSaving}
                variant="outline"
                className="gap-2"
              >
                {isEmailSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating…
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Update email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
