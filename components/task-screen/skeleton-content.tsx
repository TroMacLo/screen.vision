export const SkeletonContent = ({ compact = false }: { compact?: boolean }) => (
  <div className={`animate-pulse space-y-3 h-[74px]`}>
    <div className="h-4 bg-foreground/10 rounded w-3/4" />
    <div className="h-4 bg-foreground/10 rounded w-2/4" />

    <div className="mt-4 h-6 bg-foreground/10 rounded w-20" />
  </div>
);
