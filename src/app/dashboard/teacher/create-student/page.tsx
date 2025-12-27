"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, X, CheckCircle, Copy } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

interface CreatedStudent {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  courses: string[];
}

export default function CreateStudentPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<CreatedStudent | null>(
    null
  );

  // Form data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/teacher/courses");
      if (!response.ok) throw new Error("Nie udało się pobrać kursów");
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy kursów",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: "Błąd walidacji",
        description: "Wszystkie pola są wymagane",
        variant: "destructive",
      });
      return;
    }

    if (selectedCourses.length === 0) {
      toast({
        title: "Błąd walidacji",
        description: "Musisz przypisać ucznia do co najmniej jednego kursu",
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Błąd walidacji",
        description: "Podaj poprawny adres email",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/teacher/create-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          courseIds: selectedCourses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się utworzyć konta ucznia");
      }

      setCreatedStudent(data);

      toast({
        title: "Sukces!",
        description: "Konto ucznia zostało utworzone",
      });

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setSelectedCourses([]);
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Skopiowano!",
      description: `${label} został skopiowany do schowka`,
    });
  };

  const handleCreateAnother = () => {
    setCreatedStudent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Tworzenie kont uczniom
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Nie masz jeszcze żadnych kursów.
              </p>
              <p className="text-gray-600 mb-6">
                Aby utworzyć konto ucznia, musisz najpierw utworzyć kurs.
              </p>
              <Button asChild>
                <a href="/dashboard/teacher/courses">Przejdź do Moich Kursów</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (createdStudent) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Konto ucznia utworzone!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Imię i nazwisko</Label>
                <p className="text-lg font-semibold">
                  {createdStudent.firstName} {createdStudent.lastName}
                </p>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Email</Label>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {createdStudent.email}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(createdStudent.email, "Email")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Login</Label>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {createdStudent.username}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(createdStudent.username, "Login")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600">
                  Hasło tymczasowe
                </Label>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold font-mono">
                    {createdStudent.password}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(createdStudent.password, "Hasło")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-green-200">
                <Label className="text-sm text-gray-600">
                  Przypisane kursy ({createdStudent.courses.length})
                </Label>
                <ul className="mt-2 space-y-1">
                  {createdStudent.courses.map((courseName) => (
                    <li key={courseName} className="text-sm">
                      • {courseName}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Ważne:</strong> Przekaż uczniowi login i hasło. Uczeń
                powinien zmienić hasło po pierwszym logowaniu.
              </p>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleCreateAnother}>
                <UserPlus className="h-4 w-4 mr-2" />
                Utwórz kolejne konto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Tworzenie kont uczniom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Dane osobowe</h3>

              <div>
                <Label htmlFor="firstName">
                  Imię <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Podaj imię ucznia"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="lastName">
                  Nazwisko <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Podaj nazwisko ucznia"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Course Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Przypisanie do kursów <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600">
                Wybierz kursy, do których chcesz przypisać ucznia (co najmniej
                jeden)
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => toggleCourse(course.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => toggleCourse(course.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <label className="flex-1 cursor-pointer">
                      {course.title}
                    </label>
                  </div>
                ))}
              </div>

              {selectedCourses.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Wybrano: {selectedCourses.length}{" "}
                    {selectedCourses.length === 1
                      ? "kurs"
                      : selectedCourses.length < 5
                      ? "kursy"
                      : "kursów"}
                  </p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Informacja:</strong> Po utworzeniu konta zostanie
                wygenerowany automatyczny login (na podstawie imienia i
                nazwiska) oraz losowe hasło tymczasowe.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFirstName("");
                  setLastName("");
                  setEmail("");
                  setSelectedCourses([]);
                }}
                disabled={submitting}
              >
                Wyczyść formularz
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Tworzenie konta...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Utwórz konto ucznia
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
