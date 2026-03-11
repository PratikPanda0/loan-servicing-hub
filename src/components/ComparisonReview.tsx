import { useState } from "react";
import { ArrowRight, Check, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonField, Loan, OCRResult } from "@/types/loan";
import { cn } from "@/lib/utils";

interface ComparisonReviewProps {
  loan: Loan;
  ocrResult: OCRResult;
  onApply: (approvedFields: ComparisonField[]) => void;
  onCancel: () => void;
  isUpdating: boolean;
}

export function ComparisonReview({
  loan,
  ocrResult,
  onApply,
  onCancel,
  isUpdating,
}: ComparisonReviewProps) {
  // Check if OCR result is corrupted
  if (ocrResult.warning) {
    return (
      <Card className="card-elevated border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Document Processing Error
          </CardTitle>
          <CardDescription>
            The uploaded document could not be processed correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-destructive-light border border-destructive/20">
            <p className="text-destructive font-medium">
              ❌ {ocrResult.warning}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Please upload a valid, complete document to continue.
          </p>
          <div className="flex justify-end">
            <Button onClick={onCancel}>
              Upload New Document
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build comparison fields
  const buildComparisonFields = (): ComparisonField[] => {
    const fields: ComparisonField[] = [];

    if (ocrResult.current_principal !== null) {
      fields.push({
        field: 'current_principal',
        label: 'Current Principal',
        dbValue: loan.current_principal,
        ocrValue: ocrResult.current_principal,
        approved: false, // User must manually approve
      });
    }

    if (ocrResult.interest_rate_apr !== null) {
      fields.push({
        field: 'interest_rate_apr',
        label: 'Interest Rate (APR)',
        dbValue: loan.interest_rate_apr,
        ocrValue: ocrResult.interest_rate_apr,
        approved: false, // User must manually approve
      });
    }

    return fields;
  };

  const [fields, setFields] = useState<ComparisonField[]>(buildComparisonFields);

  // Check if any changes are needed
  const hasChanges = fields.some(f => f.dbValue !== f.ocrValue);
  const approvedChanges = fields.filter(f => f.approved && f.dbValue !== f.ocrValue);

  const toggleApproval = (fieldName: string) => {
    setFields(prev =>
      prev.map(f =>
        f.field === fieldName ? { ...f, approved: !f.approved } : f
      )
    );
  };

  const formatValue = (field: ComparisonField, value: number) => {
    if (field.field === 'current_principal') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value);
    }
    return `${value.toFixed(2)}%`;
  };

  if (!hasChanges) {
    return (
      <Card className="card-elevated border-success/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            No Changes Required
          </CardTitle>
          <CardDescription>
            Loan data is already up to date with the document.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-success-light border border-success/20">
            <p className="text-success font-medium">
              ✅ All values match. No updates needed.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onCancel} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          Review Changes
        </CardTitle>
        <CardDescription>
          The following differences were found between the document and database.
          Review and approve the changes you want to apply.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Borrower info */}
        <div className="p-3 rounded-lg bg-secondary">
          <p className="text-sm text-muted-foreground">Borrower</p>
          <p className="font-semibold">{loan.borrower_name}</p>
        </div>

        {/* Comparison fields */}
        <div className="space-y-4">
          {fields.map((field) => {
            const hasChange = field.dbValue !== field.ocrValue;
            
            if (!hasChange) {
              return (
                <div
                  key={field.field}
                  className="p-4 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">
                      {field.label}
                    </span>
                    <div className="flex items-center gap-2 text-success">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Match</span>
                    </div>
                  </div>
                  <p className="mt-1 font-mono">
                    {formatValue(field, field.dbValue)}
                  </p>
                </div>
              );
            }

            return (
              <div
                key={field.field}
                className={cn(
                  "p-4 rounded-lg border-2 transition-smooth cursor-pointer",
                  field.approved
                    ? "bg-warning-light/50 border-warning"
                    : "bg-secondary/50 border-border hover:border-muted-foreground"
                )}
                onClick={() => toggleApproval(field.field)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{field.label}</span>
                  <Button
                    variant={field.approved ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      field.approved && "bg-warning text-warning-foreground hover:bg-warning/90"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleApproval(field.field);
                    }}
                  >
                    {field.approved ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Approved
                      </>
                    ) : (
                      "Approve"
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Database value */}
                  <div className="flex-1 p-3 rounded-lg bg-card border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Database Value</p>
                    <p className="font-mono font-semibold">
                      {formatValue(field, field.dbValue)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="h-5 w-5 text-accent flex-shrink-0" />

                  {/* OCR value */}
                  <div
                    className={cn(
                      "flex-1 p-3 rounded-lg border-2",
                      field.approved
                        ? "bg-warning-light border-warning"
                        : "bg-card border-border"
                    )}
                  >
                    <p className="text-xs text-muted-foreground mb-1">OCR Value</p>
                    <p className="font-mono font-semibold">
                      {formatValue(field, field.ocrValue)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {approvedChanges.length} of {fields.filter(f => f.dbValue !== f.ocrValue).length} changes approved
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={() => onApply(approvedChanges)}
              disabled={approvedChanges.length === 0 || isUpdating}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isUpdating ? (
                "Updating..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply {approvedChanges.length} Change{approvedChanges.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
