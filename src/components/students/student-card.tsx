"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
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
  children?: React.ReactNode;
}

export function StudentCard({ student, subtitle, children }: StudentCardProps) {
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
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </span>
              </div>
              <div>
                <CardTitle className="text-xl">
                  {student.firstName} {student.lastName}
                </CardTitle>
                <div className="flex items-center gap-3 mt-1">
                  {subtitle && (
                    <p className="text-sm font-medium text-gray-800">{subtitle}</p>
                  )}
                  {student.username && (
                    <p className="text-sm text-gray-600">@{student.username}</p>
                  )}
                  {student.status && (
                    <>
                      <span className="text-gray-400">•</span>
                      {getStatusBadge(student.status)}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/teacher/students/${student.id}`)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Zarządzaj widocznością
          </Button>
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
