import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { Header } from "@/components/Header";
import { LoanTable } from "@/components/LoanTable";
import { LoanTableSkeleton } from "@/components/LoadingSkeletons";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ComparisonReview } from "@/components/ComparisonReview";
import { Button } from "@/components/ui/button";
import { loanApi } from "@/services/loanApi";
import { lyzrEdgeApi } from "@/services/lyzrEdgeApi";
import { UploadStatus, OCRResult, Loan, UpdateHistoryEntry } from "@/types/loan";
import { useToast } from "@/hooks/use-toast";

const LoanDashboard = () => {
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [matchedLoan, setMatchedLoan] = useState<Loan | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: loans, isLoading, error, refetch } = useQuery({
    queryKey: ['loans'],
    queryFn: loanApi.getAllLoans,
  });

  const handleUploadComplete = async (file: File) => {
    try {
      setUploadStatus('uploading');
      setUploadProgress(20);
      setUploadError(null);

      // Step 1: Upload to Lyzr
      const uploadResult = await lyzrEdgeApi.uploadDocument(file);
      setUploadProgress(50);

      if (!uploadResult.asset_id) {
        throw new Error('No asset ID returned from upload');
      }

      // Step 2: Invoke OCR agent
      setUploadStatus('processing');
      const newSessionId = lyzrEdgeApi.generateSessionId();
      setSessionId(newSessionId);
      const ocrData = await lyzrEdgeApi.invokeOCRAgent(uploadResult.asset_id, newSessionId);
      setUploadProgress(80);

      // Check for corrupted document
      if (ocrData.warning) {
        setUploadError(ocrData.warning);
        setUploadStatus('error');
        toast({
          title: "Document Issue",
          description: ocrData.warning,
          variant: "destructive",
        });
        return;
      }

      // Step 3: Match with database
      const matched = loans?.find(
        loan => loan.borrower_name.toLowerCase() === ocrData.borrower_name.toLowerCase()
      );

      if (!matched) {
        setUploadError(`Borrower "${ocrData.borrower_name}" not found in database`);
        setUploadStatus('error');
        toast({
          title: "Borrower Not Found",
          description: `Could not find borrower "${ocrData.borrower_name}" in the database.`,
          variant: "destructive",
        });
        return;
      }

      setUploadProgress(100);
      setUploadStatus('complete');
      setOcrResult(ocrData);
      setMatchedLoan(matched);
      setUploadOpen(false);
      setShowComparison(true);

      toast({
        title: "Document Processed",
        description: `Successfully extracted data for ${ocrData.borrower_name}`,
      });

    } catch (err) {
      console.error('Upload/OCR error:', err);
      const message = err instanceof Error ? err.message : 'Failed to process document';
      setUploadError(message);
      setUploadStatus('error');
      toast({
        title: "Processing Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleComparisonComplete = async (updatedFields: string[], oldValues: Record<string, number>, newValues: Record<string, number>) => {
    // Navigate to loan details page with update info
    navigate(`/loan/${encodeURIComponent(matchedLoan!.borrower_name)}`, {
      state: {
        justUpdated: true,
        updateInfo: {
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          fieldsUpdated: updatedFields,
          oldValues,
          newValues,
        }
      }
    });
    
    setShowComparison(false);
    setOcrResult(null);
    setMatchedLoan(null);
    setSessionId(null);
    await refetch();
  };

  const actionRequiredCount = loans?.filter(
    loan => loan.servicing_status === 'In Review' || loan.servicing_status === 'Delinquent'
  ).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loan Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              View and manage loan servicing records
            </p>
          </div>
          
          <Button
            onClick={() => setUploadOpen(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/90 hover-lift"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoanTableSkeleton />
        ) : error ? (
          <div className="card-elevated p-8 text-center">
            <p className="text-destructive font-medium mb-2">Failed to load loans</p>
            <p className="text-muted-foreground text-sm mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : loans ? (
          <LoanTable loans={loans} actionRequiredCount={actionRequiredCount} />
        ) : null}
      </main>

      {/* Upload modal */}
      <DocumentUpload
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) {
            setUploadStatus('idle');
            setUploadProgress(0);
            setUploadError(null);
          }
        }}
        onUploadComplete={handleUploadComplete}
        status={uploadStatus}
        progress={uploadProgress}
        error={uploadError}
      />

      {/* Comparison modal */}
      {showComparison && ocrResult && matchedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <ComparisonReview
              ocrResult={ocrResult}
              loan={matchedLoan}
              onApply={async (approvedFields) => {
                if (approvedFields.length === 0) return;
                
                setIsUpdating(true);
                try {
                  const updates: Partial<Pick<Loan, 'current_principal' | 'interest_rate_apr'>> = {};
                  const oldValues: Record<string, number> = {};
                  const newValues: Record<string, number> = {};
                  const fieldNames: string[] = [];
                  
                  approvedFields.forEach(field => {
                    if (field.field === 'current_principal') {
                      updates.current_principal = field.ocrValue;
                      oldValues.current_principal = field.dbValue;
                      newValues.current_principal = field.ocrValue;
                      fieldNames.push('current_principal');
                    } else if (field.field === 'interest_rate_apr') {
                      updates.interest_rate_apr = field.ocrValue;
                      oldValues.interest_rate_apr = field.dbValue;
                      newValues.interest_rate_apr = field.ocrValue;
                      fieldNames.push('interest_rate_apr');
                    }
                  });
                  
                  await loanApi.updateLoan(matchedLoan.borrower_name, updates);
                  
                  toast({
                    title: "Loan Updated",
                    description: `Successfully updated ${approvedFields.length} field(s) for ${matchedLoan.borrower_name}`,
                  });
                  
                  handleComparisonComplete(fieldNames, oldValues, newValues);
                } catch (err) {
                  console.error('Update error:', err);
                  toast({
                    title: "Update Failed",
                    description: err instanceof Error ? err.message : 'Failed to update loan',
                    variant: "destructive",
                  });
                } finally {
                  setIsUpdating(false);
                }
              }}
              onCancel={() => {
                setShowComparison(false);
                setOcrResult(null);
                setMatchedLoan(null);
              }}
              isUpdating={isUpdating}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDashboard;
