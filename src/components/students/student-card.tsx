"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, UserCog } from "lucide-react";
import React from "react";

export interface StudentCardData {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  status?: string;
}

interface StudentCardProps {
  student: StudentCardData;
  subtitle?: string;
  hideManageStudentButton?: boolean;
  children?: React.ReactNode;
}

export function StudentCard({ student, subtitle, hideManageStudentButton, children }: StudentCardProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: "Aktywny", className: "bg-green-100 text-green-800" },
      PENDING: {
        label: "Oczekujący",
        className: "bg-yellow-100 text-yellow-800",
      },
      INACTIVE: { label: "Nieaktywny", className: "bg-gray-100 text-gray-800" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </span>
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg sm:text-xl truncate" title={`${student.firstName} ${student.lastName}`}>
                  {student.firstName} {student.lastName}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  {subtitle && (
                    <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{subtitle}</p>
                  )}
                  {student.username && (
                    <p className="text-sm text-gray-600 truncate max-w-[150px]" title={`@${student.username}`}>@{student.username}</p>
                  )}
                  {student.status && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 hidden sm:inline">•</span>
                      {getStatusBadge(student.status)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {!hideManageStudentButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/teacher/students/${student.id}/edit`)}
                className="shrink-0 flex-1 sm:flex-none gap-2"
              >
                <UserCog className="h-4 w-4 shrink-0" />
                <span className="truncate">Zarządzaj uczniem</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/teacher/students/${student.id}`)}
              className="shrink-0 flex-1 sm:flex-none gap-2"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="truncate">Zarządzaj widocznością</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
