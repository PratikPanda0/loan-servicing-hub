import { Skeleton } from "@/components/ui/skeleton";

export function LoanTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="card-elevated overflow-hidden">
        {/* Table header */}
        <div className="bg-secondary/50 p-4 border-b border-border">
          <div className="flex gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="p-4 border-b border-border last:border-0"
          >
            <div className="flex gap-4 items-center">
              {Array.from({ length: 8 }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={`h-5 flex-1 ${colIndex === 0 ? 'max-w-[100px]' : ''}`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoanDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-elevated p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
