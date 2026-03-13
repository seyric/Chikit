import { useGetDashboardStats } from "@workspace/api-client-react";
import { Users, UserPlus, Building, Calendar, Activity, FileText, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-40 bg-muted rounded-2xl"></div></div></div>;
  }

  const statCards = [
    { title: "Total Patients", value: stats?.totalPatients || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Active Doctors", value: stats?.totalDoctors || 0, icon: UserPlus, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Hospitals", value: stats?.totalHospitals || 0, icon: Building, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Appointments Today", value: stats?.todayAppointments || 0, icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Pending Labs", value: stats?.pendingLabReports || 0, icon: Activity, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "Recent Records", value: stats?.recentMedicalRecords || 0, icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "AI Analyses Today", value: stats?.aiAnalysesToday || 0, icon: BrainCircuit, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.title}
            className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-display font-bold text-foreground mt-2">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-accent" /> AI Insights Summary
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <p className="font-medium text-foreground">Symptom analysis usage increased by 14% this week.</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="font-medium text-foreground">3 critical lab results identified and flagged for review today.</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Upcoming Schedule
          </h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Select the Appointments tab to view detailed schedule.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
