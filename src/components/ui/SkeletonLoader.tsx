import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-slate-200 dark:bg-white/10 rounded-md ${className}`} />
    );
}

export function AccountsPanelSkeleton() {
    return (
        <div className="space-y-4 p-4">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl space-y-3">
                    <div className="flex justify-between">
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                </div>
            ))}
        </div>
    );
}

export function TransactionsPanelSkeleton() {
    return (
        <div className="space-y-4 p-4">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
            </div>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-1.5 w-1.5 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-5 w-20" />
                </div>
            ))}
        </div>
    );
}
