'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Fingerprint } from "lucide-react";
import { Attendance } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LiveAttendanceFeedProps {
    attendance: (Attendance & { userName: string; userAvatarUrl?: string })[];
}

export function LiveAttendanceFeed({ attendance }: LiveAttendanceFeedProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Fingerprint className="w-5 h-5 text-primary animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-900 animate-ping"></div>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Live Activity</h3>
                </div>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 animate-pulse text-[10px] font-bold">
                    REAL-TIME
                </Badge>
            </div>

            <div className="relative flex flex-col gap-4">
                {attendance.length === 0 ? (
                    <div className="py-12 text-center rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-400 italic">Waiting for activity...</p>
                    </div>
                ) : (
                    attendance.map((log, index) => (
                        <div
                            key={log.id}
                            className={cn(
                                "group relative flex items-center gap-4 p-4 rounded-3xl transition-all duration-300",
                                "bg-white dark:bg-slate-900/50 border border-slate-50 dark:border-slate-800",
                                "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                                index === 0 && "ring-2 ring-primary/20 shadow-lg shadow-primary/10"
                            )}
                        >
                            <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-md">
                                    <AvatarImage src={log.userAvatarUrl} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-bold">
                                        {log.userName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center",
                                    log.checkOutTime ? "bg-amber-500" : "bg-emerald-500"
                                )}>
                                    <Clock className="w-3 h-3 text-white" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-extrabold text-navy-deep dark:text-white truncate group-hover:text-primary transition-colors italic">
                                        {log.userName}
                                    </p>
                                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        {log.date}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant={log.checkOutTime ? "secondary" : "default"}
                                        className={cn(
                                            "rounded-full px-2 py-0 text-[9px] font-black uppercase tracking-tighter",
                                            !log.checkOutTime ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200"
                                        )}
                                    >
                                        {log.checkOutTime ? "Clock Out" : "Clock In"}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span>
                                            {log.checkOutTime
                                                ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {index === 0 && (
                                <div className="absolute -right-1 -top-1">
                                    <span className="flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
