"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Upload, FileText, AlertCircle } from "lucide-react";

interface SubchapterInfo {
  id: string;
  title: string;
  order: number;
  chapterTitle: string;
  chapterOrder: number;
  allowSubmissions: boolean;
  canSubmit: boolean;
  isVisible: boolean;
}

export default function SubmitHomeworkPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [subchapter, setSubchapter] = useState<SubchapterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<boolean>(false);

  useEffect(() => {
    fetchSubchapterInfo();
    checkExistingSubmission();
  }, [params.subchapterId]);

  const checkExistingSubmission = async () => {
    try {
      const response = await fetch(
        `/api/student/submissions/subchapter/${params.subchapterId}`
      );
      const data = await response.json();

      if (response.ok && data.submission) {
        setExistingSubmission(true);
      }
    } catch (error) {
      console.error("Error checking existing submission:", error);
    }
  };

  const fetchSubchapterInfo = async () => {
    try {
      const response = await fetch(
        `/api/student/courses/${params.courseId}/subchapters/${params.subchapterId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch subchapter");
      }

      setSubchapter(data);
    } catch (error) {
      console.error("Error fetching subchapter:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać informacji o podrozdziale",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Sprawdź rozmiar pliku (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Błąd",
          description: "Plik jest za duży. Maksymalny rozmiar to 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "Błąd",
        description: "Wybierz plik do przesłania",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("subchapterId", params.subchapterId as string);

      const response = await fetch("/api/student/submissions", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      toast({
        title: "Sukces",
        description: "Praca domowa została przesłana",
      });

      // Wróć do strony kursu
      router.push(`/dashboard/student/courses/${params.courseId}`);
    } catch (error) {
      console.error("Error uploading homework:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać pracy domowej",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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

  if (!subchapter) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Nie znaleziono podrozdziału
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subchapter.isVisible) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Podrozdział zablokowany
              </h3>
              <p className="text-gray-500">
                Ten podrozdział nie jest jeszcze dostępny
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(`/dashboard/student/courses/${params.courseId}`)
              }
            >
              Wróć do kursu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subchapter.allowSubmissions) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Brak pracy domowej
              </h3>
              <p className="text-gray-500">
                Ten podrozdział nie wymaga przesyłania pracy domowej
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(`/dashboard/student/courses/${params.courseId}`)
              }
            >
              Wróć do kursu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subchapter.canSubmit) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Przesyłanie zablokowane
              </h3>
              <p className="text-gray-500">
                Przesyłanie prac domowych dla tego podrozdziału jest obecnie
                zablokowane przez nauczyciela
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(`/dashboard/student/courses/${params.courseId}`)
              }
            >
              Wróć do kursu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Jeśli praca już istnieje, przekieruj do kursu
  if (existingSubmission) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-blue-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Praca już przesłana
              </h3>
              <p className="text-gray-500">
                Przesłałeś już pracę dla tego podrozdziału. Możesz ją usunąć i
                przesłać nową z poziomu strony kursu.
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(`/dashboard/student/courses/${params.courseId}`)
              }
            >
              Wróć do kursu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            router.push(`/dashboard/student/courses/${params.courseId}`)
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Prześlij pracę domową</h1>
          <p className="text-gray-500">
            {subchapter.chapterOrder}.{subchapter.order} {subchapter.title}
          </p>
        </div>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Wybierz plik do przesłania</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700">
                Kliknij, aby wybrać plik
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Maksymalny rozmiar: 10MB
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Obsługiwane formaty: PDF, DOC, DOCX, TXT, PNG, JPG
              </p>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Usuń
              </Button>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? "Przesyłanie..." : "Prześlij pracę"}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/student/courses/${params.courseId}`)
              }
            >
              Anuluj
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Ważne informacje:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Możesz przesłać tylko jeden plik</li>
                <li>
                  Po przesłaniu pracy, nauczyciel otrzyma powiadomienie i będzie
                  mógł ją ocenić
                </li>
                <li>
                  Upewnij się, że przesyłasz właściwy plik - nie będzie można go
                  zmienić
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
