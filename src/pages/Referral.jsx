import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { Gift, Users, Star, Copy, Check, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const MOCK_REFERRALS = [
  { id: "r1", referred_name: "Marcus Johnson", referred_email: "marcus.j@gmail.com", status: "converted", points_awarded: 200 },
  { id: "r2", referred_name: "Priya Patel", referred_email: "priya.p@gmail.com", status: "joined", points_awarded: 50 },
  { id: "r3", referred_name: "Derek Williams", referred_email: "derek.w@gmail.com", status: "joined", points_awarded: 50 },
  { id: "r4", referred_name: "Sofia Garcia", referred_email: "sofia.g@gmail.com", status: "pending", points_awarded: 0 },
  { id: "r5", referred_name: "Tom Chen", referred_email: "tom.c@gmail.com", status: "converted", points_awarded: 200 },
];

const MOCK_REWARD_POINTS = { total_points: 850, redeemable_points: 500 };

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  joined: "bg-blue-100 text-blue-800",
  converted: "bg-green-100 text-green-800",
};

const POINTS_PER_STATUS = {
  pending: 0,
  joined: 50,
  converted: 200,
};

export default function Referral() {
  const { environment } = useEnvironment();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [rewardPoints, setRewardPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const user = await api.auth.me();
    setCurrentUser(user);
    const [refs, points] = await Promise.all([
      api.entities.Referral.filter({ referrer_user_id: user.email }),
      api.entities.RewardPoints.filter({ user_id: user.email }),
    ]);
    setReferrals(refs.length > 0 ? refs : MOCK_REFERRALS);
    setRewardPoints(points[0] || MOCK_REWARD_POINTS);
    setLoading(false);
  };

  const referralLink = currentUser
    ? `${window.location.origin}?ref=${btoa(currentUser.email)}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name) return;
    setSubmitting(true);
    await api.entities.Referral.create({
      referrer_user_id: currentUser.email,
      referred_email: form.email,
      referred_name: form.name,
      status: "pending",
      points_awarded: 0,
    });
    setForm({ name: "", email: "" });
    await init();
    setSubmitting(false);
    toast({ title: "Referral sent!", description: `We'll reach out to ${form.name}.` });
  };

  const totalPoints = referrals.reduce((sum, r) => sum + (r.points_awarded || 0), 0);
  const redeemable = rewardPoints?.redeemable_points ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: environment.primaryColor }}>
          Referral Program
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Refer friends &amp; family and earn points redeemable for rewards.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Users className="w-8 h-8 mb-2" style={{ color: environment.primaryColor }} />
            <p className="text-3xl font-bold">{referrals.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Star className="w-8 h-8 mb-2" style={{ color: environment.primaryColor }} />
            <p className="text-3xl font-bold">{totalPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">Points Earned</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Gift className="w-8 h-8 mb-2" style={{ color: environment.primaryColor }} />
            <p className="text-3xl font-bold">{redeemable}</p>
            <p className="text-xs text-muted-foreground mt-1">Redeemable Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Points guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Points Work</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className="p-3 rounded-lg bg-yellow-50">
            <p className="font-bold text-yellow-700">+0 pts</p>
            <p className="text-muted-foreground mt-1">Referral Sent</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50">
            <p className="font-bold text-blue-700">+50 pts</p>
            <p className="text-muted-foreground mt-1">They Join</p>
          </div>
          <div className="p-3 rounded-lg bg-green-50">
            <p className="font-bold text-green-700">+200 pts</p>
            <p className="text-muted-foreground mt-1">They Purchase</p>
          </div>
        </CardContent>
      </Card>

      {/* Referral link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={referralLink} readOnly className="text-xs" />
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </CardContent>
      </Card>

      {/* Send referral form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Refer Someone Directly</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Name</Label>
              <Input
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Email</Label>
              <Input
                type="email"
                placeholder="jane@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={submitting} style={{ backgroundColor: environment.primaryColor, color: "#fff" }}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Referral history */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-sm">{r.referred_name}</p>
                    <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">+{r.points_awarded} pts</span>
                    <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}