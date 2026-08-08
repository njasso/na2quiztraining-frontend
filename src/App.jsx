// src/App.jsx — NA2 Quiz App
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { OfflineProvider } from "./contexts/OfflineContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import OfflineIndicator from "./components/OfflineIndicator";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import FormateurRoute from "./components/FormateurRoute";
import RequireEducationLevel from "./components/RequireEducationLevel";
import SubscriptionBanner from "./components/SubscriptionBanner";
import ChooseLevelPage from "./pages/ChooseLevelPage";

// ── Nouveaux composants UX ────────────────────────────────────────────────────
import SplashScreen from "./components/SplashScreen";
import OnboardingPage from "./pages/OnboardingPage";

// Layout & Navigation
import Navbar from "./components/Navbar";
import HomeNavbar from "./components/HomeNavbar";

// Pages Principales
import HomePage from "./pages/HomePage";
import QuizzesPage from "./pages/QuizzesPage";
import QuizChoicePage from "./pages/QuizChoicePage";
import StartQuizPage from "./pages/StartQuizPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import ReviewPage from "./pages/ReviewPage";
import StatisticsPage from "./pages/StatisticsPage";
import NotFoundPage from "./pages/NotFoundPage";
import StartPage from "./pages/StartPage";
import SettingsPage from "./pages/SettingsPage";

// Pages Légales
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

// Page d'abonnement
import SubscriptionPage from "./pages/SubscriptionPage";

// Pages Admin
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminQuizzes from "./pages/Admin/AdminQuizzes";
import AdminReports from "./pages/Admin/AdminReports";
import AdminConfig from "./pages/Admin/AdminConfig";
import AdminQuestions from "./pages/Admin/AdminQuestions";
import ImportQuestions from "./pages/Admin/ImportQuestions";
import CreateQuestion from "./pages/Admin/CreateQuestion";
import QCMCleanerPage from "./pages/Admin/QCMCleanerPage";
import QCMBankPage from "./pages/Admin/QCMBankPage";
import AIQuizCreationPage from './pages/Admin/AIQuizCreationPage';

// Pages Formateur
import FormateurDashboard from "./pages/Formateur/FormateurDashboard";
import FormateurQuizzes from "./pages/Formateur/FormateurQuizzes";
import FormateurStats from "./pages/Formateur/FormateurStats";
import MesClasses from "./pages/Formateur/MesClasses";
import RejoindreClassePage from "./pages/RejoindreClassePage";

// Pages de Composition d'Examens
import CreateExamPage from "./pages/CreateExamPage";
import ExamsPage from "./pages/ExamsPage";
import ManualQuizCreation from "./pages/ManualQuizCreation";
import DatabaseQuizCreation from "./pages/DatabaseQuizCreation";
import Compose from "./pages/Compose";
import QuizCompositionPage from "./pages/QuizCompositionPage";

// Pages de Génération IA
import GeneratePage from "./pages/GeneratePage";
import GenerateQuizPage from "./pages/GenerateQuizPage";
import AIGeneratorPage from "./pages/AIGeneratorPage";
import AIQuizCreation from "./pages/AIQuizCreation";

// Pages d'Authentification
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import FacebookCallback from "./pages/Auth/FacebookCallback";
import GoogleCallback from "./pages/Auth/GoogleCallback";

// Dashboard
import Dashboard from "./pages/Dashboard/Dashboard";

// Pages Additionnelles
import ExamScreen from "./pages/ExamScreen";
import CoursPlatform from "./pages/CoursPlatform";
import TeacherContentRequests from "./pages/Formateur/TeacherContentRequests";

// Pages Sociales
import ChallengesPage from "./pages/ChallengesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import HistoryPage from "./pages/HistoryPage";
import CommunityPage from "./pages/CommunityPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";

// Pages Communautaires
import CreateCommunityQuizPage from "./pages/CreateCommunityQuizPage";

// ─── Layout conditionnel Navbar ──────────────────────────────────────────────
const AppLayout = ({ children }) => {
  const location = useLocation();

  const noNavbarPaths = [
    "/",
    "/login",
    "/register",
    "/onboarding",
    "/choisir-niveau",
    "/dashboard",
    "/cours",
    "/admin",
    "/admin/users",
    "/admin/quizzes",
    "/admin/questions",
    "/admin/reports",
    "/admin/config",
    "/subscription",
    "/pricing",
    "/auth/facebook/callback",
    "/privacy",
    "/terms",
  ];
  const homeNavbarPaths = ["/", "/privacy", "/terms"];

  if (
    noNavbarPaths.includes(location.pathname) ||
    location.pathname.startsWith("/admin/")
  ) {
    if (homeNavbarPaths.includes(location.pathname)) {
      return (
        <>
          <HomeNavbar />
          {children}
        </>
      );
    }
    return <>{children}</>;
  }
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

// ─── Guard onboarding (première visite uniquement) ────────────────────────────
const OnboardingGuard = ({ children }) => {
  if (!localStorage.getItem("na2_onboarded")) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

// ─── Composant principal ──────────────────────────────────────────────────────
const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ErrorBoundary>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <AuthProvider>
        <OfflineProvider>
          <Router
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <SubscriptionProvider>
              <OfflineIndicator />
              <AppLayout>
                <SubscriptionBanner />
                <Routes>
                  {/* ── Onboarding (1ère visite) ── */}
                  <Route path="/onboarding" element={<OnboardingPage />} />

                  {/* ── Choix obligatoire du niveau d'étude ── */}
                  <Route
                    path="/choisir-niveau"
                    element={
                      <PrivateRoute>
                        <ChooseLevelPage />
                      </PrivateRoute>
                    }
                  />

                  {/* ========== ROUTES PUBLIQUES ========== */}
                  <Route
                    path="/"
                    element={
                      <OnboardingGuard>
                        <HomePage />
                      </OnboardingGuard>
                    }
                  />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Pages légales */}
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />

                  {/* Auth callbacks */}
                  <Route
                    path="/auth/facebook/callback"
                    element={<FacebookCallback />}
                  />
                  <Route
                    path="/auth/google/callback"
                    element={<GoogleCallback />}
                  />

                  {/* Abonnement */}
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route
                    path="/pricing"
                    element={<Navigate to="/subscription" replace />}
                  />

                  {/* ========== ROUTES ADMIN ========== */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminRoute>
                        <AdminUsers />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/quizzes"
                    element={
                      <AdminRoute>
                        <AdminQuizzes />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/reports"
                    element={
                      <AdminRoute>
                        <AdminReports />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/config"
                    element={
                      <AdminRoute>
                        <AdminConfig />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/questions"
                    element={
                      <AdminRoute>
                        <AdminQuestions />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/import"
                    element={
                      <AdminRoute>
                        <ImportQuestions />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/create-question"
                    element={
                      <FormateurRoute>
                        <CreateQuestion />
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/admin/qcm-cleaner"
                    element={
                      <AdminRoute>
                        <QCMCleanerPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/qcm-bank"
                    element={
                      <AdminRoute>
                        <QCMBankPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/qcm-validation"
                    element={<Navigate to="/admin/questions" replace />}
                  />

                  {/* ========== ROUTES FORMATEUR ========== */}
                  <Route
                    path="/formateur/dashboard"
                    element={
                      <FormateurRoute>
                        <FormateurDashboard />
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/formateur/quizzes"
                    element={
                      <FormateurRoute>
                        <FormateurQuizzes />
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/formateur/stats"
                    element={
                      <FormateurRoute>
                        <FormateurStats />
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/formateur/classes"
                    element={
                      <FormateurRoute>
                        <MesClasses />
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/rejoindre-classe"
                    element={
                      <PrivateRoute>
                        <RequireEducationLevel>
                          <RejoindreClassePage />
                        </RequireEducationLevel>
                      </PrivateRoute>
                    }
                  />

                  {/* ========== ROUTES PROTÉGÉES ========== */}

                  {/* Dashboard */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/cours"
                    element={
                      <PrivateRoute>
                        <CoursPlatform />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/sikolo"
                    element={
                      <PrivateRoute>
                        <CoursPlatform />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/formateur/demandes"
                    element={
                      <FormateurRoute>
                        <TeacherContentRequests />
                      </FormateurRoute>
                    }
                  />

                  {/* Quiz */}
                  <Route
                    path="/quizzes"
                    element={
                      <PrivateRoute>
                        <RequireEducationLevel>
                          <QuizzesPage />
                        </RequireEducationLevel>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/quiz-choice"
                    element={
                      <PrivateRoute>
                        <RequireEducationLevel>
                          <QuizChoicePage />
                        </RequireEducationLevel>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/start"
                    element={
                      <PrivateRoute>
                        <RequireEducationLevel>
                          <StartQuizPage />
                        </RequireEducationLevel>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/quiz"
                    element={
                      <PrivateRoute>
                        <QuizPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/quiz/:domaine?/:niveau?/:matiere?"
                    element={
                      <PrivateRoute>
                        <QuizPage />
                      </PrivateRoute>
                    }
                  />

                  {/* Résultats */}
                  <Route
                    path="/results"
                    element={
                      <PrivateRoute>
                        <ResultsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/results/:examId"
                    element={
                      <PrivateRoute>
                        <ResultsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/review"
                    element={
                      <PrivateRoute>
                        <ReviewPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/review/:attemptId"
                    element={
                      <PrivateRoute>
                        <ReviewPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/statistics"
                    element={
                      <PrivateRoute>
                        <StatisticsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/ai-quiz-creation"
                    element={
                      <FormateurRoute>
                        <AIQuizCreationPage />
                      </FormateurRoute>
                    }
                  />

                  {/* Examens */}
                  <Route
                    path="/create-exam"
                    element={
                      <FormateurRoute>
                        <RequireEducationLevel>
                          <CreateExamPage />
                        </RequireEducationLevel>
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/exams"
                    element={
                      <PrivateRoute>
                        <RequireEducationLevel>
                          <ExamsPage />
                        </RequireEducationLevel>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/exam/:examId"
                    element={
                      <PrivateRoute>
                        <RequireEducationLevel>
                          <QuizCompositionPage />
                        </RequireEducationLevel>
                      </PrivateRoute>
                    }
                  />

                  {/* Création */}
                  <Route
                    path="/manual"
                    element={
                      <FormateurRoute>
                        <RequireEducationLevel>
                          <ManualQuizCreation />
                        </RequireEducationLevel>
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/database"
                    element={
                      <FormateurRoute>
                        <RequireEducationLevel>
                          <DatabaseQuizCreation />
                        </RequireEducationLevel>
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/compose/file"
                    element={
                      <FormateurRoute>
                        <RequireEducationLevel>
                          <Compose />
                        </RequireEducationLevel>
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/compose"
                    element={<Navigate to="/create-exam" replace />}
                  />
                  <Route
                    path="/compose/exam"
                    element={<Navigate to="/create-exam" replace />}
                  />
                  <Route
                    path="/create"
                    element={<Navigate to="/create-exam" replace />}
                  />
                  <Route
                    path="/create/:mode"
                    element={
                      <FormateurRoute>
                        <RequireEducationLevel>
                          <CreateExamPage />
                        </RequireEducationLevel>
                      </FormateurRoute>
                    }
                  />

                  {/* IA */}
                  <Route
                    path="/generate"
                    element={
                      <FormateurRoute>
                        <RequireEducationLevel>
                          <GeneratePage />
                        </RequireEducationLevel>
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/generate-quiz"
                    element={
                      <FormateurRoute>
                        <RequireEducationLevel>
                          <GenerateQuizPage />
                        </RequireEducationLevel>
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/compose/ai"
                    element={
                      <FormateurRoute>
                        <RequireEducationLevel>
                          <AIGeneratorPage />
                        </RequireEducationLevel>
                      </FormateurRoute>
                    }
                  />
                  <Route
                    path="/ai-quiz"
                    element={
                      <FormateurRoute>
                        <RequireEducationLevel>
                          <AIQuizCreation />
                        </RequireEducationLevel>
                      </FormateurRoute>
                    }
                  />

                  {/* Additionnelles */}
                  <Route
                    path="/exam-screen"
                    element={
                      <PrivateRoute>
                        <ExamScreen />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/start-page"
                    element={
                      <PrivateRoute>
                        <StartPage />
                      </PrivateRoute>
                    }
                  />

                  {/* Social */}
                  <Route
                    path="/challenges"
                    element={
                      <PrivateRoute>
                        <ChallengesPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/leaderboard"
                    element={
                      <PrivateRoute>
                        <LeaderboardPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <PrivateRoute>
                        <HistoryPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/community"
                    element={
                      <PrivateRoute>
                        <CommunityPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/suggestions"
                    element={
                      <PrivateRoute>
                        <SuggestionsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <ProfilePage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <PrivateRoute>
                        <NotificationsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PrivateRoute>
                        <SettingsPage />
                      </PrivateRoute>
                    }
                  />

                  {/* Routes Communautaires */}
                  <Route
                    path="/create-community-quiz"
                    element={
                      <FormateurRoute>
                        <CreateCommunityQuizPage />
                      </FormateurRoute>
                    }
                  />

                  {/* 404 */}
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </AppLayout>

              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "#0f172a",
                    color: "#f8fafc",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontSize: "0.9rem",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  },
                  success: {
                    duration: 3000,
                    style: { border: "1px solid rgba(16,185,129,0.3)" },
                  },
                  error: {
                    duration: 4000,
                    style: { border: "1px solid rgba(239,68,68,0.3)" },
                  },
                  loading: {
                    duration: 30000,
                    style: { border: "1px solid rgba(99,102,241,0.3)" },
                  },
                }}
              />
            </SubscriptionProvider>
          </Router>
        </OfflineProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;