// @ts-nocheck
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Upload } from "lucide-react";
import { UploadFile } from "@/integrations/Core";

export default function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState(product || {
    name: "",
    category: "supplements",
    description: "",
    benefits: [],
    usage_instructions: "",
    price: 0,
    image_url: "",
    stock_status: "in_stock",
    requires_prescription: false,
    dosage: "",
    contraindications: "",
    duration_weeks: null,
    workout_plan_id: "",
    idevaffiliate_product_id: "",
    affiliate_commission_percentage: 0,
    is_active: true
  });
  const [newBenefit, setNewBenefit] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await UploadFile({ file });
      setFormData({ ...formData, image_url: result.file_url });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");
    }
    setIsUploading(false);
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...(formData.benefits || []), newBenefit.trim()]
      });
      setNewBenefit("");
    }
  };

  const removeBenefit = (index) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-2 border-gray-100">
        <CardHeader className="bg-gray-50 border-b-2 border-gray-100">
          <CardTitle className="text-lg font-bold text-black uppercase">
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2 block">
              Product Name *
            </Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
              placeholder="e.g., BPC-157 Peptide"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2 block">
                Category *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="border-2 border-gray-200 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peptides">Peptides</SelectItem>
                  <SelectItem value="glp1">GLP-1 Medications</SelectItem>
                  <SelectItem value="trt_hrt">TRT/HRT</SelectItem>
                  <SelectItem value="supplements">Supplements</SelectItem>
                  <SelectItem value="diagnostics">Diagnostics</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                  <SelectItem value="programs">Training Programs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2 block">
                Price (USD) *
              </Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
                placeholder="99.99"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2 block">
              Description
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold min-h-[100px]"
              placeholder="Detailed product description..."
            />
          </div>

          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2 block">
              Product Image
            </Label>
            <div className="flex items-center gap-4">
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Product"
                  className="w-24 h-24 object-cover rounded-sm border-2 border-gray-200"
                />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label htmlFor="image-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-black text-black hover:bg-black hover:text-white font-bold"
                    disabled={isUploading}
                    onClick={() => document.getElementById('image-upload').click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'UPLOADING...' : 'UPLOAD IMAGE'}
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card className="border-2 border-gray-100">
        <CardHeader className="bg-gray-50 border-b-2 border-gray-100">
          <CardTitle className="text-lg font-bold text-black uppercase">
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2 block">
              Benefits
            </Label>
            <div className="space-y-2">
              {formData.benefits?.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-sm">
                  <span className="flex-1 text-sm font-semibold text-black">{benefit}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBenefit(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
                  placeholder="Add a benefit..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button
                  type="button"
                  onClick={addBenefit}
                  variant="outline"
                  className="border-2 border-black text-black hover:bg-black hover:text-white font-bold"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2 block">
                Dosage
              </Label>
              <Input
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
                placeholder="e.g., 250mcg daily"
              />
            </div>

            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2 block">
                Stock Status
              </Label>
              <Select
                value={formData.stock_status}
                onValueChange={(value) => setFormData({ ...formData, stock_status: value })}
              >
                <SelectTrigger className="border-2 border-gray-200 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2 block">
              Usage Instructions
            </Label>
            <Textarea
              value={formData.usage_instructions}
              onChange={(e) => setFormData({ ...formData, usage_instructions: e.target.value })}
              className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold min-h-[80px]"
              placeholder="How to use this product..."
            />
          </div>

          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2 block">
              Contraindications / Warnings
            </Label>
            <Textarea
              value={formData.contraindications}
              onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
              className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold min-h-[80px]"
              placeholder="Safety information and warnings..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires_prescription"
              checked={formData.requires_prescription}
              onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
              className="w-5 h-5"
            />
            <Label htmlFor="requires_prescription" className="text-sm font-bold text-black uppercase cursor-pointer">
              Requires Prescription
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Affiliate Tracking */}
      <Card className="border-2 border-[#E31C25] bg-red-50">
        <CardHeader className="bg-[#E31C25] border-b-2 border-black">
          <CardTitle className="text-lg font-bold text-white uppercase">
            Affiliate Tracking (iDevAffiliate Integration)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2 block">
                iDevAffiliate Product ID
              </Label>
              <Input
                value={formData.idevaffiliate_product_id}
                onChange={(e) => setFormData({ ...formData, idevaffiliate_product_id: e.target.value })}
                className="border-2 border-gray-300 focus:border-[#E31C25] font-semibold bg-white"
                placeholder="Product ID from iDevAffiliate"
              />
              <p className="text-xs text-gray-600 mt-1 font-semibold">
                Used to track sales in iDevAffiliate system
              </p>
            </div>

            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2 block">
                Affiliate Commission %
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.affiliate_commission_percentage}
                onChange={(e) => setFormData({ ...formData, affiliate_commission_percentage: parseFloat(e.target.value) || 0 })}
                className="border-2 border-gray-300 focus:border-[#E31C25] font-semibold bg-white"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-600 mt-1 font-semibold">
                Commission percentage for affiliate partners
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border-2 border-gray-300 rounded-sm">
            <p className="text-sm font-bold text-black mb-2">TRACKING IMPLEMENTATION NOTES:</p>
            <ul className="text-xs text-gray-700 space-y-1 font-semibold list-disc list-inside">
              <li>Each purchase will be tracked via iDevAffiliate API</li>
              <li>Coach tracking codes will be captured from URL parameters</li>
              <li>Commissions calculated automatically based on percentage</li>
              <li>Sales data synced to iDevAffiliate in real-time</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Program Specific (if category is programs) */}
      {formData.category === 'programs' && (
        <Card className="border-2 border-gray-100">
          <CardHeader className="bg-gray-50 border-b-2 border-gray-100">
            <CardTitle className="text-lg font-bold text-black uppercase">
              Training Program Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-bold text-black uppercase mb-2 block">
                  Duration (Weeks)
                </Label>
                <Input
                  type="number"
                  value={formData.duration_weeks || ''}
                  onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || null })}
                  className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
                  placeholder="12"
                />
              </div>

              <div>
                <Label className="text-sm font-bold text-black uppercase mb-2 block">
                  Workout Plan ID
                </Label>
                <Input
                  value={formData.workout_plan_id}
                  onChange={(e) => setFormData({ ...formData, workout_plan_id: e.target.value })}
                  className="border-2 border-gray-200 focus:border-[#E31C25] font-semibold"
                  placeholder="Associated workout plan"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-2 border-gray-300 text-black hover:bg-gray-100 font-bold"
        >
          CANCEL
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#E31C25] hover:bg-black text-white font-bold"
        >
          {product ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'}
        </Button>
      </div>
    </form>
  );
}