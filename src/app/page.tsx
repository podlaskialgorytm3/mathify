import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  LineChart,
  Users,
  CheckCircle,
  Target,
  Award,
  TrendingUp,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Mathify
          </h1>
          <p className="text-2xl text-gray-700 mb-6 font-medium">
            Nowoczesna platforma do nauki matematyki
          </p>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Wspieramy nauczycieli i uczniów w osiąganiu sukcesów matematycznych.
            Organizuj kursy, śledź postępy i rozwijaj się wraz z nami!
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <Button size="lg" className="text-lg px-10 py-6">
                Zaloguj się
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6"
              >
                Zarejestruj się
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section - Premium Design */}
      <div className="relative py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all hover:scale-105 hover:shadow-2xl">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-bold text-white mb-3">Łatwe</div>
                <p className="text-blue-100 text-lg">
                  Intuicyjne zarządzanie kursami i materiałami
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all hover:scale-105 hover:shadow-2xl">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-bold text-white mb-3">
                  Szybkie
                </div>
                <p className="text-blue-100 text-lg">
                  Błyskawiczne sprawdzanie i ocena prac
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all hover:scale-105 hover:shadow-2xl">
                <div className="bg-gradient-to-br from-pink-400 to-rose-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-transform">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-bold text-white mb-3">
                  Skuteczne
                </div>
                <p className="text-blue-100 text-lg">
                  Precyzyjne śledzenie postępów uczniów
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-20">
          <div className="inline-block">
            <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              ✨ Funkcje platformy
            </div>
          </div>
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Wszystko czego potrzebujesz
          </h2>
          <p className="text-center text-gray-600 text-xl max-w-2xl mx-auto">
            Kompleksowe narzędzia dla nowoczesnej edukacji matematycznej
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              Zarządzanie kursami
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Twórz i organizuj kursy z rozdziałami i podrozdziałami
              dostosowanymi do Twoich potrzeb
            </p>
          </div>

          <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              Sprawdzanie prac
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Efektywny system weryfikacji prac domowych z przejrzystym
              interfejsem
            </p>
          </div>

          <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <LineChart className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              Śledzenie postępów
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Szczegółowe wykresy i statystyki pokazujące rozwój każdego ucznia
            </p>
          </div>

          <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              Prosta komunikacja
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Usprawnienie wymiany informacji między nauczycielem a uczniem
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            Dlaczego Mathify?
          </h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="bg-white rounded-full p-6 shadow-lg mb-4">
                <Target className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Precyzja</h3>
              <p className="text-gray-600">
                Dokładne śledzenie postępów z każdego rozdziału i podrozdziału
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-white rounded-full p-6 shadow-lg mb-4">
                <Award className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Motywacja</h3>
              <p className="text-gray-600">
                System ocen i statystyk mobilizujący do regularnej nauki
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-white rounded-full p-6 shadow-lg mb-4">
                <TrendingUp className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Rozwój</h3>
              <p className="text-gray-600">
                Ciągły monitoring umożliwiający identyfikację obszarów do
                poprawy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Dla kogo?</h2>
        <p className="text-center text-gray-600 mb-16 text-lg">
          Mathify dostosowuje się do Twoich potrzeb
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 hover:scale-105 transition-transform">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 inline-block mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-2xl mb-4 text-gray-800">
              Administratorzy
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span>Pełne zarządzanie kontami użytkowników</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span>Kontrola nad całym systemem</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span>Tworzenie i zarządzanie kontami</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-8 hover:scale-105 transition-transform border-2 border-blue-600">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 inline-block mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-2xl mb-4 text-gray-800">
              Nauczyciele
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span>Tworzenie i edycja kursów</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span>Zarządzanie grupami uczniów</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span>Sprawdzanie i ocenianie prac</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span>Pełna analiza postępów uczniów</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-8 hover:scale-105 transition-transform">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 inline-block mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-2xl mb-4 text-gray-800">Uczniowie</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2 font-bold">✓</span>
                <span>Dostęp do wszystkich materiałów</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2 font-bold">✓</span>
                <span>Łatwe przesyłanie prac domowych</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2 font-bold">✓</span>
                <span>Szybka ocena i feedback</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2 font-bold">✓</span>
                <span>Śledzenie własnych osiągnięć</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Gotowy na rozwój?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Dołącz do Mathify już dziś i zobacz, jak łatwo można organizować
            naukę matematyki
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-10 py-6"
              >
                Zacznij teraz
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 bg-transparent text-white border-white hover:bg-white hover:text-blue-600"
              >
                Mam już konto
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 to-gray-800 py-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Mathify</h3>
            <p className="text-gray-400 mb-6">
              Nowoczesna platforma do nauki matematyki
            </p>
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-500">
                &copy; {new Date().getFullYear()} Mathify. Wszystkie prawa
                zastrzeżone.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
