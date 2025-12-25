"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, Users, FileText, Plus, Pencil, Trash2 } from "lucide-react";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  _count?: {
    createdCourses: number;
  };
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    chapters: number;
    enrollments: number;
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/courses");
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

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/admin/teachers");
      const data = await response.json();

      if (response.ok) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const createCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          teacherId: formData.get("teacherId"),
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
      const response = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          teacherId: formData.get("teacherId"),
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
      const response = await fetch(`/api/admin/courses/${courseId}`, {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Zarządzanie Kursami</h1>
          <p className="text-gray-600 mt-2">
            Twórz i zarządzaj kursami matematyki
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nowy Kurs
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wszystkie kursy</p>
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
                <p className="text-sm text-gray-600">Wszystkie rozdziały</p>
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
                <p className="text-sm text-gray-600">Wszystkie zapisy</p>
                <p className="text-3xl font-bold">
                  {courses.reduce((sum, c) => sum + c._count.enrollments, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
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
            <p className="text-gray-600 mb-4">Brak kursów do wyświetlenia</p>
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
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {course.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {course.teacher.firstName} {course.teacher.lastName}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
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

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditingCourse(course)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edytuj
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCourse(course.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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
                <div>
                  <Label htmlFor="teacherId">Nauczyciel *</Label>
                  <select
                    id="teacherId"
                    name="teacherId"
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Wybierz nauczyciela</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} ({teacher.email})
                      </option>
                    ))}
                  </select>
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
                <div>
                  <Label htmlFor="edit-teacherId">Nauczyciel *</Label>
                  <select
                    id="edit-teacherId"
                    name="teacherId"
                    className="w-full p-2 border rounded-md"
                    defaultValue={editingCourse.teacher.id}
                    required
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} ({teacher.email})
                      </option>
                    ))}
                  </select>
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
