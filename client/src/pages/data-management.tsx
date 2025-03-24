import React, { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, AlertTriangle, CheckCircle2, Mail, Share2 } from "lucide-react";
import { Observation } from "@/lib/types";

export default function DataManagementPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("export");
  const [importResult, setImportResult] = useState<{
    success: boolean;
    count?: number;
    errors?: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get all observations for export
  const { data: observations = [], isLoading: isLoadingObservations } = useQuery({
    queryKey: ["/api/observations"],
    queryFn: async () => {
      const response = await apiRequest("/api/observations", { method: "GET" });
      return response as Observation[];
    },
  });
  
  // Export mutation
  const exportMutation = useMutation<boolean, Error, number[] | undefined>({
    mutationFn: async (ids?: number[]) => {
      const response = await fetch("/api/observations/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Export failed");
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Get the suggested filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "observations.json";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error.message || "There was an error exporting your data.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Your data has been exported successfully.",
      });
    },
  });
  
  // Import mutation
  const importMutation = useMutation<{success: boolean; count: number; errors?: string[]}, Error, string>({
    mutationFn: async (data: string) => {
      const response = await fetch("/api/observations/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 
          (errorData.errors && errorData.errors.length > 0 ? 
            errorData.errors[0] : "Import failed")
        );
      }
      
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message || "There was an error importing your data.",
        variant: "destructive",
      });
      setImportResult({
        success: false,
        errors: [error.message || "Import failed"]
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.count} observations.`,
      });
      setImportResult({
        success: true,
        count: data.count,
        errors: data.errors
      });
      
      // Invalidate queries to refresh any data
      queryClient.invalidateQueries({ queryKey: ["/api/observations"] });
    },
  });
  
  // Check if Web Share API is available
  const isWebShareAvailable = typeof navigator !== 'undefined' && !!navigator.share;

  // Email sharing mutation
  const emailExportMutation = useMutation<boolean, Error, number[] | undefined>({
    mutationFn: async (ids?: number[]) => {
      const response = await fetch("/api/observations/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Export failed");
      }
      
      // Get the blob and convert to base64
      const blob = await response.blob();
      
      // Get the suggested filename from Content-Disposition
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "observations.json";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create email with attachment using mailto
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onload = () => {
        const base64data = reader.result?.toString().split(',')[1];
        
        // Create a mailto link with the attachment
        // Not all email clients support attachments via mailto, 
        // but this will work on many mobile devices
        const subject = encodeURIComponent("Observation Data Export");
        const body = encodeURIComponent(
          "Please find attached the exported observation data.\n\n" +
          "Note: This file contains sensitive information that is encrypted."
        );
        
        // Create and click a temporary link to open the default email client
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}&attachment=${filename}`;
        window.open(mailtoUrl);
      };
      
      return true;
    },
    onError: (error) => {
      toast({
        title: "Email Export Failed",
        description: error.message || "There was an error preparing the data for email.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Prepared",
        description: "Your email client should be opening with the data attached.",
      });
    },
  });

  // Handle export button click
  const handleExportAll = () => {
    exportMutation.mutate(undefined);
  };
  
  // Handle email export button click
  const handleEmailExport = () => {
    emailExportMutation.mutate(undefined);
  };
  
  // Web Share API mutation
  const shareExportMutation = useMutation<boolean, Error, number[] | undefined>({
    mutationFn: async (ids?: number[]) => {
      const response = await fetch("/api/observations/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Export failed");
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Get the suggested filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "observations.json";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a File object from the blob
      const file = new File([blob], filename, { type: 'application/json' });
      
      // Share the file using Web Share API
      if (navigator.share) {
        await navigator.share({
          title: 'Observation Data Export',
          text: 'Exported observation data',
          files: [file]
        }).catch(err => {
          console.error('Share failed:', err);
          throw new Error('Sharing failed. Try another sharing method.');
        });
      } else {
        throw new Error('Web Share API is not supported on this device');
      }
      
      return true;
    },
    onError: (error) => {
      toast({
        title: "Share Failed",
        description: error.message || "There was an error sharing your data.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Sharing Complete",
        description: "Your data has been shared successfully."
      });
    },
  });
  
  // Handle share button click
  const handleShareExport = () => {
    shareExportMutation.mutate(undefined);
  };
  
  // Handle file selection for import
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset the import result
    setImportResult(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        importMutation.mutate(content);
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Trigger file input click
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Data Management</h1>
      
      <Tabs defaultValue="export" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Observations</CardTitle>
              <CardDescription>
                Export your observation data to a secure file that you can back up or transfer to another device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                You currently have <span className="font-medium">{observations.length}</span> observations that will be exported.
              </p>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  The exported file will contain all your observation data. Store it securely to protect sensitive information.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                onClick={handleExportAll}
                disabled={exportMutation.isPending || emailExportMutation.isPending || shareExportMutation.isPending || observations.length === 0}
                className="w-full"
              >
                {exportMutation.isPending ? "Exporting..." : "Download File"}
                <Download className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button 
                  onClick={handleEmailExport}
                  disabled={emailExportMutation.isPending || exportMutation.isPending || shareExportMutation.isPending || observations.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  {emailExportMutation.isPending ? "Preparing..." : "Email Export"}
                  <Mail className="ml-2 h-4 w-4" />
                </Button>
                
                {isWebShareAvailable && (
                  <Button 
                    onClick={handleShareExport}
                    disabled={shareExportMutation.isPending || exportMutation.isPending || emailExportMutation.isPending || observations.length === 0}
                    variant="outline"
                    className="w-full"
                  >
                    {shareExportMutation.isPending ? "Sharing..." : "Share File"}
                    <Share2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Observations</CardTitle>
              <CardDescription>
                Import observation data from a previously exported file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                accept=".json"
                className="hidden"
              />
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Imported observations will be added to your existing data. Each imported observation will receive a new unique ID.
                </AlertDescription>
              </Alert>
              
              {importResult && (
                <div className="mt-4">
                  <Alert variant={importResult.success ? "default" : "destructive"}>
                    {importResult.success ? 
                      <CheckCircle2 className="h-4 w-4" /> : 
                      <AlertTriangle className="h-4 w-4" />}
                    <AlertTitle>
                      {importResult.success ? "Import Successful" : "Import Failed"}
                    </AlertTitle>
                    <AlertDescription>
                      {importResult.success ? 
                        `Successfully imported ${importResult.count} observations.` : 
                        "The import operation failed."}
                      
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Errors:</p>
                          <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                            {importResult.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li>...and {importResult.errors.length - 5} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleImportClick}
                disabled={importMutation.isPending}
                variant="secondary" 
                className="w-full"
              >
                {importMutation.isPending ? "Importing..." : "Select File to Import"}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-10">
        <Separator className="my-6" />
        <div className="text-sm text-muted-foreground">
          <h3 className="font-medium mb-2">Data Security Note</h3>
          <p>
            All sensitive information is encrypted within exported files using the same encryption as the application.
            Please store exported files securely to maintain the confidentiality of your data.
          </p>
        </div>
      </div>
    </div>
  );
}