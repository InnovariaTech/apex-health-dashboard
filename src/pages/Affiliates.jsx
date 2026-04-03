import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPageUrl } from "@/utils";
import { Users, DollarSign, Link as LinkIcon, ExternalLink, Gift, Target, Zap } from "lucide-react";

export default function Affiliates() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [affiliateId, setAffiliateId] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const user = await api.auth.me();
    setCurrentUser(user);
    if (user?.idevaffiliate_id) {
      setAffiliateId(user.idevaffiliate_id);
      setAffiliateLink(`${window.location.origin}${createPageUrl("Marketplace")}?idev_id=${user.idevaffiliate_id}`);
    }
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateLink);
    alert("Affiliate link copied to clipboard!");
  };

  const benefits = [
    { icon: DollarSign, title: "Competitive Commission", description: "Earn competitive commissions on products and services based on individual product tiers" },
    { icon: Gift, title: "Exclusive Resources", description: "Access to marketing materials, product training, and promotional content" },
    { icon: Target, title: "Performance Bonuses", description: "Unlock additional rewards as you hit performance milestones" },
    { icon: Zap, title: "Real-Time Tracking", description: "Monitor your referrals, conversions, and earnings in real-time" }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      <div className="mb-8 pb-6 border-b-2 border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center">
            <Users className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">AFFILIATE PROGRAM</h1>
            <p className="text-muted-foreground font-semibold">Partner with us & earn commissions</p>
          </div>
        </div>
      </div>

      {affiliateLink && (
        <Card className="mb-8 border-2 border-green-500">
          <CardHeader className="bg-green-600 border-b-2 border-green-700">
            <CardTitle className="text-lg font-bold text-white uppercase flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />Your Affiliate Link
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-sm font-bold text-foreground uppercase mb-2 block">Your Affiliate ID</Label>
              <p className="text-2xl font-bold text-green-600">{affiliateId}</p>
            </div>
            <div>
              <Label className="text-sm font-bold text-foreground uppercase mb-2 block">Your Tracking Link</Label>
              <div className="flex gap-2">
                <Input value={affiliateLink} readOnly className="font-mono text-sm border-2 border-border" />
                <Button onClick={copyToClipboard} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                  <LinkIcon className="w-4 h-4 mr-2" />COPY
                </Button>
              </div>
            </div>
            <div className="p-4 bg-muted border-2 border-border rounded-sm">
              <p className="text-sm font-bold text-foreground mb-2">HOW TO USE YOUR LINK:</p>
              <ul className="text-xs text-muted-foreground space-y-1 font-semibold list-disc list-inside">
                <li>Share this link with your clients and audience</li>
                <li>Anyone who clicks and purchases will be tracked to your account</li>
                <li>Tracking cookie lasts 30 days - credit even if they purchase later</li>
                <li>Earn commissions on all eligible products they buy</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8 border-2 border-primary bg-foreground text-background">
        <CardContent className="p-8 md:p-12">
          <div className="max-w-3xl">
            <Badge className="bg-primary text-primary-foreground border-none font-bold mb-4">PARTNER OPPORTUNITY</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the Partner Network</h2>
            <p className="text-xl opacity-70 font-medium mb-6">
              Partner with us to offer cutting-edge longevity medicine, GLP-1 therapy, peptides, and elite fitness programs. Earn commissions while helping people optimize their health and performance.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="https://partner.apexmd.com" target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-lg px-8 py-6">
                  <ExternalLink className="w-5 h-5 mr-2" />LOGIN TO PARTNER PORTAL
                </Button>
              </a>
              <a href="https://partner.apexmd.com/signup" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-2 border-background text-background hover:bg-background hover:text-foreground font-bold text-lg px-8 py-6">SIGN UP NOW</Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-6 uppercase">Partner Benefits</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit, idx) => (
            <Card key={idx} className="border-2 border-border hover:border-primary transition-all bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground font-medium">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mb-8 border-2 border-border">
        <CardHeader className="border-b-2 border-border bg-muted">
          <CardTitle className="text-xl font-bold text-foreground uppercase">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {[
            { n: 1, title: "Sign Up", desc: "Create your partner account at partner.apexmd.com and get approved within 24-48 hours", primary: true },
            { n: 2, title: "Get Your Links", desc: "Access your unique referral links and marketing materials from the partner dashboard", primary: false },
            { n: 3, title: "Share & Earn", desc: "Promote products and earn commissions on every sale through your links", primary: true },
            { n: 4, title: "Track & Grow", desc: "Monitor your performance in real-time and scale your earnings as you grow", primary: false },
          ].map(({ n, title, desc, primary }) => (
            <div key={n} className="flex items-start gap-4">
              <div className={`w-10 h-10 ${primary ? 'bg-primary' : 'bg-foreground'} rounded-sm flex items-center justify-center flex-shrink-0`}>
                <span className={`${primary ? 'text-primary-foreground' : 'text-background'} font-bold text-lg`}>{n}</span>
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-1">{title}</h4>
                <p className="text-muted-foreground font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-foreground bg-foreground text-background">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Partner With Us?</h2>
          <p className="opacity-70 font-medium mb-6 max-w-2xl mx-auto">
            Join our growing network of partners and start earning while helping people achieve their health and fitness goals.
          </p>
          <a href="https://partner.apexmd.com" target="_blank" rel="noopener noreferrer">
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-lg px-8 py-6">
              <ExternalLink className="w-5 h-5 mr-2" />ACCESS PARTNER PORTAL
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}