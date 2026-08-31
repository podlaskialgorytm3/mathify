"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Mail,
  User,
  GraduationCap,
  Eye,
} from "lucide-react";

interface StudentCourse {
  enrolledAt: string;
  viewsCount?: number;
  course: {
    id: string;
    title: string;
    description: string | null;
  };
}

interface StudentDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  status: string;
  createdAt: string;
  enrolledCourses: StudentCourse[];
}

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentDetails();
  }, [params.studentId]);

  const fetchStudentDetails = async () => {
    try {
      const response = await fetch(`/api/teacher/students/${params.studentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch student");
      }

      setStudent(data);
    } catch (error) {
      console.error("Error fetching student:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać danych ucznia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Nie znaleziono ucznia</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          className="flex-shrink-0"
          onClick={() => router.push("/dashboard/teacher/students")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl break-words">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-gray-500">Zarządzaj widocznością kursów</p>
        </div>
      </div>

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informacje o uczniu
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-wrap items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Email:</span>
            <span className="text-sm font-medium break-all">
              {student.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Username:</span>
            <span className="text-sm font-medium">{student.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Status:</span>
            <span
              className={`text-sm font-medium ${
                student.status === "ACTIVE" ? "text-green-600" : "text-gray-600"
              }`}
            >
              {student.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Dołączył:</span>
            <span className="text-sm font-medium">
              {new Date(student.createdAt).toLocaleDateString("pl-PL")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Kursy ucznia ({student.enrolledCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.enrolledCourses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Uczeń nie jest zapisany na żaden kurs
            </p>
          ) : (
            <div className="space-y-3">
              {student.enrolledCourses.map((enrollment) => (
                <Card
                  key={enrollment.course.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    router.push(
                      `/dashboard/teacher/students/${params.studentId}/courses/${enrollment.course.id}`
                    )
                  }
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-12 w-12 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold break-words">
                          {enrollment.course.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <p className="text-sm text-gray-500">
                            Zapisany:{" "}
                            {new Date(enrollment.enrolledAt).toLocaleDateString(
                              "pl-PL"
                            )}
                          </p>
                          {enrollment.viewsCount !== undefined && (
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-1" title="Liczba wyświetlonych materiałów">
                              <Eye className="w-4 h-4 text-gray-400" />
                              {enrollment.viewsCount}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto flex-shrink-0"
                    >
                      Zarządzaj widocznością
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
