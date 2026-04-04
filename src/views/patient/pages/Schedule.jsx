import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Stethoscope,
  Salad,
  Calendar,
  Clock,
  CheckCircle2,
  User,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

// ─── Mock Providers ───────────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: "p1",
    name: "Dr. Marcus Reynolds",
    title: "Medical Director, Internal Medicine",
    specialty: "Hormone Optimization · Peptide Therapy · Longevity Medicine",
    rating: 4.9,
    reviews: 142,
    avatar: "MR",
    avatarBg: "#1e40af",
    modalities: ["In-Person", "Telehealth"],
    bio: "Dr. Reynolds specializes in functional and regenerative medicine with 15+ years in hormone optimization, GLP-1 therapy, and evidence-based longevity protocols.",
    nextAvailable: "Today",
    type: "provider",
  },
  {
    id: "p2",
    name: "Dr. Aisha Patel",
    title: "Physician, Sports Medicine",
    specialty: "TRT · Performance Medicine · Recovery",
    rating: 4.8,
    reviews: 98,
    avatar: "AP",
    avatarBg: "#7c3aed",
    modalities: ["In-Person", "Telehealth"],
    bio: "Dr. Patel bridges elite athletic performance with medical wellness, focusing on testosterone replacement, injury recovery, and peak performance optimization.",
    nextAvailable: "Tomorrow",
    type: "provider",
  },
];

const DIETITIANS = [
  {
    id: "d1",
    name: "Samantha Ortiz, RD",
    title: "Registered Dietitian, Sports Nutrition",
    specialty: "Macro Planning · Body Recomposition · GLP-1 Nutrition Support",
    rating: 5.0,
    reviews: 87,
    avatar: "SO",
    avatarBg: "#059669",
    modalities: ["Telehealth", "In-Person"],
    bio: "Samantha crafts individualized nutrition plans for clients on medical wellness programs, specializing in GLP-1 diet support, metabolic health, and sustainable fat loss.",
    nextAvailable: "Today",
    type: "dietitian",
  },
  {
    id: "d2",
    name: "Jordan Kimball, MS, RD",
    title: "Clinical Dietitian, Metabolic Health",
    specialty: "Diabetes Prevention · Gut Health · Anti-Inflammatory Diets",
    rating: 4.9,
    reviews: 63,
    avatar: "JK",
    avatarBg: "#d97706",
    modalities: ["Telehealth"],
    bio: "Jordan focuses on the intersection of nutrition science and metabolic disease prevention, working alongside physicians to optimize patient outcomes through evidence-based dietary strategies.",
    nextAvailable: "Thu, Apr 6",
    type: "dietitian",
  },
];

// ─── Mock time slots ──────────────────────────────────────────────────────────

const generateSlots = (offset = 0) => {
  const slots = ["9:00 AM", "9:30 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:30 PM", "3:00 PM", "4:00 PM"];
  return slots.filter((_, i) => (i + offset) % 3 !== 0);
};

const UPCOMING = [
  {
    id: "u1",
    provider: "Dr. Marcus Reynolds",
    type: "provider",
    date: "Tue, Apr 7, 2026",
    time: "10:00 AM",
    modality: "Telehealth",
    reason: "Follow-up: Testosterone Labs Review",
  },
  {
    id: "u2",
    provider: "Samantha Ortiz, RD",
    type: "dietitian",
    date: "Thu, Apr 10, 2026",
    time: "2:00 PM",
    modality: "Telehealth",
    reason: "Monthly Nutrition Check-in",
  },
];

// ─── Helper components ────────────────────────────────────────────────────────

function ProviderCard({ provider, onBook }) {
  const isProvider = provider.type === "provider";
  const accentColor = isProvider ? "blue" : "emerald";

  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: provider.avatarBg }}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: provider.avatarBg }}
          >
            {provider.avatar}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-bold text-foreground text-base">{provider.name}</h3>
                <p className="text-sm text-muted-foreground">{provider.title}</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500 text-sm font-semibold flex-shrink-0">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                {provider.rating}
                <span className="text-muted-foreground font-normal text-xs">({provider.reviews})</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-1 italic">{provider.specialty}</p>
            <p className="text-sm text-foreground mt-2 leading-relaxed">{provider.bio}</p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {provider.modalities.map((m) => (
                <Badge key={m} variant="secondary" className="text-xs flex items-center gap-1">
                  {m === "Telehealth" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  {m}
                </Badge>
              ))}
              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> Next: {provider.nextAvailable}
              </span>
            </div>

            <Button
              className="mt-4 w-full sm:w-auto"
              style={{ backgroundColor: provider.avatarBg, color: "#fff" }}
              onClick={() => onBook(provider)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingModal({ provider, onClose }) {
  const days = [
    { label: "Today", sub: "Apr 3" },
    { label: "Tue", sub: "Apr 7" },
    { label: "Wed", sub: "Apr 8" },
    { label: "Thu", sub: "Apr 9" },
    { label: "Fri", sub: "Apr 10" },
  ];

  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [modality, setModality] = useState(provider.modalities[0]);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const slots = generateSlots(selectedDay);

  const handleConfirm = () => {
    if (!selectedTime) return;
    setConfirmed(true);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: provider.avatarBg }}
            >
              {provider.avatar}
            </div>
            Book with {provider.name}
          </DialogTitle>
          <DialogDescription>{provider.title}</DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold text-foreground">Appointment Confirmed!</h3>
            <p className="text-muted-foreground text-sm">
              Your <strong>{modality}</strong> appointment with <strong>{provider.name}</strong> is scheduled for{" "}
              <strong>{days[selectedDay].label}, {days[selectedDay].sub}</strong> at <strong>{selectedTime}</strong>.
            </p>
            <p className="text-xs text-muted-foreground">A confirmation email and calendar invite will be sent shortly.</p>
            <Button onClick={onClose} className="mt-2">Done</Button>
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Modality */}
            {provider.modalities.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Visit Type</p>
                <div className="flex gap-2">
                  {provider.modalities.map((m) => (
                    <button
                      key={m}
                      onClick={() => setModality(m)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        modality === m
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {m === "Telehealth" ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Day picker */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Select Date</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedDay(i); setSelectedTime(null); }}
                    className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      selectedDay === i
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className="text-base font-bold">{d.label}</span>
                    <span className="opacity-70">{d.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Available Times</p>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedTime === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Reason for Visit <span className="font-normal text-muted-foreground">(optional)</span></p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Lab review, follow-up on medication, initial consultation..."
                className="w-full border border-border rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <Button
              className="w-full"
              disabled={!selectedTime}
              onClick={handleConfirm}
              style={{ backgroundColor: provider.avatarBg, color: "#fff" }}
            >
              Confirm Appointment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Schedule() {
  const [bookingProvider, setBookingProvider] = useState(null);
  const [activeTab, setActiveTab] = useState("provider");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Schedule Appointment</h1>
        <p className="text-muted-foreground">Book time with your care team — medical providers and registered dietitians</p>
      </div>

      {/* Upcoming appointments */}
      {UPCOMING.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Upcoming Appointments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {UPCOMING.map((appt) => {
              const isProvider = appt.type === "provider";
              return (
                <div
                  key={appt.id}
                  className={`rounded-xl border p-4 flex items-start gap-3 ${
                    isProvider ? "bg-blue-50 border-blue-100" : "bg-emerald-50 border-emerald-100"
                  }`}
                >
                  <div className={`mt-0.5 p-2 rounded-lg ${isProvider ? "bg-blue-100" : "bg-emerald-100"}`}>
                    {isProvider
                      ? <Stethoscope className="w-5 h-5 text-blue-700" />
                      : <Salad className="w-5 h-5 text-emerald-700" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <p className="font-bold text-foreground text-sm">{appt.provider}</p>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Video className="w-3 h-3" /> {appt.modality}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{appt.reason}</p>
                    <p className="text-xs font-semibold mt-1.5 flex items-center gap-1 text-foreground">
                      <Clock className="w-3 h-3" /> {appt.date} · {appt.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-tab layout */}
      <div className="space-y-6">
        {/* Tab selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab("provider")}
            className={`w-full text-left py-4 px-5 rounded-xl border-2 transition-all flex items-start gap-4 ${
              activeTab === "provider"
                ? "border-blue-500 bg-blue-50"
                : "border-border hover:border-blue-200 bg-white"
            }`}
          >
            <div className="p-2.5 bg-blue-100 rounded-lg flex-shrink-0">
              <Stethoscope className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Medical Provider</p>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">Visit with a licensed physician for wellness exams, lab reviews, prescriptions & treatment plans</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("dietitian")}
            className={`w-full text-left py-4 px-5 rounded-xl border-2 transition-all flex items-start gap-4 ${
              activeTab === "dietitian"
                ? "border-emerald-500 bg-emerald-50"
                : "border-border hover:border-emerald-200 bg-white"
            }`}
          >
            <div className="p-2.5 bg-emerald-100 rounded-lg flex-shrink-0">
              <Salad className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Registered Dietitian</p>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">Work with a certified RD on your nutrition plan, macros, meal timing & dietary goals</p>
            </div>
          </button>
        </div>

        {/* Provider list */}
        {activeTab === "provider" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-sm font-semibold text-blue-700">Medical Providers — Apex MD Care Team</p>
            </div>
            {PROVIDERS.map((p) => (
              <ProviderCard key={p.id} provider={p} onBook={setBookingProvider} />
            ))}
          </div>
        )}

        {/* Dietitian list */}
        {activeTab === "dietitian" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700">Registered Dietitians — Nutrition Team</p>
            </div>
            {DIETITIANS.map((d) => (
              <ProviderCard key={d.id} provider={d} onBook={setBookingProvider} />
            ))}
          </div>
        )}
      </div>

      {/* Booking modal */}
      {bookingProvider && (
        <BookingModal provider={bookingProvider} onClose={() => setBookingProvider(null)} />
      )}
    </div>
  );
}