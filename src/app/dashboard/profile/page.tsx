"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Lock, Save, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: "error", text: "Imię i nazwisko są wymagane" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setMessage({
          type: "success",
          text: "Profil zaktualizowany pomyślnie",
        });
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Błąd aktualizacji" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Błąd połączenia z serwerem" });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setMessage({ type: "error", text: "Podaj prawidłowy adres email" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/request-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Link potwierdzający został wysłany na nowy adres email",
        });
        setNewEmail("");
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Błąd wysyłania emaila",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Błąd połączenia z serwerem" });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/request-password-reset", {
        method: "POST",
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Link do resetowania hasła został wysłany na Twój email",
        });
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Błąd wysyłania emaila",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Błąd połączenia z serwerem" });
    } finally {
      setSaving(false);
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

  if (!profile) {
    return (
      <div className="p-8">
        <p className="text-red-600">Nie udało się załadować profilu</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profil użytkownika</h1>
        <p className="text-gray-600 mt-1">
          Zarządzaj swoimi danymi osobowymi i ustawieniami konta
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Podstawowe informacje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Podstawowe informacje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imię
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Twoje imię"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwisko
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Twoje nazwisko"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nazwa użytkownika
            </label>
            <input
              type="text"
              value={profile.username}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nazwy użytkownika nie można zmienić
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rola
            </label>
            <input
              type="text"
              value={
                profile.role === "ADMIN"
                  ? "Administrator"
                  : profile.role === "TEACHER"
                  ? "Nauczyciel"
                  : "Uczeń"
              }
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          <Button
            onClick={handleUpdateName}
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Zapisz zmiany
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Zmiana email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Adres email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Obecny adres email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nowy adres email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nowy@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Link potwierdzający zostanie wysłany na nowy adres email
            </p>
          </div>

          <Button
            onClick={handleRequestEmailChange}
            disabled={saving}
            variant="outline"
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Wyślij link potwierdzający
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Zmiana hasła */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Hasło
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Aby zmienić hasło, kliknij poniższy przycisk. Link do resetowania
            hasła zostanie wysłany na Twój obecny adres email.
          </p>

          <Button
            onClick={handleRequestPasswordReset}
            disabled={saving}
            variant="outline"
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Wyślij link do zmiany hasła
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
