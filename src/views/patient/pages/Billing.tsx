// @ts-nocheck
import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { CreditCard, Package, CheckCircle, ExternalLink, Receipt } from "lucide-react";

// Mock billing data — replace with real payment integration as needed
const MOCK_PLAN = {
  name: "Black Card Membership",
  status: "active",
  price: "$44.99/mo",
  renewsOn: "May 1, 2026",
};

const MOCK_INVOICES = [
  { id: "INV-0041", date: "Apr 1, 2026", amount: "$44.99", status: "paid" },
  { id: "INV-0033", date: "Mar 1, 2026", amount: "$44.99", status: "paid" },
  { id: "INV-0025", date: "Feb 1, 2026", amount: "$44.99", status: "paid" },
  { id: "INV-0017", date: "Jan 1, 2026", amount: "$44.99", status: "paid" },
];

export default function Billing() {
  const { environment } = useEnvironment();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    api.auth.me().then(setCurrentUser);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment history</p>
      </div>

      {/* Current Plan */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: environment.primaryColor }} />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg text-foreground">{MOCK_PLAN.name}</p>
              <p className="text-sm text-muted-foreground">Renews on {MOCK_PLAN.renewsOn}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">{MOCK_PLAN.price}</p>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" /> Active
              </Badge>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <Button variant="outline" className="flex-1 font-bold">
              Change Plan
            </Button>
            <Button variant="outline" className="flex-1 font-bold text-destructive border-destructive/40 hover:bg-destructive/5">
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" style={{ color: environment.primaryColor }} />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">•••• •••• •••• 4242</p>
                <p className="text-xs text-muted-foreground">Expires 08/28</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="font-bold">Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" style={{ color: environment.primaryColor }} />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_INVOICES.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-semibold text-sm text-foreground">{inv.id}</p>
                  <p className="text-xs text-muted-foreground">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">{inv.amount}</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">Paid</Badge>
                  <Button variant="ghost" size="icon" className="w-7 h-7">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}