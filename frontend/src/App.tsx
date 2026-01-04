import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { queryConfig } from "@/lib/query";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ConnectYouTube from "./pages/ConnectYouTube";
import SelectVideos from "./pages/SelectVideos";
import Analyzing from "./pages/Analyzing";
import Dashboard from "./pages/Dashboard";
import Videos from "./pages/dashboard/Videos";
import VideoDetails from "./pages/dashboard/VideoDetails";
import AddVideo from "./pages/dashboard/AddVideo";
import AskAI from "./pages/dashboard/AskAI";
import Alerts from "./pages/dashboard/Alerts";
import Comments from "./pages/dashboard/Comments";
import Templates from "./pages/dashboard/Templates";
import Settings from "./pages/dashboard/Settings";
import Billing from "./pages/dashboard/Billing";
import NotFound from "./pages/NotFound";
// New Onboarding Pages
import ChoosePlan from "./pages/onboarding/ChoosePlan";
import FirstVideo from "./pages/onboarding/FirstVideo";
import AnalyzingProgress from "./pages/onboarding/AnalyzingProgress";

const queryClient = new QueryClient(queryConfig);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            {/* New Onboarding Flow */}
            <Route path="/onboarding/choose-plan" element={<ProtectedRoute><ChoosePlan /></ProtectedRoute>} />
            <Route path="/onboarding/first-video" element={<ProtectedRoute><FirstVideo /></ProtectedRoute>} />
            <Route path="/onboarding/analyzing" element={<ProtectedRoute><AnalyzingProgress /></ProtectedRoute>} />
            {/* Old Onboarding (kept for now) */}
            <Route path="/connect-youtube" element={<ProtectedRoute><ConnectYouTube /></ProtectedRoute>} />
            <Route path="/select-videos" element={<ProtectedRoute><SelectVideos /></ProtectedRoute>} />
            <Route path="/analyzing" element={<ProtectedRoute><Analyzing /></ProtectedRoute>} />
            {/* Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
            <Route path="/dashboard/videos/:videoId" element={<ProtectedRoute><VideoDetails /></ProtectedRoute>} />
            <Route path="/dashboard/videos/add" element={<ProtectedRoute><AddVideo /></ProtectedRoute>} />
            <Route path="/dashboard/ask-ai" element={<ProtectedRoute><AskAI /></ProtectedRoute>} />
            <Route path="/dashboard/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/dashboard/comments" element={<ProtectedRoute><Comments /></ProtectedRoute>} />
            <Route path="/dashboard/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/dashboard/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
