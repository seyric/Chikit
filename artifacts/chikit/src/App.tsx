import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientDetail from "@/pages/patient-detail";
import Appointments from "@/pages/appointments";
import AiAssistant from "@/pages/ai-assistant";
import PatientPortal from "@/pages/patient-portal";
import HospitalDirectory from "@/pages/hospital-directory";
import RegisterPatient from "@/pages/register-patient";
import Receptionist from "@/pages/receptionist";
import Labs from "@/pages/labs";
import Radiology from "@/pages/radiology";
import Pharmacy from "@/pages/pharmacy";
import Ward from "@/pages/ward";
import DrugDatabase from "@/pages/drug-database";
import StaffManagement from "@/pages/staff-management";
import Reports from "@/pages/reports";
import Billing from "@/pages/billing";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<object>; [key: string]: unknown }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Patient Portal — standalone layout */}
      <Route path="/patient-portal" component={PatientPortal} />
      <Route path="/patient-portal/:rest*" component={PatientPortal} />

      {/* Staff Portal — role-specific dashboards */}
      <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/patients">{() => <ProtectedRoute component={Patients} />}</Route>
      <Route path="/patients/register">{() => <ProtectedRoute component={RegisterPatient} />}</Route>
      <Route path="/patients/:id">{() => <ProtectedRoute component={PatientDetail} />}</Route>
      <Route path="/appointments">{() => <ProtectedRoute component={Appointments} />}</Route>
      <Route path="/ai-assistant">{() => <ProtectedRoute component={AiAssistant} />}</Route>
      <Route path="/hospitals">{() => <ProtectedRoute component={HospitalDirectory} />}</Route>

      {/* Role-specific pages */}
      <Route path="/receptionist">{() => <ProtectedRoute component={Receptionist} />}</Route>
      <Route path="/labs">{() => <ProtectedRoute component={Labs} />}</Route>
      <Route path="/radiology">{() => <ProtectedRoute component={Radiology} />}</Route>
      <Route path="/pharmacy">{() => <ProtectedRoute component={Pharmacy} />}</Route>
      <Route path="/ward">{() => <ProtectedRoute component={Ward} />}</Route>
      <Route path="/drug-database">{() => <ProtectedRoute component={DrugDatabase} />}</Route>
      <Route path="/staff-management">{() => <ProtectedRoute component={StaffManagement} />}</Route>
      <Route path="/reports">{() => <ProtectedRoute component={Reports} />}</Route>
      <Route path="/billing">{() => <ProtectedRoute component={Billing} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
