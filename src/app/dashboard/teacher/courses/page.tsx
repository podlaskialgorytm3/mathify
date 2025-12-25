"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  BookOpen,
  Users,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Settings,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    chapters: number;
    enrollments: number;
  };
  chapters?: Array<{
    id: string;
    title: string;
    order: number;
    _count: {
      subchapters: number;
    };
  }>;
}

export default function TeacherCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teacher/courses");
      const data = await response.json();

      if (response.ok) {
        setCourses(data.courses);
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się pobrać kursów",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas pobierania kursów",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const createCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/teacher/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setShowCreateModal(false);
        fetchCourses();
      } else {
        toast({
          title: "Błąd",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas tworzenia kursu",
        variant: "destructive",
      });
    }
  };

  const updateCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCourse) return;

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/teacher/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        setEditingCourse(null);
        fetchCourses();
      } else {
        toast({
          title: "Błąd",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas aktualizacji kursu",
        variant: "destructive",
      });
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć ten kurs? Wszystkie rozdziały i materiały zostaną usunięte."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/courses/${courseId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sukces",
          description: data.message,
        });
        fetchCourses();
      } else {
        toast({
          title: "Błąd",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas usuwania kursu",
        variant: "destructive",
      });
    }
  };

  const getTotalSubchapters = () => {
    return courses.reduce((sum, course) => {
      return (
        sum +
        (course.chapters?.reduce(
          (chSum, ch) => chSum + ch._count.subchapters,
          0
        ) || 0)
      );
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Moje Kursy</h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj swoimi kursami i materiałami
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nowy Kurs
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Moje kursy</p>
                <p className="text-3xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rozdziały</p>
                <p className="text-3xl font-bold">
                  {courses.reduce((sum, c) => sum + c._count.chapters, 0)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Podrozdziały</p>
                <p className="text-3xl font-bold">{getTotalSubchapters()}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Zapisani uczniowie</p>
                <p className="text-3xl font-bold">
                  {courses.reduce((sum, c) => sum + c._count.enrollments, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="text-center py-12">Ładowanie...</div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Nie masz jeszcze żadnych kursów
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Utwórz pierwszy kurs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                  {course.description || "Brak opisu"}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{course._count.chapters} rozdz.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course._count.enrollments} uczn.</span>
                  </div>
                </div>

                {/* Chapters List */}
                {course.chapters && course.chapters.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Rozdziały:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {course.chapters.slice(0, 3).map((chapter) => (
                        <div
                          key={chapter.id}
                          className="text-xs text-gray-600 flex items-center gap-2"
                        >
                          <span className="font-medium">{chapter.order}.</span>
                          <span className="flex-1 truncate">
                            {chapter.title}
                          </span>
                          <span className="text-gray-400">
                            ({chapter._count.subchapters})
                          </span>
                        </div>
                      ))}
                      {course.chapters.length > 3 && (
                        <p className="text-xs text-gray-400">
                          +{course.chapters.length - 3} więcej...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setEditingCourse(course)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edytuj
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push(`/dashboard/teacher/courses/${course.id}`)
                    }
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Zarządzaj
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full mt-2"
                  onClick={() => deleteCourse(course.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Usuń kurs
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Utwórz Nowy Kurs</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createCourse} className="space-y-4">
                <div>
                  <Label htmlFor="title">Tytuł kursu *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="np. Algebra I"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Opis</Label>
                  <textarea
                    id="description"
                    name="description"
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    placeholder="Opis kursu..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit">Utwórz Kurs</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edytuj Kurs</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateCourse} className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Tytuł kursu *</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    defaultValue={editingCourse.title}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Opis</Label>
                  <textarea
                    id="edit-description"
                    name="description"
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    defaultValue={editingCourse.description || ""}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingCourse(null)}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit">Zapisz Zmiany</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
