import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HeartPulse, 
  Activity, 
  ShieldCheck, 
  Users, 
  BarChart3, 
  CreditCard,
  Pill,
  Hospital,
  Fingerprint,
  FileText
} from "lucide-react";

// Duration of each scene in ms
const SCENE_DURATIONS = [
  4000, // 0: Intro (Brand Mark)
  5000, // 1: ABHA ID
  4500, // 2: Patient Dashboard & AI
  4500, // 3: Staff & Reports
  4000, // 4: Scale (30k Hospitals)
  4500, // 5: Outro
];

const TOTAL_SCENES = SCENE_DURATIONS.length;

export default function ChikitVideo() {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const advanceScene = () => {
      setCurrentScene((prev) => {
        const next = (prev + 1) % TOTAL_SCENES;
        timeout = setTimeout(advanceScene, SCENE_DURATIONS[next]);
        return next;
      });
    };

    timeout = setTimeout(advanceScene, SCENE_DURATIONS[0]);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="video-container bg-[#0a1a0f] text-white w-full h-screen relative overflow-hidden flex items-center justify-center font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .bg-grid {
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 197, 94, 0.1) 1px, transparent 1px);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .scene-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
      `}} />
      
      {/* Persistent Background Elements */}
      <div className="absolute inset-0 bg-grid opacity-30 z-0" />
      
      <motion.div 
        className="absolute w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 z-0 pointer-events-none"
        animate={{
          x: currentScene === 0 ? '-20vw' : currentScene === 2 ? '50vw' : currentScene === 4 ? '10vw' : '-10vw',
          y: currentScene === 1 ? '-20vh' : currentScene === 3 ? '40vh' : '-10vh',
          backgroundColor: currentScene % 2 === 0 ? '#22c55e' : '#059669',
          scale: currentScene === 4 ? 1.5 : 1
        }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />

      <AnimatePresence mode="wait">
        {currentScene === 0 && <SceneIntro key="scene-0" />}
        {currentScene === 1 && <SceneAbha key="scene-1" />}
        {currentScene === 2 && <SceneAI key="scene-2" />}
        {currentScene === 3 && <SceneDashboards key="scene-3" />}
        {currentScene === 4 && <SceneScale key="scene-4" />}
        {currentScene === 5 && <SceneOutro key="scene-5" />}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// SCENE 0: Intro
// ----------------------------------------------------------------------
function SceneIntro() {
  return (
    <motion.div 
      className="scene-wrapper flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
          <HeartPulse size={48} className="text-[#0a1a0f]" />
        </div>
        <h1 className="font-display text-8xl font-bold tracking-tight text-white">Chikit</h1>
      </motion.div>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent mb-8"
      />

      <motion.p 
        className="text-2xl font-light text-green-100/80 tracking-wide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        India's Universal Healthcare Network
      </motion.p>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// SCENE 1: ABHA ID
// ----------------------------------------------------------------------
function SceneAbha() {
  return (
    <motion.div 
      className="scene-wrapper flex items-center justify-between px-24 z-10 w-full max-w-[1920px] mx-auto"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100, filter: "blur(5px)" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6">
            <ShieldCheck size={20} className="text-green-400" />
            <span className="text-green-400 font-medium tracking-wide text-sm uppercase">ABDM Certified</span>
          </div>
          <h2 className="font-display text-6xl font-bold leading-tight mb-6 text-white">
            Universal<br/>Patient Identity
          </h2>
          <p className="text-xl text-green-100/70 max-w-lg">
            Seamlessly integrated with India's Ayushman Bharat Health Account. One ID for everywhere.
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex justify-end relative perspective-1000">
        <motion.div 
          className="w-[480px] rounded-3xl glass-panel p-8 shadow-2xl relative overflow-hidden"
          initial={{ rotateY: 30, opacity: 0, z: -100 }}
          animate={{ rotateY: -10, opacity: 1, z: 0 }}
          transition={{ duration: 1.2, delay: 0.6, type: "spring" }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
          
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-sm text-green-500/80 font-bold mb-1">ABHA NUMBER</p>
              <p className="text-2xl font-mono tracking-widest text-white">91-XXXX-XXXX-XXXX</p>
            </div>
            <Fingerprint className="text-green-500/50" size={40} />
          </div>

          <div className="space-y-6">
            <motion.div 
              className="h-4 bg-white/10 rounded-full w-3/4"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            />
            <motion.div 
              className="h-4 bg-white/10 rounded-full w-1/2"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            />
          </div>

          <motion.div 
            className="mt-12 pt-6 border-t border-white/10 flex justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.8 }}
          >
            <p className="text-sm text-white/50">CHIKIT ID: CHK-2024-8921</p>
            <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center">
              <Hospital size={24} className="text-white/40" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// SCENE 2: AI & Clinical Decison Support
// ----------------------------------------------------------------------
function SceneAI() {
  return (
    <motion.div 
      className="scene-wrapper flex items-center justify-center z-10"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.2, opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-20 max-w-[1920px] mx-auto w-full">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-5xl font-bold mb-4">AI Clinical Decision Support</h2>
          <p className="text-xl text-green-200/60">Real-time analysis & drug interaction checker</p>
        </motion.div>

        <div className="flex gap-8 items-center w-full max-w-5xl justify-center">
          {/* Card 1 */}
          <motion.div 
            className="glass-panel rounded-2xl p-6 w-80 shadow-lg border-t border-green-500/30 text-left"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6, type: "spring" }}
          >
            <Activity className="text-green-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Symptom Analysis</h3>
            <p className="text-sm text-white/60 mb-4">AI-driven diagnostic suggestions based on 100k+ clinical profiles.</p>
            <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-500"
                initial={{ width: "0%" }}
                animate={{ width: "85%" }}
                transition={{ duration: 1, delay: 1 }}
              />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            className="glass-panel rounded-2xl p-6 w-80 shadow-[0_0_50px_rgba(34,197,94,0.15)] border border-green-400/40 relative transform -translate-y-4 text-left"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: -16, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8, type: "spring" }}
          >
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <Pill className="text-emerald-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2 text-white">Drug Interaction Alert</h3>
            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-xs text-red-200 mt-4">
              <span className="font-bold text-red-400">WARNING:</span> Potential severe interaction between Aspirin & Warfarin detected.
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            className="glass-panel rounded-2xl p-6 w-80 shadow-lg border-t border-green-500/30 text-left"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0, type: "spring" }}
          >
            <FileText className="text-green-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Patient Summarization</h3>
            <div className="space-y-2 mt-4">
              <div className="h-2 w-full bg-white/10 rounded" />
              <div className="h-2 w-4/5 bg-white/10 rounded" />
              <div className="h-2 w-5/6 bg-white/10 rounded" />
              <div className="h-2 w-2/3 bg-white/10 rounded" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// SCENE 3: Dashboards & ERP
// ----------------------------------------------------------------------
function SceneDashboards() {
  return (
    <motion.div 
      className="scene-wrapper flex px-20 items-center justify-between z-10 w-full max-w-[1920px] mx-auto"
      initial={{ opacity: 0, clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)" }}
      animate={{ opacity: 1, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="w-1/2 pr-12">
        <motion.div className="grid grid-cols-2 gap-4" initial="hidden" animate="visible" variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.2, delayChildren: 0.4 } }
        }}>
          {/* Dashboard Blocks */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center aspect-square text-center">
            <Users size={40} className="text-green-400 mb-4" />
            <p className="text-4xl font-display font-bold">12k+</p>
            <p className="text-sm text-green-100/50 mt-1">Daily Patients</p>
          </motion.div>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-green-500 p-6 rounded-2xl flex flex-col items-center justify-center aspect-square shadow-[0_0_30px_rgba(34,197,94,0.3)] text-[#0a1a0f] text-center">
            <BarChart3 size={40} className="mb-4" />
            <p className="text-4xl font-display font-bold">Lab Sync</p>
            <p className="text-sm opacity-80 mt-1">Real-time reports</p>
          </motion.div>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center aspect-square text-center">
            <CreditCard size={40} className="text-green-400 mb-4" />
            <p className="text-4xl font-display font-bold">Billing</p>
            <p className="text-sm text-green-100/50 mt-1">Automated Taxes</p>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center aspect-square text-center">
            <ShieldCheck size={40} className="text-green-400 mb-4" />
            <p className="text-4xl font-display font-bold">6 Roles</p>
            <p className="text-sm text-green-100/50 mt-1">Staff Management</p>
          </motion.div>
        </motion.div>
      </div>

      <div className="w-1/2">
        <motion.h2 
          className="font-display text-6xl font-bold leading-tight mb-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Comprehensive<br />Hospital ERP
        </motion.h2>
        <motion.p 
          className="text-xl text-green-100/60 max-w-md"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          From reception to pharmacy, every workflow optimized. Consent-based access gives power back to the patients.
        </motion.p>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// SCENE 4: Scale
// ----------------------------------------------------------------------
function SceneScale() {
  return (
    <motion.div 
      className="scene-wrapper flex flex-col items-center justify-center z-10 bg-green-500 text-[#0a1a0f]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="grid grid-cols-3 gap-16 text-center w-full max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.3, delayChildren: 0.5 } }
        }}
      >
        <motion.div variants={{ hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
          <p className="font-display text-8xl font-black mb-2">30k+</p>
          <p className="text-2xl font-semibold opacity-80">Hospitals</p>
        </motion.div>

        <motion.div variants={{ hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
          <p className="font-display text-8xl font-black mb-2">1M+</p>
          <p className="text-2xl font-semibold opacity-80">Patients</p>
        </motion.div>

        <motion.div variants={{ hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
          <p className="font-display text-8xl font-black mb-2">1</p>
          <p className="text-2xl font-semibold opacity-80">Platform</p>
        </motion.div>
      </motion.div>

      <motion.div 
        className="absolute bottom-20 w-full flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <p className="text-xl font-bold tracking-[0.2em] uppercase opacity-60">National Health Directory Integrated</p>
      </motion.div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// SCENE 5: Outro
// ----------------------------------------------------------------------
function SceneOutro() {
  return (
    <motion.div 
      className="scene-wrapper flex flex-col items-center justify-center z-10 bg-[#0a1a0f]"
      initial={{ opacity: 0, filter: "brightness(2)" }}
      animate={{ opacity: 1, filter: "brightness(1)" }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 100 }}
        className="w-32 h-32 bg-green-500 rounded-[2rem] flex items-center justify-center shadow-[0_0_80px_rgba(34,197,94,0.4)] mb-8"
      >
        <HeartPulse size={72} className="text-[#0a1a0f]" />
      </motion.div>

      <motion.h1 
        className="font-display text-7xl font-bold text-white mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        Chikit
      </motion.h1>

      <motion.p 
        className="text-2xl text-green-400 font-light"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        Transforming Indian Healthcare. Together.
      </motion.p>
    </motion.div>
  );
}
