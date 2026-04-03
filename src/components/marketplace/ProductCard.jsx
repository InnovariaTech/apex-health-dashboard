import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, AlertCircle, Dumbbell, Calendar } from "lucide-react";

const categoryColors = {
  peptides: "bg-[#E31C25] text-white",
  glp1: "bg-purple-600 text-white",
  trt_hrt: "bg-blue-600 text-white",
  supplements: "bg-black text-white",
  diagnostics: "bg-gray-600 text-white",
  wellness: "bg-gray-800 text-white",
  programs: "bg-green-600 text-white"
};

const categoryLabels = {
  peptides: "PEPTIDE",
  glp1: "GLP-1",
  trt_hrt: "TRT/HRT",
  supplements: "SUPPLEMENT",
  diagnostics: "DIAGNOSTIC",
  wellness: "WELLNESS",
  programs: "PROGRAM"
};

const stockColors = {
  in_stock: "bg-green-100 text-green-800 border-green-300",
  low_stock: "bg-yellow-100 text-yellow-800 border-yellow-300",
  out_of_stock: "bg-red-100 text-red-800 border-red-300"
};

export default function ProductCard({ product, onView, onAddToCart }) {
  const isProgram = product.category === "programs";
  
  return (
    <Card className="border-2 border-gray-100 hover:border-[#E31C25] transition-all duration-300 hover:shadow-lg bg-white">
      <div className="relative">
        {product.image_url ? (
          <div className="aspect-video bg-gray-100 overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            {isProgram ? (
              <Dumbbell className="w-16 h-16 text-gray-300" />
            ) : (
              <Package className="w-16 h-16 text-gray-300" />
            )}
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Badge className={`${categoryColors[product.category] || 'bg-black text-white'} border-none font-bold uppercase text-xs`}>
            {categoryLabels[product.category] || product.category}
          </Badge>
          {product.requires_prescription && (
            <Badge className="bg-white text-black border-2 border-black font-bold text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Rx Required
            </Badge>
          )}
          {isProgram && product.duration_weeks && (
            <Badge className="bg-white text-black border-2 border-green-600 font-bold text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {product.duration_weeks}wk
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-5">
        <h3 className="font-bold text-xl text-black mb-2">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-medium">
          {product.description || "No description available"}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className={`${stockColors[product.stock_status]} border-2 font-bold text-xs`}>
            {product.stock_status?.replace('_', ' ').toUpperCase()}
          </Badge>
          {product.dosage && !isProgram && (
            <Badge variant="outline" className="border-2 border-gray-300 text-gray-600 font-bold text-xs">
              {product.dosage}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold text-[#E31C25]">
            ${product.price.toFixed(2)}
          </span>
          {isProgram && <Dumbbell className="w-6 h-6 text-green-600" />}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onView}
            variant="outline"
            className="flex-1 border-2 border-black text-black hover:bg-black hover:text-white font-bold"
          >
            VIEW DETAILS
          </Button>
          <Button
            onClick={onAddToCart}
            disabled={product.stock_status === 'out_of_stock'}
            className="flex-1 bg-[#E31C25] hover:bg-black text-white font-bold disabled:bg-gray-300"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            ADD TO CART
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}