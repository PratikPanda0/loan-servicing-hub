// Loan data types matching the Cenlar backend API

export interface Loan {
  loan_id: string;
  borrower_name: string;
  county: string;
  loan_amount: number;
  original_balance: number;
  current_principal: number;
  interest_rate_apr: number;
  servicing_status: 'Active' | 'Delinquent' | 'Paid Off' | 'In Review';
  next_due_date: string;
  principal_and_interest: number;
  tax_amount: number;
  maturity_date: string;
  property_address: string;
  city?: string;
  state?: string;
  loan_type?: string;
  escrow_balance?: number;
  last_payment_date?: string;
}

export interface OCRResult {
  borrower_name: string;
  current_principal: number | null;
  interest_rate_apr: number | null;
  warning: string | null;
}

export interface LyzrAssetResponse {
  asset_id: string;
}

export interface LyzrAgentResponse {
  response: string;
  parsed_data?: OCRResult;
}

export interface ComparisonField {
  field: 'current_principal' | 'interest_rate_apr';
  label: string;
  dbValue: number;
  ocrValue: number;
  approved: boolean;
}

export interface UpdateHistoryEntry {
  id: string;
  timestamp: string;
  session_id: string;
  fields_updated: string[];
  status: 'Updated' | 'No Change' | 'Error';
  old_values?: Record<string, number>;
  new_values?: Record<string, number>;
}

export interface LoanWithHistory extends Loan {
  update_history?: UpdateHistoryEntry[];
  upload_count?: number;
  update_count?: number;
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'comparing' | 'complete' | 'error';
