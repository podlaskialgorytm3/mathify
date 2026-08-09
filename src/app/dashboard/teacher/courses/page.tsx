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
  Link as LinkIcon,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  publicAccessType?: string;
  computedAccessType?: string;
  isSharedCopy: boolean;
  teacherAccesses?: { teacher: { id: string }, accessType: string }[];
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

interface SharedCourse {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  publicAccessType?: string;
  computedAccessType?: string;
  addedToAccount?: boolean;
  teacher: { firstName: string; lastName: string };
  _count: { chapters: number };
}

interface Colleague {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function TeacherCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sharedCourses, setSharedCourses] = useState<SharedCourse[]>([]);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTab, setCreateTab] = useState<"OWN" | "SHARED">("OWN");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Form states
  const [visibility, setVisibility] = useState<string>("PROTECTED");
  const [publicAccessType, setPublicAccessType] = useState<string>("READ_ONLY");
  const [selectedColleagues, setSelectedColleagues] = useState<{ id: string, accessType: string }[]>([]);
  
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [coursesRes, colRes] = await Promise.all([
        fetch("/api/teacher/courses"),
        fetch("/api/teacher/colleagues"),
      ]);
      
      const data = await coursesRes.json();
      const colData = await colRes.json();

      if (coursesRes.ok) {
        setCourses(data.courses);
        setSharedCourses(data.sharedCourses || []);
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się pobrać kursów",
          variant: "destructive",
        });
      }
      
      if (colRes.ok) {
        setColleagues(colData.colleagues || []);
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
          visibility,
          publicAccessType,
          sharedWithUsers: visibility === "PROTECTED" ? selectedColleagues : [],
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
          visibility,
          publicAccessType,
          sharedWithUsers: visibility === "PROTECTED" ? selectedColleagues : [],
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

  const cloneSharedCourse = async (courseId: string) => {
    try {
      const response = await fetch("/api/teacher/courses/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();

      if (response.ok) {
        toast({ title: "Sukces", description: data.message });
        setShowCreateModal(false);
        fetchCourses();
      } else {
        toast({ title: "Błąd", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Błąd", description: "Błąd klonowania kursu", variant: "destructive" });
    }
  };

  const linkSharedCourse = async (courseId: string) => {
    try {
      const response = await fetch("/api/teacher/courses/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();

      if (response.ok) {
        toast({ title: "Sukces", description: data.message });
        setShowCreateModal(false);
        fetchCourses();
      } else {
        toast({ title: "Błąd", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Błąd", description: "Błąd podczas przypisywania kursu", variant: "destructive" });
    }
  };

  const unlinkCourse = async (courseId: string) => {
    try {
      const checkRes = await fetch(`/api/teacher/courses/${courseId}/unlink`);
      const checkData = await checkRes.json();
      
      if (!checkRes.ok) {
        toast({ title: "Błąd", description: checkData.error, variant: "destructive" });
        return;
      }
      
      let message = "Czy na pewno chcesz odpiąć ten kurs od swojego konta?";
      if (checkData.count > 0) {
        message = `Do tego kursu przypisanych jest Twoich ${checkData.count} uczniów. Odpięcie kursu spowoduje usunięcie ich z tego kursu. Czy na pewno chcesz kontynuować?`;
      }
      
      if (!confirm(message)) {
        return;
      }

      const res = await fetch(`/api/teacher/courses/${courseId}/unlink`, { method: "DELETE" });
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "Sukces", description: data.message });
        fetchCourses();
      } else {
        toast({ title: "Błąd", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Błąd", description: "Wystąpił błąd podczas odpinania kursu", variant: "destructive" });
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
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <div className="flex flex-col gap-1 items-end">
                    {course.isSharedCopy && (
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                        (Kopia do edycji)
                      </span>
                    )}
                    {course.computedAccessType === 'READ_ONLY' && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                        (Oryginalny bez edycji)
                      </span>
                    )}
                    {course.computedAccessType === 'OPEN_SOURCE' && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                        (Open Source)
                      </span>
                    )}
                  </div>
                </div>
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
                    onClick={() => {
                      setEditingCourse(course);
                      setVisibility(course.visibility || "PRIVATE");
                      setPublicAccessType(course.publicAccessType || "READ_ONLY");
                      setSelectedColleagues(course.teacherAccesses?.map(a => ({ id: a.teacher.id, accessType: a.accessType })) || []);
                    }}
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
                {course.computedAccessType !== "OWNER" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full mt-2"
                    onClick={() => unlinkCourse(course.id)}
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    Odepnij kurs
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full mt-2"
                    onClick={() => deleteCourse(course.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Usuń kurs
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <CardTitle>Utwórz Nowy Kurs</CardTitle>
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>✕</Button>
              </div>
              <div className="flex space-x-4 border-b">
                <button
                  onClick={() => setCreateTab("OWN")}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    createTab === "OWN" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                  }`}
                >
                  Twój własny
                </button>
                <button
                  onClick={() => setCreateTab("SHARED")}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    createTab === "SHARED" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                  }`}
                >
                  Udostępniony
                </button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {createTab === "OWN" ? (
                <form onSubmit={createCourse} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tytuł kursu *</Label>
                    <Input id="title" name="title" placeholder="np. Algebra I" required />
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
                  
                  <div className="border-t pt-4">
                    <Label className="mb-2 block">Widoczność Kursu</Label>
                    <select 
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full p-2 border rounded-md mb-4"
                    >
                      <option value="PRIVATE">Prywatny (tylko ja)</option>
                      <option value="PROTECTED">Chroniony (wybrani nauczyciele)</option>
                      <option value="PUBLIC">Publiczny (wszyscy nauczyciele)</option>
                    </select>

                    {visibility === "PUBLIC" && (
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <Label className="mb-2 block">Uprawnienia dla innych:</Label>
                        <select
                          value={publicAccessType}
                          onChange={(e) => setPublicAccessType(e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="READ_ONLY">Tylko do odczytu</option>
                          <option value="COPY_ONLY">Edycja swojej kopii</option>
                          <option value="OPEN_SOURCE">Open Source</option>
                        </select>
                      </div>
                    )}

                    {visibility === "PROTECTED" && (
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <Label className="mb-2 block">Udostępnij nauczycielom:</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2 border bg-white p-2 rounded">
                          {colleagues.map((col) => {
                            const isSelected = selectedColleagues.some(sc => sc.id === col.id);
                            const access = selectedColleagues.find(sc => sc.id === col.id)?.accessType || "READ_ONLY";
                            
                            return (
                              <div key={col.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                                <label className="flex items-center space-x-2 flex-1">
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedColleagues([...selectedColleagues, { id: col.id, accessType: "READ_ONLY" }]);
                                      else setSelectedColleagues(selectedColleagues.filter(sc => sc.id !== col.id));
                                    }}
                                  />
                                  <span>{col.firstName} {col.lastName} <span className="text-gray-400 text-xs">({col.email})</span></span>
                                </label>
                                {isSelected && (
                                  <select 
                                    className="text-xs p-1 border rounded"
                                    value={access}
                                    onChange={(e) => {
                                      setSelectedColleagues(selectedColleagues.map(sc => 
                                        sc.id === col.id ? { ...sc, accessType: e.target.value } : sc
                                      ));
                                    }}
                                  >
                                    <option value="READ_ONLY">Odczyt</option>
                                    <option value="COPY_ONLY">Kopia</option>
                                    <option value="OPEN_SOURCE">Open Source</option>
                                  </select>
                                )}
                              </div>
                            );
                          })}
                          {colleagues.length === 0 && <p className="text-xs text-gray-500">Brak innych nauczycieli w systemie.</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                      Anuluj
                    </Button>
                    <Button type="submit">Utwórz Kurs</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {sharedCourses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Brak kursów udostępnionych dla Ciebie.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sharedCourses.map(sc => (
                        <Card key={sc.id}>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-md">{sc.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-xs text-gray-500 mb-2">Autor: {sc.teacher.firstName} {sc.teacher.lastName}</p>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{sc.description || "Brak opisu"}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                              <span>Rozdziałów: {sc._count.chapters}</span>
                              <div className="flex flex-col gap-1 items-end">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{sc.visibility === "PUBLIC" ? "Publiczny" : "Udostępniony"}</span>
                                <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                  {sc.computedAccessType === 'COPY_ONLY' ? "Można sklonować" : (sc.computedAccessType === 'OPEN_SOURCE' ? "Open Source" : "Tylko do odczytu")}
                                </span>
                              </div>
                            </div>
                            {sc.addedToAccount ? (
                              <Button className="w-full text-xs bg-gray-100 text-gray-700 hover:bg-gray-200" disabled>
                                Dodano do konta
                              </Button>
                            ) : (
                              <Button 
                                className="w-full text-xs" 
                                onClick={() => sc.computedAccessType === "COPY_ONLY" ? cloneSharedCourse(sc.id) : linkSharedCourse(sc.id)}
                              >
                                {sc.computedAccessType === "COPY_ONLY" ? "Sklonuj do swojego konta" : "Przypnij do swojego konta"}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

                {!editingCourse.isSharedCopy && (
                  <div className="border-t pt-4">
                    <Label className="mb-2 block">Widoczność Kursu</Label>
                    <select 
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full p-2 border rounded-md mb-4"
                    >
                      <option value="PRIVATE">Prywatny (tylko ja)</option>
                      <option value="PROTECTED">Chroniony (wybrani nauczyciele)</option>
                      <option value="PUBLIC">Publiczny (wszyscy nauczyciele)</option>
                    </select>

                    {visibility === "PUBLIC" && (
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <Label className="mb-2 block">Uprawnienia dla innych:</Label>
                        <select
                          value={publicAccessType}
                          onChange={(e) => setPublicAccessType(e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="READ_ONLY">Tylko do odczytu</option>
                          <option value="COPY_ONLY">Edycja swojej kopii</option>
                          <option value="OPEN_SOURCE">Open Source</option>
                        </select>
                      </div>
                    )}

                    {visibility === "PROTECTED" && (
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <Label className="mb-2 block">Udostępnij nauczycielom:</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2 border bg-white p-2 rounded">
                          {colleagues.map((col) => {
                            const isSelected = selectedColleagues.some(sc => sc.id === col.id);
                            const access = selectedColleagues.find(sc => sc.id === col.id)?.accessType || "READ_ONLY";
                            
                            return (
                              <div key={col.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                                <label className="flex items-center space-x-2 flex-1">
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedColleagues([...selectedColleagues, { id: col.id, accessType: "READ_ONLY" }]);
                                      else setSelectedColleagues(selectedColleagues.filter(sc => sc.id !== col.id));
                                    }}
                                  />
                                  <span>{col.firstName} {col.lastName} <span className="text-gray-400 text-xs">({col.email})</span></span>
                                </label>
                                {isSelected && (
                                  <select 
                                    className="text-xs p-1 border rounded"
                                    value={access}
                                    onChange={(e) => {
                                      setSelectedColleagues(selectedColleagues.map(sc => 
                                        sc.id === col.id ? { ...sc, accessType: e.target.value } : sc
                                      ));
                                    }}
                                  >
                                    <option value="READ_ONLY">Odczyt</option>
                                    <option value="COPY_ONLY">Kopia</option>
                                    <option value="OPEN_SOURCE">Open Source</option>
                                  </select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
