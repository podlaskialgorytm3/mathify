"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Search, User, Award, AlertCircle, CheckCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  maxSubchapters: number;
  maxStudents: number;
  price: number;
  currency: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  plan: Plan | null;
  stats: {
    totalStudents: number;
    totalSubchapters: number;
    coursesCount: number;
  };
}

export default function AssignPlanPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeachers();
    fetchPlans();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/admin/teachers-with-plans");
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers);
      } else {
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać listy nauczycieli",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas pobierania nauczycieli",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans");
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedPlanId(teacher.plan?.id || "NONE");
    setIsModalOpen(true);
  };

  const handleAssignPlan = async () => {
    if (!selectedTeacher) return;

    setIsAssigning(true);
    try {
      const response = await fetch("/api/admin/assign-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          planId: selectedPlanId === "NONE" ? null : selectedPlanId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Sukces",
          description: data.message,
        });
        setIsModalOpen(false);
        fetchTeachers(); // Refresh the list
      } else {
        const error = await response.json();
        toast({
          title: "Błąd",
          description: error.error || "Nie udało się przypisać planu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas przypisywania planu",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      teacher.firstName.toLowerCase().includes(searchLower) ||
      teacher.lastName.toLowerCase().includes(searchLower) ||
      teacher.email.toLowerCase().includes(searchLower)
    );
  });

  const getUsageStatus = (current: number, max: number) => {
    if (max === 0) return { percentage: 0, color: "text-gray-500" };
    const percentage = (current / max) * 100;
    if (percentage >= 100) return { percentage: 100, color: "text-red-600" };
    if (percentage >= 80) return { percentage, color: "text-orange-600" };
    return { percentage, color: "text-green-600" };
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-500">Ładowanie nauczycieli...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Przypisz Plan</h1>
        <p className="text-gray-600">
          Zarządzaj planami subskrypcyjnymi dla nauczycieli
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Szukaj nauczyciela po imieniu, nazwisku lub emailu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => {
          const studentsUsage = teacher.plan
            ? getUsageStatus(
                teacher.stats.totalStudents,
                teacher.plan.maxStudents
              )
            : null;
          const subchaptersUsage = teacher.plan
            ? getUsageStatus(
                teacher.stats.totalSubchapters,
                teacher.plan.maxSubchapters
              )
            : null;

          return (
            <Card
              key={teacher.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTeacherClick(teacher)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{teacher.email}</p>
                  </div>
                </div>
              </div>

              {/* Current Plan */}
              <div className="mb-4">
                {teacher.plan ? (
                  <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                    <Award className="h-4 w-4 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-900">
                        {teacher.plan.name}
                      </p>
                      <p className="text-xs text-purple-600">
                        {teacher.plan.price} {teacher.plan.currency}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Brak przypisanego planu
                    </p>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Uczniowie</span>
                    {teacher.plan ? (
                      <span
                        className={`text-sm font-medium ${studentsUsage?.color}`}
                      >
                        {teacher.stats.totalStudents} /{" "}
                        {teacher.plan.maxStudents}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {teacher.stats.totalStudents}
                      </span>
                    )}
                  </div>
                  {teacher.plan && studentsUsage && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          studentsUsage.percentage >= 100
                            ? "bg-red-600"
                            : studentsUsage.percentage >= 80
                            ? "bg-orange-600"
                            : "bg-green-600"
                        }`}
                        style={{
                          width: `${Math.min(studentsUsage.percentage, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Podrozdziały</span>
                    {teacher.plan ? (
                      <span
                        className={`text-sm font-medium ${subchaptersUsage?.color}`}
                      >
                        {teacher.stats.totalSubchapters} /{" "}
                        {teacher.plan.maxSubchapters}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {teacher.stats.totalSubchapters}
                      </span>
                    )}
                  </div>
                  {teacher.plan && subchaptersUsage && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          subchaptersUsage.percentage >= 100
                            ? "bg-red-600"
                            : subchaptersUsage.percentage >= 80
                            ? "bg-orange-600"
                            : "bg-green-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            subchaptersUsage.percentage,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kursy</span>
                    <span className="text-sm font-medium">
                      {teacher.stats.coursesCount}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm
              ? "Nie znaleziono nauczycieli spełniających kryteria wyszukiwania"
              : "Brak nauczycieli w systemie"}
          </p>
        </div>
      )}

      {/* Assign Plan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przypisz Plan</DialogTitle>
            <DialogDescription>
              Wybierz plan dla nauczyciela {selectedTeacher?.firstName}{" "}
              {selectedTeacher?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Stats */}
            {selectedTeacher && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Aktualne statystyki:
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedTeacher.stats.coursesCount}
                    </p>
                    <p className="text-xs text-gray-600">Kursy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedTeacher.stats.totalStudents}
                    </p>
                    <p className="text-xs text-gray-600">Uczniowie</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedTeacher.stats.totalSubchapters}
                    </p>
                    <p className="text-xs text-gray-600">Podrozdziały</p>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Wybierz Plan
              </label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz plan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Brak planu</SelectItem>
                  {plans
                    .filter((plan) => plan.id !== selectedTeacher?.plan?.id)
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ({plan.price} {plan.currency}) - Max{" "}
                        {plan.maxStudents} uczniów, {plan.maxSubchapters}{" "}
                        podrozdziałów
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warning if over limits */}
            {selectedTeacher &&
              selectedPlanId &&
              (() => {
                const selectedPlan = plans.find((p) => p.id === selectedPlanId);
                if (!selectedPlan) return null;

                const overStudentsLimit =
                  selectedTeacher.stats.totalStudents >
                  selectedPlan.maxStudents;
                const overSubchaptersLimit =
                  selectedTeacher.stats.totalSubchapters >
                  selectedPlan.maxSubchapters;

                if (overStudentsLimit || overSubchaptersLimit) {
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900 mb-1">
                            Uwaga: Przekroczenie limitów
                          </p>
                          {overStudentsLimit && (
                            <p className="text-sm text-red-700">
                              • Nauczyciel ma{" "}
                              {selectedTeacher.stats.totalStudents} uczniów, a
                              plan pozwala na max {selectedPlan.maxStudents}
                            </p>
                          )}
                          {overSubchaptersLimit && (
                            <p className="text-sm text-red-700">
                              • Nauczyciel ma{" "}
                              {selectedTeacher.stats.totalSubchapters}{" "}
                              podrozdziałów, a plan pozwala na max{" "}
                              {selectedPlan.maxSubchapters}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isAssigning}
            >
              Anuluj
            </Button>
            <Button onClick={handleAssignPlan} disabled={isAssigning}>
              {isAssigning ? "Przypisywanie..." : "Przypisz Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
