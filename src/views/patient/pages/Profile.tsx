// @ts-nocheck
import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { useProfile } from "@/hooks/care-validate/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { User, Save, CheckCircle } from "lucide-react";

export default function Profile() {
  const { environment } = useEnvironment();
  const { data: profileData, isLoading, isError } = useProfile();
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ full_name: "", phone: "", date_of_birth: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    if (!profileData) return;

    const fullName = String(
      profileData.full_name ||
      profileData.fullName ||
      profileData.name ||
      [profileData.firstName, profileData.lastName].filter(Boolean).join(" ").trim() ||
      ""
    );

    setForm({
      full_name: fullName,
      phone: String(profileData.phone || profileData.phoneNumber || ""),
      date_of_birth: String(profileData.date_of_birth || profileData.dateOfBirth || profileData.dob || ""),
      bio: String(profileData.bio || profileData.notes || ""),
    });
  }, [profileData]);

  const handleSave = async () => {
    setSaving(true);
    await api.auth.updateMe(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" style={{ color: environment.primaryColor }} />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {isError && (
            <p className="text-sm text-destructive">
              Unable to load profile details right now. You can still edit and save manually.
            </p>
          )}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2"
              style={{ backgroundColor: environment.primaryColor + "20", borderColor: environment.primaryColor, color: environment.primaryColor }}
            >
              {currentUser?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-foreground">{currentUser?.full_name || "—"}</p>
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>

          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
          </div>

          <div className="space-y-1">
            <Label>Date of Birth</Label>
            <Input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
          </div>

          <div className="space-y-1">
            <Label>Bio / Notes</Label>
            <textarea
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Anything your coach should know about you..."
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full font-bold"
            style={{ backgroundColor: environment.primaryColor }}
          >
            {saved ? (
              <><CheckCircle className="w-4 h-4 mr-2" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}