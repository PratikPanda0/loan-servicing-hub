import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ChevronRight, AlertCircle } from "lucide-react";
import { Loan } from "@/types/loan";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface LoanTableProps {
  loans: Loan[];
  actionRequiredCount?: number;
}

export function LoanTable({ loans, actionRequiredCount = 0 }: LoanTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  // Extract unique cities and states from loans
  const { cities, states } = useMemo(() => {
    const citySet = new Set<string>();
    const stateSet = new Set<string>();
    
    loans.forEach(loan => {
      if (loan.city) citySet.add(loan.city);
      if (loan.state) stateSet.add(loan.state);
      
      // Try to extract from property_address if city/state not provided
      if (loan.property_address) {
        const parts = loan.property_address.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const lastPart = parts[parts.length - 1];
          const stateMatch = lastPart.match(/^([A-Z]{2})\s/);
          if (stateMatch) {
            stateSet.add(stateMatch[1]);
          }
          if (parts.length >= 3) {
            citySet.add(parts[parts.length - 2]);
          }
        }
      }
    });
    
    return {
      cities: Array.from(citySet).sort(),
      states: Array.from(stateSet).sort(),
    };
  }, [loans]);

  // Filter loans based on search and filters
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const matchesSearch = 
        searchQuery === "" ||
        loan.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.loan_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCity = 
        cityFilter === "all" || 
        loan.city === cityFilter ||
        loan.property_address?.includes(cityFilter);
      
      const matchesState = 
        stateFilter === "all" || 
        loan.state === stateFilter ||
        loan.property_address?.includes(stateFilter);
      
      return matchesSearch && matchesCity && matchesState;
    });
  }, [loans, searchQuery, cityFilter, stateFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const isActionRequired = (loan: Loan) => {
    return loan.servicing_status === 'In Review' || loan.servicing_status === 'Delinquent';
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Borrower Name or Loan ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[140px] bg-card">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[140px] bg-card">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {actionRequiredCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning-light border border-warning/20">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning">
                Action Required ({actionRequiredCount})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="font-semibold">Loan ID</TableHead>
                <TableHead className="font-semibold">Borrower Name</TableHead>
                <TableHead className="font-semibold">County</TableHead>
                <TableHead className="font-semibold text-right">Loan Amount</TableHead>
                <TableHead className="font-semibold text-right">Current Principal</TableHead>
                <TableHead className="font-semibold text-right">Interest Rate</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Next Due Date</TableHead>
                <TableHead className="font-semibold text-right">P&I</TableHead>
                <TableHead className="font-semibold text-right">Tax Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Search className="h-8 w-8" />
                      <p>No loans found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLoans.map((loan) => (
                  <TableRow
                    key={loan.loan_id}
                    className={cn(
                      "transition-smooth hover:bg-secondary/30",
                      isActionRequired(loan) && "row-action-required"
                    )}
                  >
                    <TableCell className="font-mono text-sm">{loan.loan_id}</TableCell>
                    <TableCell className="font-medium">{loan.borrower_name}</TableCell>
                    <TableCell>{loan.county}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(loan.loan_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(loan.current_principal)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercent(loan.interest_rate_apr)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={loan.servicing_status} />
                    </TableCell>
                    <TableCell>{formatDate(loan.next_due_date)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(loan.principal_and_interest)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(loan.tax_amount)}
                    </TableCell>
                    <TableCell>
                      <Link to={`/loan/${encodeURIComponent(loan.borrower_name)}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLoans.length} of {loans.length} loans
      </div>
    </div>
  );
}
