// @ts-nocheck
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Watch, Scale, Smartphone, Zap, ArrowRight } from "lucide-react";

const DEVICE_TYPES = [
  {
    id: "wearables",
    name: "Wearables",
    description: "Connect smartwatches and fitness trackers",
    devices: ["Apple Watch", "Whoop Band", "Oura Ring", "Garmin", "Fitbit"],
    icon: Watch,
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    id: "scales",
    name: "Smart Scales",
    description: "Sync weight and body composition data",
    devices: ["Withings", "SECA", "InBody", "Evolt", "RENPHO", "Hume"],
    icon: Scale,
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
  },
  {
    id: "health-apps",
    name: "Health Apps",
    description: "Import data from fitness and health platforms",
    devices: ["Apple Health", "Google Fit", "MyFitnessPal", "Demotu"],
    icon: Smartphone,
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
  },
];

export default function SyncDevices() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Sync Devices</h1>
        <p className="text-muted-foreground">Connect your wearables, scales, and health apps to automatically track your data.</p>
      </div>

      {/* Info Banner */}
      <Card className="mb-8 border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex gap-3 items-start">
          <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Seamless Integration</p>
            <p className="text-sm text-amber-800">Sync your devices to automatically log workouts, track sleep, monitor body composition, and more.</p>
          </div>
        </CardContent>
      </Card>

      {/* Device Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {DEVICE_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.id} className={`border-2 ${type.color}`}>
              <CardHeader>
                {type.id === "wearables" ? (
                  <img
                    src="https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/6b732cda4_image.png"
                    alt="Supported Wearables"
                    className="w-full h-40 object-contain mb-2 rounded-lg"
                  />
                ) : type.id === "scales" ? (
                  <img
                    src="https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/bac205d9f_Bodycompositionanalyzersandwearableslineup.png"
                    alt="Supported Smart Scales"
                    className="w-full h-40 object-contain mb-2 rounded-lg"
                  />
                ) : (
                  <img
                    src="https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/a2827bec5_image.png"
                    alt="Supported Health Apps"
                    className="w-full h-40 object-contain mb-2 rounded-lg"
                  />
                )}
                <CardTitle className="text-lg">{type.name}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Supported Devices</p>
                  <ul className="space-y-1">
                    {type.devices.map((device) => (
                      <li key={device} className="text-sm text-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        {device}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full font-semibold" variant="outline">
                  Connect <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connected Devices Section */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>You haven't connected any devices yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Start by clicking "Connect" above to link your first device and begin automatic data syncing.</p>
        </CardContent>
      </Card>
    </div>
  );
}