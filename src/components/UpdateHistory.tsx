import { useState } from "react";
import { Clock, FileText, ChevronDown, ChevronUp, Check, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { UpdateHistoryEntry } from "@/types/loan";
import { cn } from "@/lib/utils";

interface UpdateHistoryProps {
  history: UpdateHistoryEntry[];
  uploadCount: number;
  updateCount: number;
}

export function UpdateHistory({ history, uploadCount, updateCount }: UpdateHistoryProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

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
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Update History
          </div>
          <div className="flex items-center gap-4 text-sm font-normal">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{uploadCount} uploads</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-4 w-4" />
              <span>{updateCount} updates</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No update history yet</p>
            <p className="text-sm">Updates will appear here after document processing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => {
              const isExpanded = expandedSessions.has(entry.id);
              
              return (
                <div
                  key={entry.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  {/* Session header */}
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto hover:bg-secondary/50"
                    onClick={() => toggleSession(entry.id)}
                  >
                    <div className="flex items-center gap-4">
                      <StatusBadge status={entry.status} />
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {entry.fields_updated.length > 0
                            ? `${entry.fields_updated.length} field${entry.fields_updated.length > 1 ? 's' : ''} updated`
                            : 'No changes made'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border bg-secondary/30">
                      <div className="pt-4 space-y-3">
                        <p className="text-xs text-muted-foreground font-mono">
                          Session: {entry.session_id}
                        </p>
                        
                        {entry.fields_updated.length > 0 ? (
                          <div className="space-y-2">
                            {entry.fields_updated.map((field) => (
                              <div
                                key={field}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg",
                                  entry.status === 'Updated'
                                    ? "bg-success-light border border-success/20"
                                    : "bg-secondary"
                                )}
                              >
                                <span className="font-medium text-sm">
                                  {formatFieldName(field)}
                                </span>
                                <div className="flex items-center gap-2 text-sm">
                                  {entry.old_values?.[field] !== undefined && (
                                    <>
                                      <span className="text-muted-foreground line-through">
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
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Minus className="h-4 w-4" />
                            <span>Document matched existing data - no updates required</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
