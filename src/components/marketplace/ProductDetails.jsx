import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, AlertCircle, Check } from "lucide-react";

const categoryColors = {
  peptides: "bg-[#E31C25] text-white",
  supplements: "bg-black text-white",
  hormones: "bg-gray-700 text-white",
  diagnostics: "bg-gray-600 text-white",
  wellness: "bg-gray-800 text-white"
};

export default function ProductDetails({ product, onClose, onAddToCart }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Badge className={`${categoryColors[product.category] || 'bg-black text-white'} border-none font-bold uppercase mb-3`}>
            {product.category}
          </Badge>
          <h2 className="text-3xl font-bold text-black mb-2">{product.name}</h2>
          <p className="text-4xl font-bold text-[#E31C25]">${product.price.toFixed(2)}</p>
        </div>
        {product.requires_prescription && (
          <Badge className="bg-yellow-100 text-yellow-800 border-2 border-yellow-300 font-bold">
            <AlertCircle className="w-4 h-4 mr-2" />
            PRESCRIPTION REQUIRED
          </Badge>
        )}
      </div>

      {product.image_url && (
        <div className="rounded-sm overflow-hidden border-2 border-gray-200">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-black uppercase mb-2">Description</h3>
          <p className="text-gray-700 font-medium whitespace-pre-wrap">
            {product.description}
          </p>
        </div>

        {product.benefits && product.benefits.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-black uppercase mb-2">Key Benefits</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {product.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-sm">
                  <Check className="w-5 h-5 text-[#E31C25] flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {product.dosage && (
          <div className="p-4 bg-gray-50 rounded-sm border-l-4 border-[#E31C25]">
            <h3 className="text-sm font-bold text-black uppercase mb-2">Recommended Dosage</h3>
            <p className="text-gray-700 font-medium">{product.dosage}</p>
          </div>
        )}

        {product.usage_instructions && (
          <div>
            <h3 className="text-lg font-bold text-black uppercase mb-2">Usage Instructions</h3>
            <p className="text-gray-700 font-medium whitespace-pre-wrap">
              {product.usage_instructions}
            </p>
          </div>
        )}

        {product.contraindications && (
          <div className="p-4 bg-red-50 rounded-sm border-l-4 border-[#E31C25]">
            <h3 className="text-sm font-bold text-black uppercase mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#E31C25]" />
              Important Safety Information
            </h3>
            <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">
              {product.contraindications}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1 border-2 border-gray-300 text-black hover:bg-gray-100 font-bold"
        >
          CLOSE
        </Button>
        <Button
          onClick={onAddToCart}
          disabled={product.stock_status === 'out_of_stock'}
          className="flex-1 bg-[#E31C25] hover:bg-black text-white font-bold disabled:bg-gray-300"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          ADD TO CART
        </Button>
      </div>
    </div>
  );
}