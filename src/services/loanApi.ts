// Loan API service - proxied through Supabase Edge Function to avoid CORS

import { Loan, LoanWithHistory } from '@/types/loan';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getProxyUrl = (path: string) => 
  `${SUPABASE_URL}/functions/v1/cenlar-proxy?path=${encodeURIComponent(path)}`;

export const loanApi = {
  // Get all loans
  async getAllLoans(): Promise<Loan[]> {
    const response = await fetch(getProxyUrl('/loans'), {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to fetch loans: ${error.error || response.status}`);
    }
    
    return response.json();
  },

  // Get individual loan by borrower name
  async getLoanByBorrower(borrowerName: string): Promise<LoanWithHistory> {
    const response = await fetch(getProxyUrl(`/loans/${borrowerName}`), {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to fetch loan: ${error.error || response.status}`);
    }
    
    return response.json();
  },

  // Patch loan (partial update)
  async updateLoan(
    borrowerName: string, 
    updates: Partial<Pick<Loan, 'current_principal' | 'interest_rate_apr'>>
  ): Promise<Loan> {
    const response = await fetch(getProxyUrl(`/loans/${borrowerName}`), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to update loan: ${error.error || response.status}`);
    }
    
    return response.json();
  },
};

export default loanApi;
