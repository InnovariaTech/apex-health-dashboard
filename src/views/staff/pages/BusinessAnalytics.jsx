import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Heart, Award, DollarSign, Activity } from "lucide-react";

// Mock data for health improvements
const HEALTH_SCORE_TREND = [
  { month: "Jan", corporateMembers: 62, regularMembers: 58 },
  { month: "Feb", corporateMembers: 65, regularMembers: 60 },
  { month: "Mar", corporateMembers: 70, regularMembers: 64 },
  { month: "Apr", corporateMembers: 75, regularMembers: 67 },
  { month: "May", corporateMembers: 80, regularMembers: 71 },
  { month: "Jun", corporateMembers: 85, regularMembers: 76 },
];

const BIOMARKER_IMPROVEMENTS = [
  { marker: "Weight Loss", corporate: 8.2, members: 5.4 },
  { marker: "Cholesterol ↓", corporate: 24, members: 16 },
  { marker: "Blood Pressure", corporate: 18, members: 12 },
  { marker: "Body Fat %", corporate: 6.5, members: 4.2 },
  { marker: "VO2 Max ↑", corporate: 14, members: 9 },
  { marker: "Resting HR ↓", corporate: 12, members: 8 },
];

const PROGRAM_ADOPTION = [
  { name: "Weight Loss (GLP-1)", value: 35, fill: "#3b82f6" },
  { name: "TRT/HRT", value: 18, fill: "#8b5cf6" },
  { name: "Workout Programs", value: 28, fill: "#10b981" },
  { name: "Nutrition Plans", value: 19, fill: "#f59e0b" },
];

const ROI_DATA = [
  { month: "Jan", absenteeism: 8.2, healthcare: 2400, productivity: 4200 },
  { month: "Feb", absenteeism: 7.8, healthcare: 2100, productivity: 4400 },
  { month: "Mar", absenteeism: 7.1, healthcare: 1950, productivity: 4600 },
  { month: "Apr", absenteeism: 6.5, healthcare: 1800, productivity: 4800 },
  { month: "May", absenteeism: 5.9, healthcare: 1650, productivity: 5000 },
  { month: "Jun", absenteeism: 5.2, healthcare: 1500, productivity: 5200 },
];

const RETENTION_DATA = [
  { month: "Jan", corporateRetention: 94, memberRetention: 78 },
  { month: "Feb", corporateRetention: 95, memberRetention: 79 },
  { month: "Mar", corporateRetention: 96, memberRetention: 81 },
  { month: "Apr", corporateRetention: 97, memberRetention: 83 },
  { month: "May", corporateRetention: 97, memberRetention: 85 },
  { month: "Jun", corporateRetention: 98, memberRetention: 87 },
];

const ENGAGEMENT_METRICS = [
  { week: "Week 1", active: 45, moderate: 32, inactive: 23 },
  { week: "Week 2", active: 52, moderate: 35, inactive: 13 },
  { week: "Week 3", active: 61, moderate: 28, inactive: 11 },
  { week: "Week 4", active: 68, moderate: 24, inactive: 8 },
];

const KPI_CARDS = [
  {
    title: "Avg Health Score Improvement",
    value: "+23 points",
    subtitle: "Corporate: +27 pts | Members: +18 pts",
    icon: Heart,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    title: "Program Engagement Rate",
    value: "76%",
    subtitle: "Corporate programs (avg. across 450+ participants)",
    icon: Activity,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Estimated Healthcare Savings",
    value: "$180K",
    subtitle: "Based on reduced absenteeism & preventive care",
    icon: DollarSign,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Member Retention Rate",
    value: "98%",
    subtitle: "Corporate | 87% Member",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

export default function BusinessAnalytics() {
  const [selectedMetric, setSelectedMetric] = useState(null);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Business Analytics</h1>
        <p className="text-muted-foreground">Comprehensive health and wellness impact metrics across your portfolio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className={`${kpi.bg} border-0`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{kpi.title}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  </div>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="corporate" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="corporate">Corporate Wellness</TabsTrigger>
          <TabsTrigger value="members">Member Wellness</TabsTrigger>
        </TabsList>

        {/* Corporate Wellness */}
        <TabsContent value="corporate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Health Score Trajectory
              </CardTitle>
              <CardDescription>Average health score progression for corporate wellness programs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={HEALTH_SCORE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="corporateMembers"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Corporate Members"
                  />
                  <Line
                    type="monotone"
                    dataKey="regularMembers"
                    stroke="#9ca3af"
                    strokeWidth={2}
                    dot={{ fill: "#9ca3af", r: 4 }}
                    name="Comparison (Regular Members)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ROI Impact: Absenteeism & Productivity</CardTitle>
              <CardDescription>Days missed and productivity gains over 6 months (estimated)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ROI_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="absenteeism"
                    fill="#fecaca"
                    stroke="#dc2626"
                    name="Avg Days Missed"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="productivity"
                    fill="#bbf7d0"
                    stroke="#059669"
                    name="Productivity Index"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biomarker Improvements (6-Month Average)</CardTitle>
              <CardDescription>Percentage improvement across key health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={BIOMARKER_IMPROVEMENTS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="marker" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="corporate" fill="#3b82f6" name="Corporate Avg %" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="members" fill="#d1d5db" name="Comparison Avg %" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Member Retention Rate</CardTitle>
              <CardDescription>Ongoing program participation and renewals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={RETENTION_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[70, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="corporateRetention"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 5 }}
                    name="Corporate Retention %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Member Wellness */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Health Score Growth
              </CardTitle>
              <CardDescription>Individual member health improvements over 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={HEALTH_SCORE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="regularMembers"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Member Health Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Program Adoption Breakdown</CardTitle>
              <CardDescription>Distribution of member participation across wellness products</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={PROGRAM_ADOPTION}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {PROGRAM_ADOPTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {PROGRAM_ADOPTION.map((program) => (
                  <div key={program.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: program.fill }} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{program.name}</p>
                      <p className="text-xs text-muted-foreground">{program.value}% participation</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
              <CardDescription>Member activity levels throughout the month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ENGAGEMENT_METRICS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="active" fill="#10b981" name="Highly Active %" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="moderate" fill="#f59e0b" name="Moderate Activity %" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="inactive" fill="#ef4444" name="Inactive %" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retention & Member Satisfaction</CardTitle>
              <CardDescription>Ongoing engagement and program renewals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={RETENTION_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[70, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="memberRetention"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", r: 5 }}
                    name="Member Retention %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer insights */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-2">Key Takeaways</h3>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">→</span> Corporate wellness programs show 27-point average health score improvement vs. 18 points for regular members
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">→</span> Estimated healthcare cost savings of $180K annually through reduced absenteeism and preventive care
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">→</span> Member retention increased from 78% to 87% over 6 months with structured wellness programs
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">→</span> Weight loss and TRT/HRT programs drive highest engagement (35% and 28% adoption respectively)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}