"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    status: "ACTIVE",
  });

  const studentId = params.studentId as string;

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/teacher/students/${studentId}`);
        if (!res.ok) throw new Error("Nie udało się pobrać danych ucznia");
        const data = await res.json();
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          status: data.status,
        });
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się załadować ucznia.",
          variant: "destructive",
        });
        router.push("/dashboard/teacher/students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nie udało się zapisać zmian");
      }

      toast({
        title: "Zapisano",
        description: "Dane ucznia zostały pomyślnie zaktualizowane.",
      });
      router.push("/dashboard/teacher/students");
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Ładowanie danych...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold sm:text-3xl text-gray-900">Edytuj ucznia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dane ucznia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Imię</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status konta</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="ACTIVE">Aktywny</option>
                <option value="INACTIVE">Nieaktywny</option>
                <option value="PENDING">Oczekujący</option>
              </select>
            </div>

            <div className="pt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/teacher/students")}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  "Zapisywanie..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Zapisz zmiany
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
