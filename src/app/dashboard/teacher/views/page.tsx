"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Search, Users, Eye } from "lucide-react";
import { StudentCard, StudentCardData } from "@/components/students/student-card";
import { useRouter } from "next/navigation";

interface StudentWithViews extends StudentCardData {
  totalViews: number;
}

export default function ViewsOverviewPage() {
  const [students, setStudents] = useState<StudentWithViews[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const { toast } = useToast();
  const router = useRouter();

  const fetchViewsSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teacher/students/views-summary");
      const data = await response.json();

      if (response.ok) {
        setStudents(data);
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się pobrać danych",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas pobierania podsumowania wyświetleń",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViewsSummary();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.username && student.username.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === "ALL" || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-12">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl text-gray-900">Wyświetlenia</h1>
          <p className="text-gray-600 mt-1">
            Podgląd sumarycznej liczby wyświetleń dla wszystkich Twoich uczniów
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
            <div>
              <Label htmlFor="search">
                <Search className="w-4 h-4 inline mr-2" />
                Szukaj ucznia
              </Label>
              <Input
                id="search"
                placeholder="Imię, nazwisko lub nazwa użytkownika..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">
                <Users className="w-4 h-4 inline mr-2" />
                Filtruj po statusie
              </Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="ACTIVE">Tylko aktywni</option>
                <option value="INACTIVE">Tylko nieaktywni</option>
                <option value="ALL">Wszyscy</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Brak uczniów w Twoich kursach</p>
            <p className="text-sm text-gray-500">
              Uczniowie zapisani na Twoje kursy pojawią się tutaj.
            </p>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Nie znaleziono uczniów spełniających kryteria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              subtitle={`${student.totalViews} wyświetleń`}
              hideManageStudentButton={true}
              hideManageVisibilityButton={true}
              onClick={() => router.push(`/dashboard/teacher/students/${student.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
