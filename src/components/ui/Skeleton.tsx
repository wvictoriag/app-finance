import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
            aria-hidden="true"
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
            <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );
}

export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-4 p-3 font-medium">
            <Skeleton className="w-1 h-6 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16" />
        </div>
    );
}
