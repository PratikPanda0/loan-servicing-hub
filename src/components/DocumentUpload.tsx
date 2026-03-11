import { useState, useCallback } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { UploadStatus } from "@/types/loan";

interface DocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (file: File) => void;
  status: UploadStatus;
  progress: number;
  error?: string | null;
}

export function DocumentUpload({
  open,
  onOpenChange,
  onUploadComplete,
  status,
  progress,
  error,
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    if (file.type !== "application/pdf") {
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUploadComplete(selectedFile);
    }
  };

  const handleClose = () => {
    if (status !== 'uploading' && status !== 'processing') {
      setSelectedFile(null);
      onOpenChange(false);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading document to Lyzr...';
      case 'processing':
        return 'Processing document with OCR...';
      case 'comparing':
        return 'Comparing with database...';
      case 'complete':
        return 'Processing complete!';
      case 'error':
        return error || 'An error occurred';
      default:
        return '';
    }
  };

  const isProcessing = status === 'uploading' || status === 'processing' || status === 'comparing';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent" />
            Upload Tax Document
          </DialogTitle>
          <DialogDescription>
            Upload a PDF document to extract loan information using OCR.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop zone */}
          {status === 'idle' && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center transition-smooth",
                dragActive
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50",
                selectedFile && "border-success bg-success-light/30"
              )}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                    <FileText className="h-6 w-6 text-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary mx-auto">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">
                    Drop your PDF here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF files only, max 10MB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <span className="text-sm font-medium">{getStatusMessage()}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progress}% complete
              </p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive-light border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Upload Failed</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success state */}
          {status === 'complete' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-success-light border border-success/20">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-success">Processing Complete</p>
                <p className="text-sm text-success/80 mt-1">
                  Document has been processed successfully.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          {status === 'idle' && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload & Process
            </Button>
          )}
          {status === 'error' && (
            <Button
              onClick={() => {
                setSelectedFile(null);
                onOpenChange(false);
                // Reopen after a brief delay to reset state
                setTimeout(() => onOpenChange(true), 100);
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
