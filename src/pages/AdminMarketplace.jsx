import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pill, Dumbbell, UserCheck, CreditCard, Plus, Pencil, Trash2,
  Check, Star, Clock, Award, ShoppingBag, AlertCircle
} from "lucide-react";

// ── Mock editable data ────────────────────────────────────────────────────────

const INIT_SUPPLEMENTS = [
  { id: 1, name: "Elite Whey Protein", price: 59, stock: "In Stock", category: "Protein", active: true },
  { id: 2, name: "Pre-Workout SURGE", price: 49, stock: "In Stock", category: "Energy", active: true },
  { id: 3, name: "Omega-3 Ultra", price: 34, stock: "Low Stock", category: "Health", active: true },
  { id: 4, name: "Creatine Monohydrate", price: 29, stock: "In Stock", category: "Strength", active: true },
];

const INIT_PROGRAMS = [
  { id: 1, name: "8-Week Shred", price: 129, duration: "8 Weeks", level: "Intermediate", active: true },
  { id: 2, name: "Powerlifting Foundation", price: 149, duration: "12 Weeks", level: "All Levels", active: true },
  { id: 3, name: "Lean Muscle Builder", price: 119, duration: "10 Weeks", level: "Intermediate", active: true },
];

const INIT_PT = [
  { id: 1, name: "Starter Pack", sessions: 5, price: 299, active: true },
  { id: 2, name: "Transform", sessions: 12, price: 599, popular: true, active: true },
  { id: 3, name: "Elite", sessions: 24, price: 999, active: true },
];

const INIT_MEMBERSHIPS = [
  { id: 1, name: "Classic", price: 24.99, period: "/month", active: true },
  { id: 2, name: "Black Card", price: 44.99, period: "/month", active: true },
  { id: 3, name: "Black Card + PT", price: 99.99, period: "/month", active: true },
];

// ── Reusable inline edit row ──────────────────────────────────────────────────

function EditableRow({ item, fields, onSave, onDelete, onToggle }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...item });

  const handleSave = () => { onSave(draft); setEditing(false); };

  return (
    <tr className="border-b last:border-0 hover:bg-muted/20 transition-colors">
      {fields.map((f) => (
        <td key={f.key} className="px-4 py-3 text-sm">
          {editing ? (
            f.type === "number"
              ? <Input type="number" value={draft[f.key]} onChange={e => setDraft({ ...draft, [f.key]: Number(e.target.value) })} className="h-7 w-24 text-sm" />
              : <Input value={draft[f.key]} onChange={e => setDraft({ ...draft, [f.key]: e.target.value })} className="h-7 text-sm" />
          ) : (
            <span className={f.bold ? "font-semibold text-foreground" : "text-muted-foreground"}>{f.prefix}{draft[f.key]}{f.suffix}</span>
          )}
        </td>
      ))}
      <td className="px-4 py-3">
        <Badge className={item.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}>
          {item.active ? "Active" : "Hidden"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-600" onClick={handleSave}><Check className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setDraft({ ...item }); setEditing(false); }}>✕</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(true)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onToggle(item.id)}>
                {item.active ? <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> : <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => onDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function SectionTable({ title, icon: Icon, items, setItems, fields, addLabel, newItemTemplate }) {
  const handleSave = (updated) => setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  const handleDelete = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const handleToggle = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
  const handleAdd = () => setItems(prev => [...prev, { ...newItemTemplate, id: Date.now() }]);

  return (
    <Card className="border border-border">
      <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Icon className="w-4 h-4" /> {title}
        </CardTitle>
        <Button size="sm" className="h-8 font-semibold" onClick={handleAdd}>
          <Plus className="w-3.5 h-3.5 mr-1" /> {addLabel}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {fields.map(f => (
                  <th key={f.key} className="text-left px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">{f.label}</th>
                ))}
                <th className="text-left px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <EditableRow key={item.id} item={item} fields={fields} onSave={handleSave} onDelete={handleDelete} onToggle={handleToggle} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminMarketplace() {
  const [supplements, setSupplements] = useState(INIT_SUPPLEMENTS);
  const [programs, setPrograms] = useState(INIT_PROGRAMS);
  const [ptPackages, setPtPackages] = useState(INIT_PT);
  const [memberships, setMemberships] = useState(INIT_MEMBERSHIPS);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <ShoppingBag className="w-7 h-7" /> Manage Store
        </h1>
        <p className="text-muted-foreground mt-1">Edit supplements, programs, personal training packages, and memberships.</p>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">Note:</span> Medical products (GLP-1, TRT, HRT, Peptides, Lab Services) are managed exclusively by Apex MD and cannot be edited here.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="supplements" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="supplements" className="font-bold data-[state=active]:bg-background">
            <Pill className="w-4 h-4 mr-1.5" /> Supplements
          </TabsTrigger>
          <TabsTrigger value="programs" className="font-bold data-[state=active]:bg-background">
            <Dumbbell className="w-4 h-4 mr-1.5" /> Programs
          </TabsTrigger>
          <TabsTrigger value="pt" className="font-bold data-[state=active]:bg-background">
            <UserCheck className="w-4 h-4 mr-1.5" /> Personal Training
          </TabsTrigger>
          <TabsTrigger value="memberships" className="font-bold data-[state=active]:bg-background">
            <CreditCard className="w-4 h-4 mr-1.5" /> Memberships
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supplements">
          <SectionTable
            title="Supplements"
            icon={Pill}
            items={supplements}
            setItems={setSupplements}
            fields={[
              { key: "name", label: "Product Name", bold: true },
              { key: "category", label: "Category" },
              { key: "price", label: "Price", type: "number", prefix: "$" },
              { key: "stock", label: "Stock" },
            ]}
            addLabel="Add Supplement"
            newItemTemplate={{ name: "New Supplement", price: 0, stock: "In Stock", category: "Other", active: true }}
          />
        </TabsContent>

        <TabsContent value="programs">
          <SectionTable
            title="Training Programs"
            icon={Dumbbell}
            items={programs}
            setItems={setPrograms}
            fields={[
              { key: "name", label: "Program Name", bold: true },
              { key: "duration", label: "Duration" },
              { key: "level", label: "Level" },
              { key: "price", label: "Price", type: "number", prefix: "$" },
            ]}
            addLabel="Add Program"
            newItemTemplate={{ name: "New Program", price: 0, duration: "8 Weeks", level: "Beginner", active: true }}
          />
        </TabsContent>

        <TabsContent value="pt">
          <SectionTable
            title="Personal Training Packages"
            icon={UserCheck}
            items={ptPackages}
            setItems={setPtPackages}
            fields={[
              { key: "name", label: "Package Name", bold: true },
              { key: "sessions", label: "Sessions", type: "number", suffix: " sessions" },
              { key: "price", label: "Price", type: "number", prefix: "$" },
            ]}
            addLabel="Add Package"
            newItemTemplate={{ name: "New Package", sessions: 10, price: 499, active: true }}
          />
        </TabsContent>

        <TabsContent value="memberships">
          <SectionTable
            title="Membership Tiers"
            icon={CreditCard}
            items={memberships}
            setItems={setMemberships}
            fields={[
              { key: "name", label: "Tier Name", bold: true },
              { key: "price", label: "Price", type: "number", prefix: "$" },
              { key: "period", label: "Period" },
            ]}
            addLabel="Add Tier"
            newItemTemplate={{ name: "New Tier", price: 0, period: "/month", active: true }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}