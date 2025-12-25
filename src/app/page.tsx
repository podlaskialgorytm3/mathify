import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, LineChart, Users, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Mathify</h1>
          <p className="text-xl text-gray-600 mb-8">
            Aplikacja do śledzenia rozwoju matematycznego uczniów
          </p>
          <p className="text-lg text-gray-500 mb-10">
            Platforma wspierająca nauczycieli i uczniów w procesie nauki
            matematyki z wykorzystaniem sztucznej inteligencji do automatycznego
            sprawdzania prac
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Zaloguj się
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Zarejestruj się
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Główne funkcje</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Zarządzanie kursami</h3>
            <p className="text-gray-600 text-sm">
              Twórz i organizuj kursy z rozdziałami i podrozdziałami
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Automatyczne sprawdzanie
            </h3>
            <p className="text-gray-600 text-sm">
              AI sprawdza prace domowe i generuje szczegółowe wyniki
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <LineChart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Śledzenie postępów</h3>
            <p className="text-gray-600 text-sm">
              Wykresy i statystyki pokazujące rozwój ucznia
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Prosta komunikacja</h3>
            <p className="text-gray-600 text-sm">
              Usprawnienie wymiany informacji nauczyciel-uczeń
            </p>
          </div>
        </div>
      </div>

      {/* Roles Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Dla kogo?</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-xl mb-3 text-blue-600">
              Administratorzy
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Zarządzanie kontami użytkowników</li>
              <li>✓ Pełna kontrola nad systemem</li>
              <li>✓ Tworzenie i usuwanie kont</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-xl mb-3 text-blue-600">
              Nauczyciele
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Tworzenie kursów</li>
              <li>✓ Zarządzanie uczniami</li>
              <li>✓ Weryfikacja prac AI</li>
              <li>✓ Śledzenie postępów uczniów</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-xl mb-3 text-blue-600">Uczniowie</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Dostęp do materiałów</li>
              <li>✓ Przesyłanie prac domowych</li>
              <li>✓ Natychmiastowy feedback od AI</li>
              <li>✓ Śledzenie własnych postępów</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 Mathify. Wszystkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
}
