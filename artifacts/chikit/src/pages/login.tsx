import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth, PortalType } from "@/lib/auth";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, User, Phone, Mail, Lock, ArrowRight, ArrowLeft,
  Loader2, CheckCircle, Stethoscope, Heart, ShieldCheck, AlertCircle
} from "lucide-react";

const API_BASE = "/api";

type AuthMethod = "email" | "otp" | "google";
type Step = "portal" | "method" | "form";

export default function Login() {
  const [step, setStep] = useState<Step>("portal");
  const [portal, setPortal] = useState<PortalType>(null);
  const [method, setMethod] = useState<AuthMethod>("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const loginMutation = useLogin();

  const handlePortalSelect = (p: PortalType) => {
    setPortal(p);
    setStep("method");
    setErrorMsg("");
  };

  const handleMethodSelect = (m: AuthMethod) => {
    setMethod(m);
    setStep("form");
    setErrorMsg("");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const result = await loginMutation.mutateAsync({ data: { email, password } });
      login(result.token, portal ?? "staff");
      window.location.href = portal === "patient" ? "/patient-portal" : "/";
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid credentials. Try: admin@chikit.health / admin123");
    }
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) { setErrorMsg("Enter a valid phone number"); return; }
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setOtpSent(true);
      setDemoOtp(data._demo_otp || "");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      login(data.token, portal ?? "patient");
      window.location.href = portal === "staff" ? "/" : "/patient-portal";
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmail, name: googleName || googleEmail.split("@")[0], googleId: `g_${googleEmail}` }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      login(data.token, portal ?? "patient");
      window.location.href = portal === "staff" ? "/" : "/patient-portal";
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-sidebar-primary" />
            </div>
            <span className="font-display text-2xl font-bold text-sidebar-foreground">Chikit</span>
          </div>
          <div className="py-16">
            <h2 className="font-display text-4xl font-bold text-sidebar-foreground leading-tight mb-6">
              India's Universal<br />Healthcare Network
            </h2>
            <p className="text-sidebar-foreground/70 text-lg leading-relaxed mb-10">
              Connecting 30,000+ hospitals, millions of patients, and thousands of healthcare providers in one secure platform.
            </p>
            <div className="space-y-4">
              {[
                { icon: ShieldCheck, text: "Consent-based medical record sharing" },
                { icon: Heart, text: "Chikit Health ID for every patient" },
                { icon: Stethoscope, text: "AI-powered clinical decision support" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-sidebar-primary" />
                  </div>
                  <span className="text-sidebar-foreground/80 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sidebar-foreground/40 text-xs">© 2025 Chikit Health Technologies Pvt. Ltd.</p>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <Heart className="w-7 h-7 text-primary" />
            <span className="font-display text-2xl font-bold text-foreground">Chikit</span>
          </div>

          <AnimatePresence mode="wait">
            {step === "portal" && (
              <motion.div key="portal" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-foreground mb-2">Welcome to Chikit</h1>
                  <p className="text-muted-foreground">Select your portal to continue</p>
                </div>
                <div className="space-y-4">
                  <button onClick={() => handlePortalSelect("staff")} className="w-full p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 text-left group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Building2 className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-bold text-foreground">Hospital Staff Portal</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Doctors, nurses, admins, lab technicians & pharmacists</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>

                  <button onClick={() => handlePortalSelect("patient")} className="w-full p-6 rounded-2xl border-2 border-border bg-card hover:border-accent hover:shadow-lg hover:shadow-accent/10 transition-all duration-200 text-left group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                        <User className="w-7 h-7 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-bold text-foreground">Patient Portal</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Access your health records, appointments & prescriptions</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                  </button>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-8">
                  New to Chikit?{" "}
                  <Link href="/register" className="font-semibold text-primary hover:underline">Create account</Link>
                </p>
              </motion.div>
            )}

            {step === "method" && (
              <motion.div key="method" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <button onClick={() => setStep("portal")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="text-center mb-8">
                  <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 ${portal === "patient" ? "bg-accent/10" : "bg-primary/10"}`}>
                    {portal === "patient" ? <User className="w-7 h-7 text-accent" /> : <Building2 className="w-7 h-7 text-primary" />}
                  </div>
                  <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                    {portal === "patient" ? "Patient Sign In" : "Staff Sign In"}
                  </h1>
                  <p className="text-muted-foreground">Choose how you'd like to sign in</p>
                </div>
                <div className="space-y-3">
                  {[
                    { method: "email" as AuthMethod, icon: Mail, title: "Email & Password", desc: "Sign in with your credentials" },
                    { method: "otp" as AuthMethod, icon: Phone, title: "Phone OTP", desc: "Receive a one-time code on your phone" },
                    { method: "google" as AuthMethod, icon: null, title: "Continue with Google", desc: "Use your Google account" },
                  ].map((opt) => (
                    <button
                      key={opt.method}
                      onClick={() => handleMethodSelect(opt.method)}
                      className="w-full p-4 rounded-xl border-2 border-border bg-card hover:border-primary hover:shadow-md transition-all text-left flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors flex-shrink-0">
                        {opt.method === "google" ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        ) : (
                          opt.icon && <opt.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{opt.title}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <button onClick={() => { setStep("method"); setOtpSent(false); setErrorMsg(""); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <h1 className="font-display text-3xl font-bold text-foreground mb-1">
                    {method === "email" ? "Sign In" : method === "otp" ? "Phone Verification" : "Google Sign In"}
                  </h1>
                  <p className="text-muted-foreground text-sm capitalize">{portal} Portal</p>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 mb-5">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {method === "email" && (
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    {portal === "staff" && (
                      <div className="p-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Demo:</span> admin@chikit.health / admin123 &nbsp;|&nbsp; dr.sharma@chikit.health / doctor123
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="you@hospital.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="••••••••" />
                      </div>
                    </div>
                    <button type="submit" disabled={loginMutation.isPending} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-200">
                      {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}

                {method === "otp" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Mobile Number</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60" placeholder="+91 98765 43210" />
                        </div>
                        {!otpSent && (
                          <button type="button" onClick={handleSendOtp} disabled={loading} className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors whitespace-nowrap">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                          </button>
                        )}
                      </div>
                    </div>
                    {otpSent && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {demoOtp && (
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-primary">OTP Sent (Demo Mode)</p>
                              <p className="text-xs text-muted-foreground">Your OTP: <strong className="text-foreground font-mono text-base">{demoOtp}</strong></p>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Enter OTP</label>
                          <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} className="w-full px-4 py-4 rounded-xl bg-card border-2 border-border text-foreground text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="000000" />
                        </div>
                        <button type="submit" disabled={loading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl disabled:opacity-50 transition-all duration-200">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Sign In <ArrowRight className="w-4 h-4" /></>}
                        </button>
                        <button type="button" onClick={() => { setOtpSent(false); setOtpCode(""); setDemoOtp(""); }} className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors">
                          Resend OTP
                        </button>
                      </motion.div>
                    )}
                  </form>
                )}

                {method === "google" && (
                  <form onSubmit={handleGoogleLogin} className="space-y-4">
                    <div className="p-4 rounded-xl bg-secondary border border-border text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground mb-1">Demo Google Sign-In</p>
                      <p>In production this uses real Google OAuth. Enter your Google email to simulate the flow.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Google Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="email" required value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="you@gmail.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Your Name</label>
                      <input type="text" value={googleName} onChange={(e) => setGoogleName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-card border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Full Name (optional)" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold border-2 border-border bg-card text-foreground hover:border-primary hover:shadow-md disabled:opacity-50 transition-all">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                          Continue with Google
                        </>
                      )}
                    </button>
                  </form>
                )}

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Don't have an account?{" "}
                  <Link href="/register" className="font-semibold text-primary hover:underline">Register</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
