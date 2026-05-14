// @ts-nocheck
import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import {
  useProfile,
  useUpdateProfileUser,
  useUpdateProfileUserEmail,
} from "@/hooks/care-validate/useProfile";
import { buildUpdateEmailPayload } from "@/api/care-validate/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { User, Save, CheckCircle, ShieldCheck, Mail } from "lucide-react";

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

  const canSaveProfile =
    Boolean(form.firstName.trim()) &&
    Boolean(form.lastName.trim()) &&
    Boolean(form.dob.trim()) &&
    Boolean(form.phoneNumber.trim()) &&
    Boolean(form.address.trim()) &&
    Boolean(form.city.trim()) &&
    Boolean(form.state.trim()) &&
    Boolean(form.country.trim()) &&
    Boolean(form.postalCode.trim());

  const handleSave = async () => {
    if (!canSaveProfile) {
      toast({
        title: "Missing required fields",
        description: "Please complete all required profile fields before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProfileUser.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dob: form.dob,
        gender: form.gender || "MALE",
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        address2: form.address2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        postalCode: form.postalCode.trim(),
        allergies: form.allergies.trim(),
        currentMedications: form.currentMedications.trim(),
        healthConditions: form.healthConditions.trim(),
        languagePreferences: form.languagePreferences
          .split(",")
          .map((lang) => lang.trim())
          .filter(Boolean),
      });
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground">
      {/* Page head */}
      <div className="mb-6 pb-5 border-b border-border flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="apex-eyebrow flex items-center gap-1.5 mb-2">
            <User className="w-3 h-3" style={{ color: "var(--apex-accent)" }} />
            Account settings
          </div>
          <h1 className="apex-page-title">
            Your <em>profile</em>
          </h1>
          <p className="text-[13px] text-ink-2 mt-2">
            Manage your personal information and contact details.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-[0.08em] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--apex-accent)" }} />
          HIPAA protected
        </span>
      </div>

      {isError && (
        <div
          className="mb-6 apex-card p-4 text-sm"
          style={{ borderColor: "var(--att)", background: "var(--att-soft)" }}
        >
          <span style={{ color: "var(--att)" }}>
            Unable to load profile details right now. You can still edit and save manually.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Identity summary */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-serif font-medium border border-border bg-secondary text-primary">
              {currentUser?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <p className="font-serif text-lg font-medium text-foreground mt-4">
              {currentUser?.full_name || "—"}
            </p>
            <p className="text-[13px] text-ink-2 font-mono mt-0.5">
              {currentUser?.email || "—"}
            </p>
            <div className="w-full mt-5 pt-5 border-t border-border space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="apex-eyebrow">Phone</span>
                <span className="font-mono text-[12px] text-foreground">
                  {form.phoneNumber || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="apex-eyebrow">Date of birth</span>
                <span className="font-mono text-[12px] text-foreground">
                  {form.dob || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="apex-eyebrow">Location</span>
                <span className="font-mono text-[12px] text-foreground">
                  {[form.city, form.state].filter(Boolean).join(", ") || "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <div className="lg:col-span-2 space-y-3.5">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label>Phone Number *</Label>
                <Input value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="+1 (555) 000-0000" />
              </div>

              <div className="space-y-1.5">
                <Label>Date of Birth *</Label>
                <Input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Input value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} placeholder="MALE / FEMALE / OTHER" />
              </div>

              <div className="space-y-1.5">
                <Label>Address *</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label>Address 2</Label>
                <Input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label>City *</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>State *</Label>
                <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Postal Code *</Label>
                <Input value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label>Allergies</Label>
                <Input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label>Current Medications</Label>
                <Input value={form.currentMedications} onChange={e => setForm(f => ({ ...f, currentMedications: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label>Health Conditions</Label>
                <Input value={form.healthConditions} onChange={e => setForm(f => ({ ...f, healthConditions: e.target.value }))} />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Language Preferences (comma separated)</Label>
                <Input
                  value={form.languagePreferences}
                  onChange={e => setForm(f => ({ ...f, languagePreferences: e.target.value }))}
                  placeholder="en, es"
                />
              </div>

              <div className="md:col-span-2 pt-2 border-t border-border">
                <Button
                  onClick={handleSave}
                  disabled={isProfileSaving || !canSaveProfile}
                  className="w-full"
                >
                  {saved ? (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Saved!</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> {isProfileSaving ? "Saving..." : "Save Changes"}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Update Email */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Update Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current Email</Label>
                <Input value={String(currentUser?.email || "")} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>New Email</Label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="name@example.com" />
              </div>
              <Button onClick={handleUpdateEmail} disabled={isEmailSaving} variant="outline" className="w-full">
                {isEmailSaving ? "Updating Email..." : "Update Email"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
