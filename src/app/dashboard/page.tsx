import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  FileText,
  CheckCircle,
  Award,
  TrendingUp,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Redirect based on role
  if (user.role === "ADMIN") {
    return <AdminDashboard user={user} />;
  } else if (user.role === "TEACHER") {
    return <TeacherDashboard user={user} />;
  } else {
    return <StudentDashboard user={user} />;
  }
}

function AdminDashboard({ user }: any) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Witaj, {user.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Wszyscy użytkownicy
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Załaduj statystyki</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Oczekujące konta
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Wymagają zatwierdzenia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Wszystkie kursy
            </CardTitle>
            <BookOpen className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">W systemie</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Prace domowe
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-gray-500 mt-1">Przesłanych prac</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Panel administratora</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Zarządzaj użytkownikami, kursami i systemem. Wybierz opcję z menu po
            lewej stronie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherDashboard({ user }: any) {
  return <TeacherDashboardContent userId={user.id} userName={user.name} />;
}

async function TeacherDashboardContent({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  // Pobierz kursy nauczyciela
  const courses = await prisma.course.findMany({
    where: { teacherId: userId },
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  // Pobierz wszystkie prace do sprawdzenia (AI_CHECKED lub TEACHER_REVIEWING)
  const pendingSubmissions = await prisma.submission.findMany({
    where: {
      subchapter: {
        chapter: {
          course: {
            teacherId: userId,
          },
        },
      },
      status: {
        in: ["AI_CHECKED", "TEACHER_REVIEWING"],
      },
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      subchapter: {
        select: {
          title: true,
          chapter: {
            select: {
              title: true,
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
      tasks: {
        select: {
          pointsEarned: true,
          maxPoints: true,
        },
      },
    },
    orderBy: {
      submittedAt: "asc",
    },
    take: 5,
  });

  // Pobierz ostatnio zaakceptowane prace
  const recentApproved = await prisma.submission.findMany({
    where: {
      subchapter: {
        chapter: {
          course: {
            teacherId: userId,
          },
        },
      },
      review: {
        approved: true,
      },
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      subchapter: {
        select: {
          title: true,
          chapter: {
            select: {
              title: true,
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
      tasks: {
        select: {
          pointsEarned: true,
          maxPoints: true,
        },
      },
      review: {
        select: {
          reviewedAt: true,
        },
      },
    },
    orderBy: {
      review: {
        reviewedAt: "desc",
      },
    },
    take: 5,
  });

  // Oblicz łączną liczbę uczniów
  const totalStudents = await prisma.courseEnrollment.count({
    where: {
      course: {
        teacherId: userId,
      },
    },
  });

  // Oblicz łączną liczbę prac oczekujących
  const totalPending = await prisma.submission.count({
    where: {
      subchapter: {
        chapter: {
          course: {
            teacherId: userId,
          },
        },
      },
      status: {
        in: ["AI_CHECKED", "TEACHER_REVIEWING"],
      },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Witaj, {userName}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Moje kursy
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-gray-500 mt-1">Aktywnych kursów</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Moi uczniowie
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Zapisanych w kursach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Do sprawdzenia
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-gray-500 mt-1">Prac oczekujących</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Zaakceptowane
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentApproved.length}</div>
            <p className="text-xs text-gray-500 mt-1">Ostatnio sprawdzonych</p>
          </CardContent>
        </Card>
      </div>

      {/* Prace do sprawdzenia */}
      {pendingSubmissions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Prace do sprawdzenia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => {
                let totalEarned = 0;
                let totalMax = 0;
                submission.tasks.forEach((task) => {
                  totalEarned += task.pointsEarned;
                  totalMax += task.maxPoints;
                });
                const percentage =
                  totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

                return (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {submission.student.firstName}{" "}
                        {submission.student.lastName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {submission.subchapter.chapter.course.title} •{" "}
                        {submission.subchapter.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Przesłano:{" "}
                        {new Date(submission.submittedAt).toLocaleDateString(
                          "pl-PL",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {submission.tasks.length > 0 && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {percentage}%
                          </div>
                          <p className="text-xs text-gray-500">
                            {totalEarned}/{totalMax} pkt (AI)
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Oczekuje
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/teacher/review"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Zobacz wszystkie prace →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ostatnio sprawdzone prace */}
      {recentApproved.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Ostatnio zaakceptowane prace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApproved.map((submission) => {
                let totalEarned = 0;
                let totalMax = 0;
                submission.tasks.forEach((task) => {
                  totalEarned += task.pointsEarned;
                  totalMax += task.maxPoints;
                });
                const percentage =
                  totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

                return (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {submission.student.firstName}{" "}
                        {submission.student.lastName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {submission.subchapter.chapter.course.title} •{" "}
                        {submission.subchapter.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Sprawdzono:{" "}
                        {submission.review?.reviewedAt
                          ? new Date(
                              submission.review.reviewedAt
                            ).toLocaleDateString("pl-PL", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Niedawno"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {submission.tasks.length > 0 && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {percentage}%
                          </div>
                          <p className="text-xs text-gray-500">
                            {totalEarned}/{totalMax} pkt
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Zaakceptowane
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/teacher/review"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Zobacz historię →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Szybkie akcje */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/teacher/courses">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Zarządzaj kursami
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Twórz i edytuj kursy, dodawaj materiały i zadania
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/teacher/review">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Sprawdź prace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Przeglądaj i oceniaj prace domowe swoich uczniów
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/teacher/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Moi uczniowie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Zobacz postępy i statystyki swoich uczniów
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function StudentDashboard({ user }: any) {
  return <StudentDashboardContent userId={user.id} userName={user.name} />;
}

async function StudentDashboardContent({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  // Pobierz kursy ucznia
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId: userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Pobierz prace ucznia (tylko zaakceptowane)
  const submissions = await prisma.submission.findMany({
    where: {
      studentId: userId,
      review: {
        approved: true,
      },
    },
    include: {
      subchapter: {
        select: {
          title: true,
          chapter: {
            select: {
              title: true,
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
      tasks: {
        select: {
          pointsEarned: true,
          maxPoints: true,
        },
      },
      review: {
        select: {
          approved: true,
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
    take: 5,
  });

  // Oblicz statystyki
  const allSubmissions = await prisma.submission.findMany({
    where: {
      studentId: userId,
      review: {
        approved: true,
      },
    },
    include: {
      tasks: {
        select: {
          pointsEarned: true,
          maxPoints: true,
        },
      },
    },
  });

  let totalPointsEarned = 0;
  let totalPointsMax = 0;
  let personalBest = 0;

  allSubmissions.forEach((submission) => {
    let submissionPoints = 0;
    let submissionMax = 0;

    submission.tasks.forEach((task) => {
      totalPointsEarned += task.pointsEarned;
      totalPointsMax += task.maxPoints;
      submissionPoints += task.pointsEarned;
      submissionMax += task.maxPoints;
    });

    if (submissionMax > 0) {
      const percentage = (submissionPoints / submissionMax) * 100;
      if (percentage > personalBest) {
        personalBest = percentage;
      }
    }
  });

  const averagePercentage =
    totalPointsMax > 0
      ? Math.round((totalPointsEarned / totalPointsMax) * 100)
      : 0;
  const approvedCount = allSubmissions.length;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Witaj, {userName}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Moje kursy
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
            <p className="text-xs text-gray-500 mt-1">Aktywnych kursów</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Średnia ocen
            </CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePercentage}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Z {approvedCount} zaakceptowanych prac
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Personal Best
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(personalBest)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Najlepszy wynik</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Przesłane prace
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-gray-500 mt-1">Ostatnio przesłanych</p>
          </CardContent>
        </Card>
      </div>

      {/* Ostatnie prace */}
      {submissions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Ostatnie prace domowe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissions.map((submission) => {
                let totalEarned = 0;
                let totalMax = 0;
                submission.tasks.forEach((task) => {
                  totalEarned += task.pointsEarned;
                  totalMax += task.maxPoints;
                });
                const percentage =
                  totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

                return (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {submission.subchapter.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {submission.subchapter.chapter.course.title} •{" "}
                        {submission.subchapter.chapter.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(submission.submittedAt).toLocaleDateString(
                          "pl-PL",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {submission.tasks.length > 0 && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {percentage}%
                          </div>
                          <p className="text-xs text-gray-500">
                            {totalEarned}/{totalMax} pkt
                          </p>
                        </div>
                      )}
                      <div>
                        {submission.review?.approved === true && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Zaakceptowane
                          </span>
                        )}
                        {submission.review?.approved === false && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Odrzucone
                          </span>
                        )}
                        {!submission.review && submission.tasks.length > 0 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Sprawdzone
                          </span>
                        )}
                        {!submission.review &&
                          submission.tasks.length === 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Oczekuje
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/student/submissions"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Zobacz wszystkie prace →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Szybkie akcje */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/student/courses">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Przeglądaj kursy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Zobacz dostępne materiały i zadania w swoich kursach
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/student/submissions">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Moje prace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Sprawdź status i oceny swoich prac domowych
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/student/statistics">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Statystyki
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Analizuj swoje postępy i osiągnięcia w nauce
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
