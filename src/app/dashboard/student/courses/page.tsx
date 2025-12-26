"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  GraduationCap,
  Clock,
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  order: number;
  _count: {
    subchapters: number;
  };
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  enrolledAt: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
  chapters: Chapter[];
  _count: {
    chapters: number;
  };
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/student/courses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch courses");
      }

      setCourses(data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać kursów",
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moje Kursy</h1>
        <p className="text-gray-600 mt-1">Kursy, na które jesteś zapisany</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Aktywne kursy
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {courses.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Wszystkie rozdziały
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {courses.reduce(
                    (sum, course) => sum + course._count.chapters,
                    0
                  )}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Wszystkie lekcje
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {courses.reduce(
                    (sum, course) =>
                      sum +
                      course.chapters.reduce(
                        (chSum, ch) => chSum + ch._count.subchapters,
                        0
                      ),
                    0
                  )}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Nie jesteś jeszcze zapisany na żaden kurs
            </p>
            <p className="text-sm text-gray-500">
              Skontaktuj się z nauczycielem, aby dołączyć do kursu
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() =>
                router.push(`/dashboard/student/courses/${course.id}`)
              }
            >
              <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="mt-4 text-xl">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {course.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4" />
                    <span>
                      Nauczyciel: {course.teacher.firstName}{" "}
                      {course.teacher.lastName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {course._count.chapters}{" "}
                      {course._count.chapters === 1
                        ? "rozdział"
                        : course._count.chapters < 5
                        ? "rozdziały"
                        : "rozdziałów"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Zapisany:{" "}
                      {new Date(course.enrolledAt).toLocaleDateString("pl-PL")}
                    </span>
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
