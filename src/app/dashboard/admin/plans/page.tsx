"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Award,
  Plus,
  Edit,
  Trash2,
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Plan {
  id: string;
  name: string;
  maxSubchapters: number;
  maxStudents: number;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
  };
}

const currencies = [
  { value: "PLN", label: "PLN (złoty)" },
  { value: "USD", label: "USD (dolar)" },
  { value: "EUR", label: "EUR (euro)" },
  { value: "GBP", label: "GBP (funt)" },
];

export default function PlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [maxSubchapters, setMaxSubchapters] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("PLN");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans");
      if (!response.ok) throw new Error("Nie udało się pobrać planów");
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy planów",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setMaxSubchapters("");
    setMaxStudents("");
    setPrice("");
    setCurrency("PLN");
    setIsActive(true);
    setEditingPlan(null);
  };

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setName(plan.name);
      setMaxSubchapters(plan.maxSubchapters.toString());
      setMaxStudents(plan.maxStudents.toString());
      setPrice(plan.price.toString());
      setCurrency(plan.currency);
      setIsActive(plan.isActive);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !maxSubchapters || !maxStudents || !price) {
      toast({
        title: "Błąd walidacji",
        description: "Wszystkie pola są wymagane",
        variant: "destructive",
      });
      return;
    }

    if (
      parseInt(maxSubchapters) < 1 ||
      parseInt(maxStudents) < 1 ||
      parseFloat(price) < 0
    ) {
      toast({
        title: "Błąd walidacji",
        description: "Wartości muszą być dodatnie",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const url = editingPlan
        ? `/api/admin/plans/${editingPlan.id}`
        : "/api/admin/plans";
      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          maxSubchapters: parseInt(maxSubchapters),
          maxStudents: parseInt(maxStudents),
          price: parseFloat(price),
          currency,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd");
      }

      toast({
        title: "Sukces!",
        description: editingPlan
          ? "Plan został zaktualizowany"
          : "Plan został utworzony",
      });

      handleCloseModal();
      fetchPlans();
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

  const handleDelete = async (planId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten plan?")) {
      return;
    }

    setDeletingId(planId);

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się usunąć planu");
      }

      toast({
        title: "Sukces!",
        description: "Plan został usunięty",
      });

      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
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
          <h1 className="text-3xl font-bold">Zarządzanie planami</h1>
          <p className="text-gray-600 mt-1">
            Twórz i zarządzaj planami subskrypcyjnymi dla nauczycieli
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/plans/assign">
              <UserCog className="h-4 w-4 mr-2" />
              Przypisz plan
            </Link>
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj nowy plan
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">
                Nie utworzono jeszcze żadnych planów
              </p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Utwórz pierwszy plan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  {plan.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      Aktywny
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      Nieaktywny
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-600">
                      {plan.price}
                    </span>
                    <span className="text-lg text-blue-600">
                      {plan.currency}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Podrozdziały:</span>
                    <span className="font-semibold">{plan.maxSubchapters}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Uczniowie:</span>
                    <span className="font-semibold">{plan.maxStudents}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Przypisani:</span>
                    <span className="font-semibold">
                      {plan._count.users} nauczycieli
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleOpenModal(plan)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edytuj
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(plan.id)}
                    disabled={deletingId === plan.id}
                  >
                    {deletingId === plan.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edytuj plan" : "Utwórz nowy plan"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">
                Nazwa planu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Plan Podstawowy"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxSubchapters">
                  Maks. podrozdziałów <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxSubchapters"
                  type="number"
                  min="1"
                  value={maxSubchapters}
                  onChange={(e) => setMaxSubchapters(e.target.value)}
                  placeholder="100"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="maxStudents">
                  Maks. uczniów <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                  placeholder="50"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">
                  Cena <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="99.99"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="currency">
                  Waluta <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                disabled={submitting}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Plan aktywny
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingPlan ? "Zapisywanie..." : "Tworzenie..."}
                  </>
                ) : (
                  <>{editingPlan ? "Zapisz zmiany" : "Utwórz plan"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
