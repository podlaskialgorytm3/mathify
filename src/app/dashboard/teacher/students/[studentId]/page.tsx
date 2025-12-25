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
} from "lucide-react";

interface StudentCourse {
  enrolledAt: string;
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
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Nie znaleziono ucznia</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/teacher/students")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
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
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Email:</span>
            <span className="text-sm font-medium">{student.email}</span>
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
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Zapisany:{" "}
                          {new Date(enrollment.enrolledAt).toLocaleDateString(
                            "pl-PL"
                          )}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
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
