"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Users,
  Search,
  RotateCcw,
  Copy,
  CheckCircle,
  Mail,
  User,
  Calendar,
  BookOpen,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Course {
  id: string;
  title: string;
  enrolledAt: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  status: string;
  createdAt: string;
  courses: Course[];
}

interface ResetPasswordData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export default function CreatedStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(
    null
  );
  const [resetPasswordData, setResetPasswordData] =
    useState<ResetPasswordData | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStudents(students);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredStudents(
        students.filter(
          (student) =>
            student.firstName.toLowerCase().includes(term) ||
            student.lastName.toLowerCase().includes(term) ||
            student.email.toLowerCase().includes(term) ||
            student.username.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/teacher/created-students");
      if (!response.ok) throw new Error("Nie udało się pobrać uczniów");
      const data = await response.json();
      setStudents(data.students || []);
      setFilteredStudents(data.students || []);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy uczniów",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (studentId: string) => {
    setResettingPasswordId(studentId);

    try {
      const response = await fetch("/api/teacher/reset-student-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zresetować hasła");
      }

      setResetPasswordData(data);
      setShowResetModal(true);

      toast({
        title: "Sukces!",
        description: "Hasło zostało zresetowane",
      });
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResettingPasswordId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Skopiowano!",
      description: `${label} został skopiowany do schowka`,
    });
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Utworzone konta uczniów</h1>
          <p className="text-gray-600 mt-1">
            Lista wszystkich uczniów utworzonych przez Ciebie
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/create-student">
            <UserPlus className="h-4 w-4 mr-2" />
            Utwórz nowe konto
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Szukaj po imieniu, nazwisku, email lub loginie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm
                  ? "Nie znaleziono uczniów pasujących do wyszukiwania"
                  : "Nie utworzyłeś jeszcze żadnych kont uczniów"}
              </p>
              {!searchTerm && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/teacher/create-student">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Utwórz pierwsze konto
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-2">
            Znaleziono: {filteredStudents.length}{" "}
            {filteredStudents.length === 1
              ? "uczeń"
              : filteredStudents.length < 5
              ? "uczniów"
              : "uczniów"}
          </div>

          {filteredStudents.map((student) => (
            <Card key={student.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {student.firstName} {student.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            student.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : student.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {student.status === "ACTIVE"
                            ? "Aktywny"
                            : student.status === "PENDING"
                            ? "Oczekujący"
                            : "Nieaktywny"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Login:</span>
                        <span className="font-semibold">
                          {student.username}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(student.username, "Login")
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold">{student.email}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(student.email, "Email")
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Utworzono:</span>
                        <span className="font-semibold">
                          {new Date(student.createdAt).toLocaleDateString(
                            "pl-PL"
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Kursy:</span>
                        <span className="font-semibold">
                          {student.courses.length}
                        </span>
                      </div>
                    </div>

                    {/* Courses */}
                    {student.courses.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-gray-600 mb-2">
                          Przypisane kursy:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {student.courses.map((course) => (
                            <span
                              key={course.id}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {course.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleResetPassword(student.id)}
                      disabled={resettingPasswordId === student.id}
                    >
                      {resettingPasswordId === student.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Resetowanie...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Resetuj hasło
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resetPasswordData && (
        <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Hasło zostało zresetowane
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Uczeń</p>
                  <p className="text-lg font-semibold">
                    {resetPasswordData.firstName} {resetPasswordData.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Login</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold font-mono">
                      {resetPasswordData.username}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(resetPasswordData.username, "Login")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Nowe hasło</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold font-mono">
                      {resetPasswordData.password}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(resetPasswordData.password, "Hasło")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Ważne:</strong> Przekaż uczniowi nowy login i hasło.
                  To hasło nie będzie już dostępne po zamknięciu tego okna.
                </p>
              </div>

              <Button
                onClick={() => {
                  setShowResetModal(false);
                  setResetPasswordData(null);
                }}
                className="w-full"
              >
                Zamknij
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
