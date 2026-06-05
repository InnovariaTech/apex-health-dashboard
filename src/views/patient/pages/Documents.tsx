// @ts-nocheck
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Upload } from "lucide-react";
import AiDocumentsTab from "@/views/patient/components/documents/AiDocumentsTab";
import MyUploadsTab from "@/views/patient/components/documents/MyUploadsTab";

/**
 * Documents — two independent surfaces under one page:
 *
 *   AI Documents → care-validate stack (case-linked, AI summaries)
 *                  src/views/patient/components/documents/AiDocumentsTab.tsx
 *   My Uploads   → /api/patient/documents (PDF/JPEG/PNG, 5 categories)
 *                  src/views/patient/components/documents/MyUploadsTab.tsx
 */
export default function Documents() {
  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground min-h-screen">
      <div className="mb-6 pb-5 border-b border-border">
        <div className="apex-eyebrow mb-1.5">Health Records</div>
        <h1 className="apex-page-title">
          My <em>documents</em>
        </h1>
        <p className="text-[13px] text-ink-2 mt-1.5">
          Manage your AI-analyzed health records and your own uploads.
        </p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Documents
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> My Uploads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AiDocumentsTab />
        </TabsContent>

        <TabsContent value="uploads">
          <MyUploadsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
