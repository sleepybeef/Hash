import Home from "./pages/home";
import AdminPage from "./pages/admin";
import SubscriptionsPage from "./pages/subscriptions";
import MyProfilePage from "./pages/my-profile";
import UserSearchPage from "./pages/user-search";
import UserProfilePage from "./pages/user-profile";
import ModeratorDashboard from "./pages/moderator-dashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/AuthContext";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MiniKitProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/my-profile" element={<MyProfilePage />} />
              <Route path="/user-search" element={<UserSearchPage />} />
              <Route path="/user/:id" element={<UserProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </MiniKitProvider>
    </QueryClientProvider>
  );
}
