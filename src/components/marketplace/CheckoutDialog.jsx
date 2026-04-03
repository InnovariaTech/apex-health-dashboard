
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, CreditCard, Package, CheckCircle } from "lucide-react";

export default function CheckoutDialog({ open, onOpenChange, cart, total, onCheckout }) {
  const [shippingInfo, setShippingInfo] = useState({
    street: "",
    city: "",
    state: "",
    zip: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState(null);

  React.useEffect(() => {
    // Check for affiliate tracking code
    const storedCode = localStorage.getItem('apex_affiliate_code');
    if (storedCode) {
      setAffiliateCode(storedCode);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    await onCheckout(shippingInfo);
    setIsProcessing(false);
    setShippingInfo({ street: "", city: "", state: "", zip: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#E31C25]" />
            CHECKOUT
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <Card className="border-2 border-gray-100 bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-bold text-black uppercase mb-3">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-bold text-black">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-center">
                <span className="text-lg font-bold text-black">TOTAL:</span>
                <span className="text-2xl font-bold text-[#E31C25]">
                  ${total.toFixed(2)}
                </span>
              </div>
              {affiliateCode && (
                <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-sm">
                  <p className="text-xs text-green-800 font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Affiliate credit will be applied to: {affiliateCode}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <div className="space-y-4">
            <h3 className="font-bold text-black uppercase">Shipping Information</h3>
            
            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2 block">
                Street Address *
              </Label>
              <Input
                required
                value={shippingInfo.street}
                onChange={(e) => setShippingInfo({...shippingInfo, street: e.target.value})}
                className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-bold text-black uppercase mb-2 block">
                  City *
                </Label>
                <Input
                  required
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                  className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
                  placeholder="New York"
                />
              </div>

              <div>
                <Label className="text-sm font-bold text-black uppercase mb-2 block">
                  State *
                </Label>
                <Input
                  required
                  value={shippingInfo.state}
                  onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                  className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
                  placeholder="NY"
                  maxLength={2}
                />
              </div>

              <div>
                <Label className="text-sm font-bold text-black uppercase mb-2 block">
                  ZIP Code *
                </Label>
                <Input
                  required
                  value={shippingInfo.zip}
                  onChange={(e) => setShippingInfo({...shippingInfo, zip: e.target.value})}
                  className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="border-2 border-[#E31C25] bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-[#E31C25] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-black text-sm">Prescription Products Notice</p>
                  <p className="text-xs text-gray-700 font-medium">
                    Orders containing prescription items will be reviewed by our Apex MD telehealth physicians. You'll receive a consultation link via email within 24 hours.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 border-2 border-gray-300 text-black hover:bg-gray-100 font-bold"
              disabled={isProcessing}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#E31C25] hover:bg-black text-white font-bold"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  PLACE ORDER
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
