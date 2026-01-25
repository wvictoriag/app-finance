import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-slate-200 dark:bg-white/10 rounded-md ${className}`}
            aria-hidden="true"
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl space-y-3">
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
    );
}

export function ListItemSkeleton() {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-white/5">
            <div className="flex items-center gap-3">
                <Skeleton className="h-1.5 w-1.5 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <Skeleton className="h-5 w-20" />
        </div>
    );
}

export function AccountsPanelSkeleton() {
    return (
        <div className="space-y-2 p-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

export function TransactionsPanelSkeleton() {
    return (
        <div className="space-y-1 px-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <ListItemSkeleton key={i} />
            ))}
        </div>
    );
}
