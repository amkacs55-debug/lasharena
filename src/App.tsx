import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppDataProvider } from "@/context/AppDataContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { BookingModalProvider } from "@/context/BookingModalContext";
import { HomePage } from "@/pages/public/HomePage";
import { LoginPage } from "@/pages/admin/LoginPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { BookingsPage } from "@/pages/admin/BookingsPage";
import { ServicesPage } from "@/pages/admin/ServicesPage";
import { GalleryPage } from "@/pages/admin/GalleryPage";
import { SettingsPage } from "@/pages/admin/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppDataProvider>
        <AdminAuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <BookingModalProvider>
                  <HomePage />
                </BookingModalProvider>
              }
            />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AdminAuthProvider>
      </AppDataProvider>
    </BrowserRouter>
  );
}
