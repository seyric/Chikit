import { useListAppointments } from "@workspace/api-client-react";
import { Calendar as CalendarIcon, Clock, User, UserCheck, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";

export default function Appointments() {
  const { data: appointments, isLoading } = useListAppointments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': 
      case 'no_show': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Appointments</h2>
        <button className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md">
          Book New
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments?.map(apt => (
            <div key={apt.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-4">
                <span className={clsx("px-3 py-1 rounded-full text-xs font-bold uppercase border", getStatusColor(apt.status))}>
                  {apt.status.replace('_', ' ')}
                </span>
                <span className="text-muted-foreground text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {apt.duration} min
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-lg text-foreground truncate">{apt.patientName}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <UserCheck className="w-4 h-4" /> Dr. {apt.doctorName}
                  </p>
                </div>
                
                <div className="bg-muted/40 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex flex-col items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{format(new Date(apt.appointmentDate), 'MMM')}</span>
                    <span className="font-bold text-foreground leading-none">{format(new Date(apt.appointmentDate), 'dd')}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{format(new Date(apt.appointmentDate), 'h:mm a')}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{apt.reason || 'General Checkup'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-border flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Confirm"><CheckCircle2 className="w-5 h-5"/></button>
                <button className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Cancel"><XCircle className="w-5 h-5"/></button>
              </div>
            </div>
          ))}
          {appointments?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed">
               <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
               No upcoming appointments.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
