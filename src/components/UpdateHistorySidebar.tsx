import { useState, useEffect } from "react";
import { 
  Clock, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  AlertCircle,
  Download,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UpdateHistoryEntry } from "@/types/loan";
import { cn } from "@/lib/utils";

interface UpdateHistorySidebarProps {
  history: UpdateHistoryEntry[];
  uploadCount: number;
  updateCount: number;
  totalChanges: number;
  recentUpdate?: {
    sessionId: string | null;
    timestamp: string;
    fieldsUpdated: string[];
    oldValues: Record<string, number>;
    newValues: Record<string, number>;
  };
}

type TabType = 'history' | 'comments';

export function UpdateHistorySidebar({ 
  history, 
  uploadCount, 
  updateCount,
  totalChanges,
  recentUpdate 
}: UpdateHistorySidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  
  // Auto-expand the recent update session
  useEffect(() => {
    if (recentUpdate?.sessionId) {
      setExpandedSessions(new Set([recentUpdate.sessionId]));
    }
  }, [recentUpdate]);

  // Combine recent update with history
  const combinedHistory: UpdateHistoryEntry[] = recentUpdate ? [
    {
      id: recentUpdate.sessionId || 'recent',
      session_id: recentUpdate.sessionId || 'recent-session',
      timestamp: recentUpdate.timestamp,
      fields_updated: recentUpdate.fieldsUpdated,
      status: 'Updated' as const,
      old_values: recentUpdate.oldValues,
      new_values: recentUpdate.newValues,
    },
    ...history
  ] : history;

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }) + ' IST';
  };

  const formatValue = (field: string, value: number) => {
    if (field === 'current_principal' || field.includes('amount') || field.includes('balance')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value);
    }
    if (field === 'interest_rate_apr' || field.includes('rate')) {
      return `${value.toFixed(2)}%`;
    }
    return value.toString();
  };

  const formatFieldName = (field: string) => {
    const fieldLabels: Record<string, string> = {
      'current_principal': 'Current Principal',
      'interest_rate_apr': 'Interest Rate APR',
      'tax_amount': 'Tax Amount',
    };
    return fieldLabels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden h-fit sticky top-8">
      {/* Tab header */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-all",
            activeTab === 'history'
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          )}
        >
          Update History
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-all",
            activeTab === 'comments'
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          )}
        >
          Uploaded comments
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-border bg-muted/20">
        <div className="bg-card rounded-lg p-4 text-center border border-border shadow-sm">
          <p className="text-2xl font-bold text-foreground">{uploadCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Updates</p>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border border-border shadow-sm">
          <p className="text-2xl font-bold text-accent">{totalChanges}</p>
          <p className="text-xs text-muted-foreground mt-1">Changes</p>
        </div>
      </div>

      {/* Fields Modified summary */}
      {combinedHistory.length > 0 && (
        <div className="px-4 py-3 border-b border-border bg-muted/10">
          <p className="text-xs text-muted-foreground mb-2">
            Fields Modified ({new Set(combinedHistory.flatMap(h => h.fields_updated)).size}):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(combinedHistory.flatMap(h => h.fields_updated))).map(field => (
              <Badge 
                key={field} 
                variant="outline" 
                className="text-xs bg-card border-border text-foreground"
              >
                {formatFieldName(field)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Session list */}
      <ScrollArea className="max-h-[500px]">
        <div className="p-3 space-y-3">
          {activeTab === 'history' ? (
            combinedHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No update history yet</p>
                <p className="text-xs mt-1">Updates will appear here after document processing</p>
              </div>
            ) : (
              combinedHistory.map((entry, index) => {
                const isExpanded = expandedSessions.has(entry.id);
                const isRecent = index === 0 && recentUpdate;
                
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "rounded-lg border overflow-hidden transition-all",
                      isRecent 
                        ? "border-l-4 border-l-accent border-accent/30 bg-accent/5" 
                        : "border-border"
                    )}
                  >
                    {/* Session header */}
                    <div 
                      className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleSession(entry.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-accent truncate">
                            Session: {entry.session_id.substring(0, 32)}...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                        <Badge 
                          className={cn(
                            "shrink-0 text-xs",
                            entry.status === 'Updated' 
                              ? "bg-warning text-warning-foreground" 
                              : entry.status === 'Error'
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          Case {entry.fields_updated.length}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground">Fields Modified:</span>
                          {entry.fields_updated.map(field => (
                            <Badge 
                              key={field} 
                              variant="outline" 
                              className="text-xs bg-accent/10 border-accent/20 text-accent"
                            >
                              {formatFieldName(field)}
                            </Badge>
                          ))}
                        </div>

                        <button 
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSession(entry.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                          View Changes ({entry.fields_updated.length})
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-border/50 bg-muted/20">
                        <div className="pt-3 space-y-2">
                          {entry.fields_updated.map((field) => (
                            <div
                              key={field}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-success/10 border border-success/20"
                            >
                              <span className="text-sm font-medium text-foreground">
                                {formatFieldName(field)}
                              </span>
                              <div className="flex items-center gap-2 text-sm">
                                {entry.old_values?.[field] !== undefined && (
                                  <>
                                    <span className="text-muted-foreground line-through text-xs">
                                      {formatValue(field, entry.old_values[field])}
                                    </span>
                                    <span className="text-muted-foreground">→</span>
                                  </>
                                )}
                                {entry.new_values?.[field] !== undefined && (
                                  <span className="font-mono font-semibold text-success">
                                    {formatValue(field, entry.new_values[field])}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Document comments will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}