import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  User,
  MapPin,
  DollarSign,
  Percent,
  Calendar,
  FileText,
  CreditCard,
  Building,
  Home,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ComparisonReview } from "@/components/ComparisonReview";
import { UpdateHistorySidebar } from "@/components/UpdateHistorySidebar";
import { LoanDetailsSkeleton } from "@/components/LoadingSkeletons";
import { Button } from "@/components/ui/button";
import { loanApi } from "@/services/loanApi";
import { ComparisonField, OCRResult, UploadStatus, UpdateHistoryEntry } from "@/types/loan";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const LoanDetails = () => {
  const { borrowerName } = useParams<{ borrowerName: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get update info from navigation state
  const locationState = location.state as {
    justUpdated?: boolean;
    updateInfo?: {
      sessionId: string | null;
      timestamp: string;
      fieldsUpdated: string[];
      oldValues: Record<string, number>;
      newValues: Record<string, number>;
    };
  } | null;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string[]>([]);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Handle recently updated fields highlight
  useEffect(() => {
    if (locationState?.justUpdated && locationState.updateInfo) {
      setRecentlyUpdated(locationState.updateInfo.fieldsUpdated);
      setShowSuccessBanner(true);
      
      // Clear the highlight after 8 seconds
      const timer = setTimeout(() => {
        setRecentlyUpdated([]);
        setShowSuccessBanner(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [locationState]);

  const { data: loan, isLoading, error } = useQuery({
    queryKey: ['loan', borrowerName],
    queryFn: () => loanApi.getLoanByBorrower(borrowerName!),
    enabled: !!borrowerName,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<{ current_principal: number; interest_rate_apr: number }>) =>
      loanApi.updateLoan(borrowerName!, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loan', borrowerName] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      
      setRecentlyUpdated(Object.keys(variables));
      setTimeout(() => setRecentlyUpdated([]), 5000);
      
      toast({
        title: "Loan Updated",
        description: "Loan details have been updated successfully.",
      });
      setShowComparison(false);
      setOcrResult(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update loan",
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = async (file: File) => {
    toast({
      title: "Backend Required",
      description: "Connect Lovable Cloud to enable document upload and OCR processing.",
    });
    setUploadOpen(false);
  };

  const handleApplyChanges = (approvedFields: ComparisonField[]) => {
    const updates: Partial<{ current_principal: number; interest_rate_apr: number }> = {};
    
    approvedFields.forEach(field => {
      updates[field.field] = field.ocrValue;
    });
    
    updateMutation.mutate(updates);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Mock update history
  const mockHistory: UpdateHistoryEntry[] = loan?.update_history || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <LoanDetailsSkeleton />
        </main>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="card-elevated p-8 text-center">
            <p className="text-destructive font-medium mb-2">Failed to load loan details</p>
            <p className="text-muted-foreground text-sm mb-4">
              {error instanceof Error ? error.message : 'Loan not found'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Helper component for detail rows
  const DetailRow = ({ label, value, highlighted, mono }: { 
    label: string; 
    value: string | number; 
    highlighted?: boolean;
    mono?: boolean;
  }) => (
    <div className={cn(
      "flex justify-between items-center py-2",
      highlighted && "bg-success/20 -mx-4 px-4 rounded-lg"
    )}>
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={cn(
        "text-sm font-medium text-foreground",
        mono && "font-mono",
        highlighted && "text-success font-semibold"
      )}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Success banner */}
        {showSuccessBanner && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              <div>
                <p className="font-medium text-success">Update Successful!</p>
                <p className="text-sm text-success/80">
                  {locationState?.updateInfo?.fieldsUpdated.length} field(s) have been updated from the document.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Loan details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page title */}
            <h1 className="text-2xl font-bold text-foreground">Comprehensive Loan Details</h1>

            {/* Comparison review (if active) */}
            {showComparison && ocrResult && (
              <div className="animate-fade-in">
                <ComparisonReview
                  loan={loan}
                  ocrResult={ocrResult}
                  onApply={handleApplyChanges}
                  onCancel={() => {
                    setShowComparison(false);
                    setOcrResult(null);
                  }}
                  isUpdating={updateMutation.isPending}
                />
              </div>
            )}

            {/* Borrower & Property Information */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-accent mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Borrower & Property Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
                <DetailRow label="Loan ID" value={loan.loan_id} mono />
                <DetailRow label="Borrower Name" value={loan.borrower_name} />
                <DetailRow label="County" value={loan.county} />
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">Property Address</span>
                </div>
                <p className="font-medium mt-1">{loan.property_address}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2 mt-4">
                <DetailRow label="City" value={loan.city || 'N/A'} />
                <DetailRow label="State" value={loan.state || 'N/A'} />
                <DetailRow label="Zip Code" value="N/A" />
              </div>
            </div>

            {/* Loan Type & Status */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-accent mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Loan Type & Status
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground text-sm">Loan Type</span>
                  <span className="font-medium text-sm">{loan.loan_type || 'Conventional Fixed'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground text-sm">Servicing Status</span>
                  <StatusBadge status={loan.servicing_status} />
                </div>
                <DetailRow label="Escrow Flag" value="Y" />
              </div>
            </div>

            {/* Financial Details */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-accent mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
                <DetailRow label="Original Balance" value={formatCurrency(loan.original_balance)} mono />
                <div className={cn(
                  "flex justify-between items-center py-2 transition-all duration-500",
                  recentlyUpdated.includes('current_principal') && "bg-success/20 -mx-4 px-4 rounded-lg"
                )}>
                  <span className="text-muted-foreground text-sm">Current Principal</span>
                  <span className={cn(
                    "font-mono text-sm font-semibold",
                    recentlyUpdated.includes('current_principal') ? "text-success" : "text-foreground"
                  )}>
                    {formatCurrency(loan.current_principal)}
                  </span>
                </div>
                <DetailRow label="Loan Amount" value={formatCurrency(loan.loan_amount)} mono />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2 mt-2">
                <DetailRow label="Tax Amount" value={formatCurrency(loan.tax_amount)} mono />
              </div>
            </div>

            {/* Interest Details */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-accent mb-4 flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Interest Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <div className={cn(
                  "flex justify-between items-center py-2 transition-all duration-500",
                  recentlyUpdated.includes('interest_rate_apr') && "bg-success/20 -mx-4 px-4 rounded-lg"
                )}>
                  <span className="text-muted-foreground text-sm">Interest Rate (APR)</span>
                  <span className={cn(
                    "font-mono text-sm font-semibold",
                    recentlyUpdated.includes('interest_rate_apr') ? "text-success" : "text-foreground"
                  )}>
                    {formatPercent(loan.interest_rate_apr)}
                  </span>
                </div>
                <DetailRow label="Interest Type" value="Fixed" />
              </div>
            </div>

            {/* Term & Payment Details */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-accent mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Term & Payment Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
                <DetailRow label="Loan Term (Months)" value="360" />
                <DetailRow label="Monthly P&I" value={formatCurrency(loan.principal_and_interest)} mono />
                <DetailRow label="PMI Monthly" value="$0" mono />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2 mt-2">
                <DetailRow label="HOA Monthly" value="$70" mono />
                <DetailRow label="Payment Due Day" value="1" />
              </div>
            </div>

            {/* Important Dates */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-accent mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Important Dates
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
                <DetailRow label="First Payment Date" value="Jun 1, 2024" />
                <DetailRow label="Maturity Date" value={formatDate(loan.maturity_date)} />
                <DetailRow label="Last Paid Installment" value={loan.last_payment_date ? formatDate(loan.last_payment_date) : 'N/A'} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2 mt-2">
                <DetailRow label="Next Due Date" value={formatDate(loan.next_due_date)} />
              </div>
            </div>
          </div>

          {/* Right column - Update History Sidebar */}
          <div className="lg:col-span-1">
            <UpdateHistorySidebar
              history={mockHistory}
              uploadCount={loan.upload_count || (locationState?.justUpdated ? 1 : 0)}
              updateCount={loan.update_count || (locationState?.updateInfo?.fieldsUpdated.length || 0)}
              totalChanges={mockHistory.reduce((acc, h) => acc + h.fields_updated.length, 0) + 
                (locationState?.updateInfo?.fieldsUpdated.length || 0)}
              recentUpdate={locationState?.updateInfo}
            />
          </div>
        </div>
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
    </div>
  );
};

export default LoanDetails;