import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Biomarker } from "@/entities/Biomarker";
import { GenomicData } from "@/entities/GenomicData";
import { PerformanceMetric } from "@/entities/PerformanceMetric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Activity, 
  Heart, 
  Dna, 
  Wind,
  FileText,
  Shield,
  MessageSquare,
  AlertCircle,
  Calendar,
  Download,
  Upload,
  Plus,
  Pill,
} from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import PatientSupportChat from "../components/health/PatientSupportChat";
import MyTreatments from "../components/health/MyTreatments";

export default function Health() {
  const [currentUser, setCurrentUser] = useState(null);
  const [biomarkers, setBiomarkers] = useState([]);
  const [genomicData, setGenomicData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [selectedBiomarker, setSelectedBiomarker] = useState(null);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const [biomarkerData, genomics, metrics] = await Promise.all([
        Biomarker.filter({ user_id: user.email }, '-test_date', 50),
        GenomicData.filter({ user_id: user.email }, '-test_date', 10),
        PerformanceMetric.filter({ user_id: user.email }, '-test_date', 50)
      ]);

      setBiomarkers(biomarkerData);
      setGenomicData(genomics);
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error("Error loading health data:", error);
    }
    setIsLoading(false);
  };

  const getLatestBiomarker = () => {
    return biomarkers.length > 0 ? biomarkers[0] : null;
  };

  const getLatestGenomic = () => {
    return genomicData.length > 0 ? genomicData[0] : null;
  };

  const getLatestVO2Max = () => {
    const vo2Tests = performanceMetrics.filter(m => m.metric_type === 'vo2max' && m.vo2max);
    return vo2Tests.length > 0 ? vo2Tests[0] : null;
  };

  const getBiomarkerTrend = (markerName) => {
    const data = biomarkers
      .filter(b => b.markers && b.markers[markerName])
      .map(b => ({
        date: format(new Date(b.test_date), 'MMM yyyy'),
        value: b.markers[markerName]
      }))
      .reverse();
    return data;
  };

  const getBiomarkerStatus = (value, optimal) => {
    if (!value || !optimal) return 'unknown';
    const diff = Math.abs(value - optimal.target) / optimal.target;
    if (diff < 0.1) return 'optimal';
    if (diff < 0.2) return 'good';
    if (diff < 0.3) return 'moderate';
    return 'needs-attention';
  };

  const statusColors = {
    optimal: 'bg-green-100 text-green-800 border-green-300',
    good: 'bg-blue-100 text-blue-800 border-blue-300',
    moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'needs-attention': 'bg-red-100 text-red-800 border-red-300',
    unknown: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const biomarkerOptimalRanges = {
    testosterone_total: { target: 700, unit: 'ng/dL', name: 'Testosterone (Total)' },
    vitamin_d: { target: 50, unit: 'ng/mL', name: 'Vitamin D' },
    hemoglobin_a1c: { target: 5.0, unit: '%', name: 'Hemoglobin A1C' },
    glucose_fasting: { target: 85, unit: 'mg/dL', name: 'Fasting Glucose' },
    cholesterol_total: { target: 180, unit: 'mg/dL', name: 'Total Cholesterol' },
    ldl: { target: 100, unit: 'mg/dL', name: 'LDL' },
    hdl: { target: 60, unit: 'mg/dL', name: 'HDL' },
    tsh: { target: 2.0, unit: 'mIU/L', name: 'TSH' }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const latestBiomarker = getLatestBiomarker();
  const latestGenomic = getLatestGenomic();
  const latestVO2 = getLatestVO2Max();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 pb-6 border-b-2 border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  HEALTH DASHBOARD
                </h1>
                <p className="text-muted-foreground font-semibold">
                  Your comprehensive health data • HIPAA Protected
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowSupportChat(true)}
            className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            PATIENT SUPPORT
          </Button>
        </div>
      </div>

      {/* HIPAA Notice */}
      <Card className="mb-6 border-2 border-primary/40 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground text-sm">HIPAA Protected Health Information</p>
              <p className="text-xs text-muted-foreground font-medium">
                All health data on this platform is encrypted and HIPAA compliant. Your information is secure and only accessible to you and your authorized healthcare providers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-5 bg-muted p-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold"
          >
            <Activity className="w-4 h-4 mr-2" />
            OVERVIEW
          </TabsTrigger>
          <TabsTrigger
            value="biomarkers"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold"
          >
            <Heart className="w-4 h-4 mr-2" />
            BIOMARKERS
          </TabsTrigger>
          <TabsTrigger
            value="genomics"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold"
          >
            <Dna className="w-4 h-4 mr-2" />
            GENOMICS
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold"
          >
            <Wind className="w-4 h-4 mr-2" />
            PERFORMANCE
          </TabsTrigger>
          <TabsTrigger
            value="treatments"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold"
          >
            <Pill className="w-4 h-4 mr-2" />
            MY TREATMENTS
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Latest Biomarkers Card */}
            <Card className="border-2 border-border hover:border-primary transition-all cursor-pointer" onClick={() => setSelectedBiomarker(latestBiomarker)}>
              <CardHeader className="border-b-2 border-border bg-muted">
                <CardTitle className="flex items-center justify-between">
                  <span className="font-bold text-foreground uppercase text-sm">Latest Blood Work</span>
                  <Heart className="w-5 h-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {latestBiomarker ? (
                  <>
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-3">
                      {format(new Date(latestBiomarker.test_date), 'MMM d, yyyy')}
                    </p>
                    <div className="space-y-2">
                      {Object.entries(latestBiomarker.markers || {}).slice(0, 4).map(([key, value]) => {
                        const optimal = biomarkerOptimalRanges[key];
                        if (!optimal) return null;
                        const status = getBiomarkerStatus(value, optimal);
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">{optimal.name}</span>
                            <Badge className={`${statusColors[status]} border-2 font-bold text-xs`}>
                              {value} {optimal.unit}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    <Button variant="outline" className="w-full mt-4 border-2 border-border font-bold">
                      VIEW FULL REPORT
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-semibold">No biomarker data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* VO2 Max Card */}
            <Card className="border-2 border-border hover:border-foreground transition-all">
              <CardHeader className="border-b-2 border-border bg-muted">
                <CardTitle className="flex items-center justify-between">
                  <span className="font-bold text-foreground uppercase text-sm">VO2 Max</span>
                  <Wind className="w-5 h-5 text-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {latestVO2 ? (
                  <>
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-3">
                      {format(new Date(latestVO2.test_date), 'MMM d, yyyy')}
                    </p>
                    <div className="text-center mb-4">
                      <p className="text-4xl font-bold text-foreground mb-1">{latestVO2.vo2max}</p>
                      <p className="text-sm text-muted-foreground font-semibold">ml/kg/min</p>
                    </div>
                    <div className="h-3 bg-muted rounded-sm overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min((latestVO2.vo2max / 60) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground font-semibold mt-2">
                      {latestVO2.vo2max > 50 ? 'Elite' : latestVO2.vo2max > 40 ? 'Excellent' : latestVO2.vo2max > 30 ? 'Good' : 'Developing'}
                    </p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Wind className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-semibold">No VO2 Max data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Genomics Card */}
            <Card className="border-2 border-border hover:border-primary transition-all">
              <CardHeader className="border-b-2 border-border bg-muted">
                <CardTitle className="flex items-center justify-between">
                  <span className="font-bold text-foreground uppercase text-sm">Genomic Profile</span>
                  <Dna className="w-5 h-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {latestGenomic ? (
                  <>
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-3">
                      {format(new Date(latestGenomic.test_date), 'MMM d, yyyy')}
                    </p>
                    <div className="space-y-3">
                      {latestGenomic.genetic_markers?.apoe_genotype && (
                        <div className="p-3 bg-muted rounded-sm">
                          <p className="text-xs font-bold text-muted-foreground uppercase">APOE</p>
                          <p className="text-sm font-bold text-foreground">{latestGenomic.genetic_markers.apoe_genotype}</p>
                        </div>
                      )}
                      {latestGenomic.health_risks && latestGenomic.health_risks.length > 0 && (
                        <div className="p-3 bg-muted rounded-sm">
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Risk Factors</p>
                          {latestGenomic.health_risks.slice(0, 2).map((risk, idx) => (
                            <div key={idx} className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground font-medium">{risk.condition}</span>
                              <Badge className={`${
                                risk.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                                risk.risk_level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              } text-xs font-bold`}>
                                {risk.risk_level}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" className="w-full mt-4 border-2 border-border font-bold">
                      VIEW FULL REPORT
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Dna className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-semibold">No genomic data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-2 border-border">
            <CardHeader className="border-b-2 border-border bg-muted">
              <CardTitle className="font-bold text-foreground uppercase">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold">
                  <Upload className="w-4 h-4 mr-2" />
                  UPLOAD LAB RESULTS
                </Button>
                <Button variant="outline" className="border-2 border-border font-bold">
                  <Calendar className="w-4 h-4 mr-2" />
                  SCHEDULE APPOINTMENT
                </Button>
                <Button variant="outline" className="border-2 border-border font-bold">
                  <Download className="w-4 h-4 mr-2" />
                  DOWNLOAD ALL DATA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Biomarkers Tab */}
        <TabsContent value="biomarkers" className="space-y-6">
          <Card className="border-2 border-border">
            <CardHeader className="border-b-2 border-border bg-muted">
              <CardTitle className="font-bold text-foreground uppercase">Blood Biomarker History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {biomarkers.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">No Biomarker Data</h3>
                  <p className="text-muted-foreground mb-4">Upload your lab results to start tracking your health metrics</p>
                  <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold">
                    <Upload className="w-4 h-4 mr-2" />
                    UPLOAD LAB RESULTS
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {biomarkers.map((biomarker) => (
                    <Card key={biomarker.id} className="border-2 border-border hover:border-primary transition-all cursor-pointer" onClick={() => setSelectedBiomarker(biomarker)}>
                      <CardHeader className="bg-muted border-b border-border">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-bold text-foreground">
                              {biomarker.test_type || 'Comprehensive Panel'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground font-semibold mt-1">
                              {format(new Date(biomarker.test_date), 'MMMM d, yyyy')} • {biomarker.test_provider}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="border-2 border-border font-bold">
                            VIEW DETAILS
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(biomarker.markers || {}).map(([key, value]) => {
                            const optimal = biomarkerOptimalRanges[key];
                            if (!optimal) return null;
                            const status = getBiomarkerStatus(value, optimal);
                            return (
                              <div key={key} className="p-3 bg-muted rounded-sm">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{optimal.name}</p>
                                <p className="text-lg font-bold text-foreground">{value}</p>
                                <p className="text-xs text-muted-foreground font-semibold">{optimal.unit}</p>
                                <Badge className={`${statusColors[status]} border text-xs font-bold mt-2`}>
                                  {status.replace('-', ' ')}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Genomics Tab */}
        <TabsContent value="genomics" className="space-y-6">
          <Card className="border-2 border-border">
            <CardHeader className="border-b-2 border-border bg-muted">
              <CardTitle className="font-bold text-foreground uppercase">Genomic Data</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {genomicData.length === 0 ? (
                <div className="text-center py-12">
                  <Dna className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">No Genomic Data</h3>
                  <p className="text-muted-foreground mb-4">Upload your genetic test results to unlock personalized insights</p>
                  <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold">
                    <Upload className="w-4 h-4 mr-2" />
                    UPLOAD GENOMIC DATA
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {genomicData.map((data) => (
                    <div key={data.id}>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{data.test_provider}</h3>
                          <p className="text-sm text-muted-foreground font-semibold">
                            {format(new Date(data.test_date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        {data.report_url && (
                          <Button variant="outline" className="border-2 border-border font-bold">
                            <Download className="w-4 h-4 mr-2" />
                            DOWNLOAD REPORT
                          </Button>
                        )}
                      </div>

                      {data.genetic_markers && (
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          {data.genetic_markers.apoe_genotype && (
                            <Card className="border-2 border-border">
                              <CardContent className="p-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">APOE Genotype</p>
                                <p className="text-2xl font-bold text-foreground">{data.genetic_markers.apoe_genotype}</p>
                              </CardContent>
                            </Card>
                          )}
                          {data.genetic_markers.mthfr_status && (
                            <Card className="border-2 border-border">
                              <CardContent className="p-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">MTHFR Status</p>
                                <p className="text-2xl font-bold text-foreground">{data.genetic_markers.mthfr_status}</p>
                              </CardContent>
                            </Card>
                          )}
                          {data.genetic_markers.comt_status && (
                            <Card className="border-2 border-border">
                              <CardContent className="p-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">COMT Status</p>
                                <p className="text-2xl font-bold text-foreground">{data.genetic_markers.comt_status}</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {data.health_risks && data.health_risks.length > 0 && (
                        <Card className="border-2 border-border">
                           <CardHeader className="border-b-2 border-border bg-muted">
                             <CardTitle className="text-sm font-bold text-foreground uppercase">Health Risk Factors</CardTitle>
                           </CardHeader>
                           <CardContent className="p-4">
                             <div className="space-y-3">
                               {data.health_risks.map((risk, idx) => (
                                 <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-sm">
                                   <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                    risk.risk_level === 'high' ? 'text-red-500' :
                                    risk.risk_level === 'moderate' ? 'text-yellow-500' :
                                    'text-green-500'
                                  }`} />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="font-bold text-foreground">{risk.condition}</h4>
                                      <Badge className={`${
                                        risk.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                                        risk.risk_level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      } font-bold`}>
                                        {risk.risk_level} RISK
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">{risk.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="border-2 border-border">
            <CardHeader className="border-b-2 border-border bg-muted">
              <CardTitle className="font-bold text-foreground uppercase">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {performanceMetrics.length === 0 ? (
                <div className="text-center py-12">
                  <Wind className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">No Performance Data</h3>
                  <p className="text-muted-foreground mb-4">Start logging your performance metrics to track improvements</p>
                  <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    ADD PERFORMANCE TEST
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {/* VO2 Max Chart */}
                  {performanceMetrics.filter(m => m.vo2max).length > 0 && (
                    <Card className="border-2 border-border">
                       <CardHeader className="bg-muted">
                         <CardTitle className="text-sm font-bold text-foreground uppercase">VO2 Max Progression</CardTitle>
                       </CardHeader>
                       <CardContent className="p-6">
                         <ResponsiveContainer width="100%" height={300}>
                           <LineChart data={performanceMetrics.filter(m => m.vo2max).reverse()}>
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis dataKey={(d) => format(new Date(d.test_date), 'MMM yy')} />
                             <YAxis />
                             <Tooltip />
                             <Legend />
                             <Line type="monotone" dataKey="vo2max" stroke="hsl(var(--primary))" strokeWidth={3} name="VO2 Max" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* All Metrics Table */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {performanceMetrics.slice(0, 6).map((metric) => (
                       <Card key={metric.id} className="border-2 border-border">
                         <CardContent className="p-4">
                           <div className="flex justify-between items-start mb-3">
                             <p className="text-xs font-bold text-muted-foreground uppercase">{metric.metric_type.replace('_', ' ')}</p>
                             <p className="text-xs text-muted-foreground font-semibold">
                               {format(new Date(metric.test_date), 'MMM d, yyyy')}
                             </p>
                           </div>
                           <div className="space-y-2">
                             {metric.vo2max && (
                               <div className="flex justify-between">
                                 <span className="text-sm font-medium text-muted-foreground">VO2 Max</span>
                                 <span className="font-bold text-foreground">{metric.vo2max} ml/kg/min</span>
                               </div>
                             )}
                             {metric.resting_heart_rate && (
                               <div className="flex justify-between">
                                 <span className="text-sm font-medium text-muted-foreground">RHR</span>
                                 <span className="font-bold text-foreground">{metric.resting_heart_rate} bpm</span>
                               </div>
                             )}
                             {metric.hrv_score && (
                               <div className="flex justify-between">
                                 <span className="text-sm font-medium text-muted-foreground">HRV</span>
                                 <span className="font-bold text-foreground">{metric.hrv_score}</span>
                               </div>
                             )}
                             {metric.body_fat_percentage && (
                               <div className="flex justify-between">
                                 <span className="text-sm font-medium text-muted-foreground">Body Fat</span>
                                 <span className="font-bold text-foreground">{metric.body_fat_percentage}%</span>
                               </div>
                             )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Treatments Tab */}
        <TabsContent value="treatments" className="space-y-6">
          <MyTreatments />
        </TabsContent>
      </Tabs>

      {/* Patient Support Chat Dialog */}
      <Dialog open={showSupportChat} onOpenChange={setShowSupportChat}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              PATIENT SUPPORT
            </DialogTitle>
          </DialogHeader>
          <PatientSupportChat userId={currentUser?.email} onClose={() => setShowSupportChat(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}