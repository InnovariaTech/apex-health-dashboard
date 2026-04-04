import React, { useState, useEffect } from "react";
import { FoodLog } from "@/entities/FoodLog";
import { NutritionPlan } from "@/entities/NutritionPlan";
import { User } from "@/entities/User";
import { UploadFile, InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Apple, 
  Plus,
  Camera,
  Scan,
  Upload,
  Droplet,
  Flame,
  Activity,
  FileText,
  Calendar,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MOCK_WEEKLY_DATA = [
  { day: "Mon", calories: 2150, protein: 168, carbs: 195, fat: 72 },
  { day: "Tue", calories: 1980, protein: 142, carbs: 210, fat: 58 },
  { day: "Wed", calories: 2310, protein: 185, carbs: 220, fat: 80 },
  { day: "Thu", calories: 2050, protein: 160, carbs: 188, fat: 65 },
  { day: "Fri", calories: 2200, protein: 175, carbs: 205, fat: 70 },
  { day: "Sat", calories: 2450, protein: 155, carbs: 260, fat: 88 },
  { day: "Sun", calories: 1850, protein: 130, carbs: 175, fat: 60 },
];

const MACRO_COLORS = {
  protein: "#3b82f6",
  carbs: "#f59e0b",
  fat: "#ef4444",
  calories: "#8b5cf6",
};

export default function Nutrition() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [todayLogs, setTodayLogs] = useState([]);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadClientNutrition();
    }
  }, [selectedClientId, selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.role === "admin") {
        const allUsers = await User.list();
        const clientList = allUsers.filter(u => u.role !== "admin");
        setClients(clientList);
        if (clientList.length > 0) {
          setSelectedClientId(clientList[0].email);
        }
      } else {
        setSelectedClientId(user.email);
        loadClientNutrition(user.email);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const loadClientNutrition = async (userId = selectedClientId) => {
    if (!userId) return;

    try {
      const [logs, plans] = await Promise.all([
        FoodLog.filter({ user_id: userId, date: selectedDate }, '-created_date'),
        NutritionPlan.filter({ user_id: userId }, '-created_date', 1)
      ]);

      setTodayLogs(logs);
      setNutritionPlan(plans[0] || null);
    } catch (error) {
      console.error("Error loading nutrition data:", error);
    }
  };

  const handlePhotoScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const { file_url } = await UploadFile({ file });

      const response = await InvokeLLM({
        prompt: `Analyze this food image and extract nutritional information. Identify the food items and estimate the macronutrients. Provide a detailed breakdown.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            food_name: { type: "string" },
            calories: { type: "number" },
            protein_grams: { type: "number" },
            carbs_grams: { type: "number" },
            fat_grams: { type: "number" },
            fiber_grams: { type: "number" },
            serving_size: { type: "string" }
          }
        }
      });

      await FoodLog.create({
        user_id: selectedClientId,
        date: selectedDate,
        meal_type: "snack",
        image_url: file_url,
        ...response
      });

      setShowScanOptions(false);
      loadClientNutrition();
    } catch (error) {
      console.error("Error scanning photo:", error);
      alert("Error analyzing image. Please try again.");
    }
    setIsScanning(false);
  };

  const handleBarcodeInput = async (barcode) => {
    setIsScanning(true);
    try {
      const response = await InvokeLLM({
        prompt: `Look up the nutritional information for the product with barcode: ${barcode}. Provide the food name and complete macronutrient breakdown.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            food_name: { type: "string" },
            calories: { type: "number" },
            protein_grams: { type: "number" },
            carbs_grams: { type: "number" },
            fat_grams: { type: "number" },
            fiber_grams: { type: "number" },
            serving_size: { type: "string" }
          }
        }
      });

      await FoodLog.create({
        user_id: selectedClientId,
        date: selectedDate,
        meal_type: "snack",
        ...response
      });

      setShowScanOptions(false);
      loadClientNutrition();
    } catch (error) {
      console.error("Error looking up barcode:", error);
      alert("Error finding product. Please enter manually.");
    }
    setIsScanning(false);
  };

  const handleUploadPDF = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClientId) return;

    try {
      const { file_url } = await UploadFile({ file });

      if (nutritionPlan) {
        await NutritionPlan.update(nutritionPlan.id, {
          meal_plan_pdf: file_url
        });
      } else {
        await NutritionPlan.create({
          user_id: selectedClientId,
          plan_name: "Custom Meal Plan",
          daily_calories: 2000,
          protein_grams: 150,
          carbs_grams: 200,
          fat_grams: 65,
          meal_plan_pdf: file_url,
          start_date: format(new Date(), 'yyyy-MM-dd')
        });
      }

      loadClientNutrition();
      alert("Meal plan PDF uploaded successfully!");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      alert("Error uploading PDF. Please try again.");
    }
  };

  const handleDeleteLog = async (logId) => {
    if (confirm("Delete this meal entry?")) {
      await FoodLog.delete(logId);
      loadClientNutrition();
    }
  };

  const calculateTotals = () => {
    return todayLogs.reduce((totals, log) => ({
      calories: totals.calories + (log.calories || 0),
      protein: totals.protein + (log.protein_grams || 0),
      carbs: totals.carbs + (log.carbs_grams || 0),
      fat: totals.fat + (log.fat_grams || 0),
      fiber: totals.fiber + (log.fiber_grams || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const totals = calculateTotals();
  const isAdmin = currentUser?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 pb-6 border-b-2 border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              NUTRITION TRACKER
            </h1>
            <p className="text-muted-foreground font-semibold">
              Track your daily macronutrients and meals
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadPDF}
                  className="hidden"
                />
                <Button className="bg-foreground hover:bg-primary text-background font-bold">
                  <Upload className="w-5 h-5 mr-2" />
                  UPLOAD MEAL PLAN PDF
                </Button>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Client Selector (Admin Only) */}
      {isAdmin && clients.length > 0 && (
        <Card className="mb-6 border-2 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-foreground uppercase">
                Select Client:
              </label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="max-w-xs border-2 border-border font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.email} value={client.email}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Selector */}
      <Card className="mb-6 border-2 border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-2 border-border font-semibold"
              />
            </div>
            <Button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              variant="outline"
              className="border-2 border-border font-bold"
            >
              TODAY
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Macro Goals & Progress */}
      {nutritionPlan && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-2 border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Calories</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-foreground">{totals.calories}</span>
                <span className="text-lg text-muted-foreground font-semibold">/ {nutritionPlan.daily_calories}</span>
              </div>
              <Progress 
                value={(totals.calories / nutritionPlan.daily_calories) * 100} 
                className="h-3"
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Protein</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-foreground">{totals.protein}g</span>
                <span className="text-lg text-muted-foreground font-semibold">/ {nutritionPlan.protein_grams}g</span>
              </div>
              <Progress 
                value={(totals.protein / nutritionPlan.protein_grams) * 100} 
                className="h-3"
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Apple className="w-5 h-5 text-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Carbs</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-foreground">{totals.carbs}g</span>
                <span className="text-lg text-muted-foreground font-semibold">/ {nutritionPlan.carbs_grams}g</span>
              </div>
              <Progress 
                value={(totals.carbs / nutritionPlan.carbs_grams) * 100} 
                className="h-3"
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Droplet className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Fat</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-foreground">{totals.fat}g</span>
                <span className="text-lg text-muted-foreground font-semibold">/ {nutritionPlan.fat_grams}g</span>
              </div>
              <Progress 
                value={(totals.fat / nutritionPlan.fat_grams) * 100} 
                className="h-3"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Macronutrient Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Macros Bar Chart */}
        <Card className="border-2 border-border lg:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-bold text-foreground uppercase">7-Day Macro Trends</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MOCK_WEEKLY_DATA} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(value, name) => [`${value}${name === "calories" ? " kcal" : "g"}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Bar dataKey="protein" fill={MACRO_COLORS.protein} name="Protein" radius={[3,3,0,0]} />
                <Bar dataKey="carbs" fill={MACRO_COLORS.carbs} name="Carbs" radius={[3,3,0,0]} />
                <Bar dataKey="fat" fill={MACRO_COLORS.fat} name="Fat" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Today's Macro Split Pie */}
        <Card className="border-2 border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-bold text-foreground uppercase">Today's Macro Split</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              const displayTotals = (totals.protein + totals.carbs + totals.fat) > 0
                ? [
                    { name: "Protein", value: totals.protein, color: MACRO_COLORS.protein },
                    { name: "Carbs", value: totals.carbs, color: MACRO_COLORS.carbs },
                    { name: "Fat", value: totals.fat, color: MACRO_COLORS.fat },
                  ]
                : [
                    { name: "Protein", value: 175, color: MACRO_COLORS.protein },
                    { name: "Carbs", value: 205, color: MACRO_COLORS.carbs },
                    { name: "Fat", value: 70, color: MACRO_COLORS.fat },
                  ];
              return (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={displayTotals} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {displayTotals.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}g`, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-around mt-2">
                    {displayTotals.map((item) => (
                      <div key={item.name} className="text-center">
                        <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                        <p className="text-xs font-bold text-muted-foreground">{item.name}</p>
                        <p className="text-sm font-bold text-foreground">{item.value}g</p>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Meal Plan PDF */}
      {nutritionPlan?.meal_plan_pdf && (
        <Card className="mb-6 border-2 border-primary/40 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-bold text-foreground">Custom Meal Plan Available</p>
                  <p className="text-sm text-muted-foreground font-semibold">
                    Your coach has uploaded a personalized meal plan for you
                  </p>
                </div>
              </div>
              <a href={nutritionPlan.meal_plan_pdf} target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold">
                  VIEW PDF
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Meal Actions */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => setShowAddMeal(true)}
          className="flex-1 md:flex-none bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          ADD MEAL
        </Button>
        <Button
          onClick={() => setShowScanOptions(true)}
          variant="outline"
          className="flex-1 md:flex-none border-2 border-border font-bold py-6"
        >
          <Camera className="w-5 h-5 mr-2" />
          SCAN FOOD
        </Button>
      </div>

      {/* Meal Logs */}
      <Card className="border-2 border-border">
        <CardHeader className="border-b-2 border-border bg-muted">
          <CardTitle className="text-xl font-bold text-foreground uppercase">
            Today's Meals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {todayLogs.length === 0 ? (
            <div className="text-center py-12">
              <Apple className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">No meals logged yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your nutrition by adding your first meal
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                const meals = todayLogs.filter(log => log.meal_type === mealType);
                if (meals.length === 0) return null;

                return (
                  <div key={mealType} className="space-y-2">
                    <h3 className="font-bold text-foreground uppercase text-sm flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground">{mealType}</Badge>
                    </h3>
                    {meals.map((meal) => (
                      <Card key={meal.id} className="border-2 border-border hover:border-primary transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {meal.image_url && (
                              <img 
                                src={meal.image_url} 
                                alt={meal.food_name}
                                className="w-20 h-20 object-cover rounded-sm"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-bold text-foreground text-lg">{meal.food_name}</h4>
                                  {meal.serving_size && (
                                    <p className="text-sm text-muted-foreground font-semibold">{meal.serving_size}</p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteLog(meal.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                <div className="text-center p-2 bg-muted rounded-sm">
                                  <p className="text-xs text-muted-foreground font-bold uppercase">Calories</p>
                                  <p className="text-lg font-bold text-foreground">{meal.calories || 0}</p>
                                </div>
                                <div className="text-center p-2 bg-muted rounded-sm">
                                  <p className="text-xs text-muted-foreground font-bold uppercase">Protein</p>
                                  <p className="text-lg font-bold text-primary">{meal.protein_grams || 0}g</p>
                                </div>
                                <div className="text-center p-2 bg-muted rounded-sm">
                                  <p className="text-xs text-muted-foreground font-bold uppercase">Carbs</p>
                                  <p className="text-lg font-bold text-foreground">{meal.carbs_grams || 0}g</p>
                                </div>
                                <div className="text-center p-2 bg-muted rounded-sm">
                                  <p className="text-xs text-muted-foreground font-bold uppercase">Fat</p>
                                  <p className="text-lg font-bold text-foreground">{meal.fat_grams || 0}g</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Meal Dialog */}
      <AddMealDialog
        open={showAddMeal}
        onOpenChange={setShowAddMeal}
        userId={selectedClientId}
        date={selectedDate}
        onSuccess={() => {
          setShowAddMeal(false);
          loadClientNutrition();
        }}
      />

      {/* Scan Options Dialog */}
      <Dialog open={showScanOptions} onOpenChange={setShowScanOptions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              SCAN FOOD
            </DialogTitle>
            <p className="text-muted-foreground font-medium mt-2">
              Choose how you'd like to add your meal
            </p>
          </DialogHeader>

          {isScanning ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="font-semibold text-foreground">Analyzing...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoScan}
                  className="hidden"
                />
                <Card className="border-2 border-border hover:border-primary transition-all">
                  <CardContent className="p-6 text-center">
                    <Camera className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h3 className="font-bold text-foreground mb-1">Take Photo</h3>
                    <p className="text-sm text-muted-foreground font-semibold">
                      AI will analyze your food and estimate macros
                    </p>
                  </CardContent>
                </Card>
              </label>

              <BarcodeScanner onScan={handleBarcodeInput} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Meal Dialog Component
function AddMealDialog({ open, onOpenChange, userId, date, onSuccess }) {
  const [meal, setMeal] = useState({
    meal_type: "breakfast",
    food_name: "",
    calories: 0,
    protein_grams: 0,
    carbs_grams: 0,
    fat_grams: 0,
    fiber_grams: 0,
    serving_size: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await FoodLog.create({
      user_id: userId,
      date,
      ...meal
    });
    onSuccess();
    setMeal({
      meal_type: "breakfast",
      food_name: "",
      calories: 0,
      protein_grams: 0,
      carbs_grams: 0,
      fat_grams: 0,
      fiber_grams: 0,
      serving_size: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            ADD MEAL
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-foreground uppercase mb-2 block">
                Meal Type
              </label>
              <Select value={meal.meal_type} onValueChange={(value) => setMeal({...meal, meal_type: value})}>
                <SelectTrigger className="border-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-bold text-foreground uppercase mb-2 block">
                Food Name
              </label>
              <Input
                value={meal.food_name}
                onChange={(e) => setMeal({...meal, food_name: e.target.value})}
                placeholder="e.g., Grilled Chicken Breast"
                required
                className="border-2 border-border"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-foreground uppercase mb-2 block">
              Serving Size
            </label>
            <Input
              value={meal.serving_size}
              onChange={(e) => setMeal({...meal, serving_size: e.target.value})}
              placeholder="e.g., 6 oz, 1 cup, 2 pieces"
              className="border-2 border-border"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Calories", key: "calories" },
              { label: "Protein (g)", key: "protein_grams" },
              { label: "Carbs (g)", key: "carbs_grams" },
              { label: "Fat (g)", key: "fat_grams" },
              { label: "Fiber (g)", key: "fiber_grams" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-sm font-bold text-foreground uppercase mb-2 block">{label}</label>
                <Input
                  type="number"
                  value={meal[key]}
                  onChange={(e) => setMeal({...meal, [key]: parseFloat(e.target.value) || 0})}
                  className="border-2 border-border"
                />
              </div>
            ))}
            <div className="hidden">
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-2 border-border font-bold"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-bold"
            >
              ADD MEAL
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Barcode Scanner Component
function BarcodeScanner({ onScan }) {
  const [barcode, setBarcode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode);
      setBarcode("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-2 border-border hover:border-foreground transition-all">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <Scan className="w-12 h-12 text-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-1">Scan Barcode</h3>
            <p className="text-sm text-muted-foreground font-semibold">
              Enter barcode number to look up product
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode number"
              className="border-2 border-border"
            />
            <Button type="submit" className="bg-foreground hover:bg-primary text-background font-bold">
              LOOKUP
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}