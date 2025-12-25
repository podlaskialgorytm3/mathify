"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Users,
  Search,
  Mail,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  Settings,
} from "lucide-react";

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  status: string;
  createdAt: string;
  enrolledCourses: Array<{
    enrolledAt: string;
    course: {
      id: string;
      title: string;
    };
  }>;
  stats: {
    totalSubmissions: number;
    approvedSubmissions: number;
    pendingSubmissions: number;
    averageScore: number;
  };
}

interface Course {
  id: string;
  title: string;
}

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const { toast } = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const url =
        selectedCourse === "all"
          ? "/api/teacher/students"
          : `/api/teacher/students?courseId=${selectedCourse}`;

      const response = await fetch(url);
      const data = await response.json();

      console.log("API Response:", data);
      console.log("Students count:", data.students?.length);
      console.log("Courses count:", data.courses?.length);

      if (response.ok) {
        setStudents(data.students);
        setCourses(data.courses);
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się pobrać uczniów",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas pobierania uczniów",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedCourse]);

  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Uczniowie</h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj uczniami zapisanymi na Twoje kursy
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Wszyscy uczniowie
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktywni</p>
                <p className="text-2xl font-bold text-green-600">
                  {students.filter((s) => s.status === "ACTIVE").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Łącznie prac
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.reduce(
                    (sum, s) => sum + s.stats.totalSubmissions,
                    0
                  )}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Do sprawdzenia
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {students.reduce(
                    (sum, s) => sum + s.stats.pendingSubmissions,
                    0
                  )}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">
                <Search className="w-4 h-4 inline mr-2" />
                Szukaj ucznia
              </Label>
              <Input
                id="search"
                placeholder="Imię, nazwisko, email lub username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="course-filter">
                <Filter className="w-4 h-4 inline mr-2" />
                Filtruj po kursie
              </Label>
              <select
                id="course-filter"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Wszystkie kursy</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Nie masz jeszcze żadnych kursów
            </p>
            <p className="text-sm text-gray-500">
              Utwórz pierwszy kurs, aby móc zapisywać na niego uczniów
            </p>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchTerm || selectedCourse !== "all"
                ? "Nie znaleziono uczniów spełniających kryteria"
                : "Brak uczniów zapisanych na Twoje kursy"}
            </p>
            {!searchTerm &&
              selectedCourse === "all" &&
              students.length === 0 && (
                <p className="text-sm text-gray-500">
                  Dodaj uczniów do swoich kursów, aby pojawili się tutaj
                </p>
              )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <Card key={student.id}>
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
                          <p className="text-sm text-gray-600">
                            @{student.username}
                          </p>
                          <span className="text-gray-400">•</span>
                          {getStatusBadge(student.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/teacher/students/${student.id}`)
                    }
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Zarządzaj widocznością
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Informacje kontaktowe
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a
                          href={`mailto:${student.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {student.email}
                        </a>
                      </div>
                      <div className="text-sm text-gray-600">
                        Dołączył:{" "}
                        {new Date(student.createdAt).toLocaleDateString(
                          "pl-PL"
                        )}
                      </div>
                    </div>

                    {/* Enrolled Courses */}
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Zapisane kursy ({student.enrolledCourses.length})
                      </h4>
                      <div className="space-y-1">
                        {student.enrolledCourses.map((enrollment) => (
                          <div
                            key={enrollment.course.id}
                            className="text-sm text-gray-600 flex items-center gap-2"
                          >
                            <BookOpen className="w-3 h-3" />
                            {enrollment.course.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Statystyki
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                          <p className="text-xs text-gray-600">
                            Wszystkie prace
                          </p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                          {student.stats.totalSubmissions}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <p className="text-xs text-gray-600">Zaakceptowane</p>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          {student.stats.approvedSubmissions}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <p className="text-xs text-gray-600">Oczekujące</p>
                        </div>
                        <p className="text-xl font-bold text-orange-600">
                          {student.stats.pendingSubmissions}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <p className="text-xs text-gray-600">Średnia ocena</p>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {student.stats.averageScore > 0
                            ? student.stats.averageScore.toFixed(1)
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
