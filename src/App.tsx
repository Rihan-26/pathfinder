import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Target,
  TrendingUp,
  RefreshCw,
  BookOpen,
  Video,
  FileText,
  Bookmark,
  ChevronRight,
  Compass,
  Download,
  Check,
  Plus,
  X,
  AlertCircle,
  HelpCircle,
  Clock,
  BriefcaseBusiness
} from "lucide-react";
import { UserInput, RoadmapResponse, Milestone, ActionItem, Resource } from "./types";

const SKILL_SUGGESTIONS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++", "SQL",
  "HTML/CSS", "Git", "Docker", "AWS", "Machine Learning", "System Design", "Algorithms"
];

const PRESET_JDS = [
  {
    role: "Frontend Engineer (React)",
    desc: "Collaborate on interactive client-side platforms. Requirements: Proficiency in React, TypeScript, responsive Tailwind layouts, state management tools (Zustand/Redux), and RESTful API integration."
  },
  {
    role: "Backend Engineer (Node/Python)",
    desc: "Build highly-scalable APIs and secure architectures. Requirements: Expert Node.js or Python, database design (PostgreSQL/MongoDB), caching (Redis), distributed systems, and GCP/AWS infrastructure."
  },
  {
    role: "Data Infrastructure & AI Intern",
    desc: "Develop pipeline jobs and refine models. Requirements: Python scripting, PyTorch/TensorFlow, SQL proficiency, data cleaning, and deployment of fine-tuned transformers/regression pipelines."
  }
];

export default function App() {
  // Input States
  const [cgpa, setCgpa] = useState("8.5");
  const [degreeScale, setDegreeScale] = useState<"10" | "4">("10");
  const [skillInput, setSkillInput] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>(["JavaScript", "React", "HTML/CSS", "Git"]);
  const [extraContext, setExtraContext] = useState("3rd Year Computer Science student seeking internship opportunities.");
  const [jobDescription, setJobDescription] = useState("");

  // UI Control & Result States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Selected Milestone for detail view
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  
  // User Progress Tracking (Saves to LocalStorage)
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Load saved roadmap and tasks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("career_roadmap");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRoadmap(parsed);
        if (parsed.milestones && parsed.milestones.length > 0) {
          setSelectedMilestoneId(parsed.milestones[0].id);
        }
      } catch (e) {
        console.error("Failed to load saved roadmap", e);
      }
    }
    const savedTasks = localStorage.getItem("completed_tasks");
    if (savedTasks) {
      try {
        setCompletedTaskIds(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to load completed tasks", e);
      }
    }
  }, []);

  // Save progress changes
  const toggleTaskCompletion = (taskId: string) => {
    const updated = completedTaskIds.includes(taskId)
      ? completedTaskIds.filter((id) => id !== taskId)
      : [...completedTaskIds, taskId];
    
    setCompletedTaskIds(updated);
    localStorage.setItem("completed_tasks", JSON.stringify(updated));
  };

  // Safe helper to save roadmap to local state and storage
  const handleSetRoadmap = (data: RoadmapResponse) => {
    setRoadmap(data);
    setShowForm(false);
    localStorage.setItem("career_roadmap", JSON.stringify(data));
    // Default to select first milestone
    if (data.milestones && data.milestones.length > 0) {
      setSelectedMilestoneId(data.milestones[0].id);
    }
    setError(null);
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillsList([...skillsList, trimmed]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (index: number) => {
    setSkillsList(skillsList.filter((_, i) => i !== index));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };

  const fillTemplate = (roleDesc: string) => {
    setJobDescription(roleDesc);
  };

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const fullKnownKnowledge = `Known Skills: [${skillsList.join(", ")}]. Candidate Bio / Context: ${extraContext}`;

    try {
      const resp = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cgpa: `${cgpa} (out of ${degreeScale})`,
          knownKnowledge: fullKnownKnowledge,
          jobDescription: jobDescription.trim() || "Software engineering career trajectory",
        }),
      });

      if (!resp.ok) {
        const errPayload = await resp.json().catch(() => ({ error: "Unknown gateway error" }));
        throw new Error(errPayload.error || "Failed to generate roadmap.");
      }

      const parsed = await resp.json();
      handleSetRoadmap(parsed);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred while communicating with Pathfinder AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset? This will clear your current roadmap progress.")) {
      setRoadmap(null);
      setShowForm(false);
      setCompletedTaskIds([]);
      localStorage.removeItem("career_roadmap");
      localStorage.removeItem("completed_tasks");
    }
  };

  // Stats derivations
  const activeMilestone = useMemo(() => {
    if (!roadmap) return null;
    return roadmap.milestones.find((m) => m.id === selectedMilestoneId) || roadmap.milestones[0];
  }, [roadmap, selectedMilestoneId]);

  const progressStats = useMemo(() => {
    if (!roadmap) return { percentage: 0, completed: 0, total: 0 };
    
    let totalTasks = 0;
    let completedCount = 0;
    
    roadmap.milestones.forEach((milestone) => {
      milestone.actionItems.forEach((action) => {
        totalTasks++;
        if (completedTaskIds.includes(action.id)) {
          completedCount++;
        }
      });
    });

    return {
      percentage: totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100),
      completed: completedCount,
      total: totalTasks
    };
  }, [roadmap, completedTaskIds]);

  // Download roadmap as a gorgeous interactive offline HTML document
  const downloadSummaryText = () => {
    if (!roadmap) return;

    // Helper to generate the action items HTML
    const getActionItemsHtml = (actionItems: any[]) => {
      return actionItems.map(ai => {
        const isCompleted = completedTaskIds.includes(ai.id);
        return `
          <div class="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-indigo-950/60 hover:border-indigo-500/10 transition-all select-none">
            <input 
              type="checkbox" 
              ${isCompleted ? 'checked' : ''} 
              id="offline_task_${ai.id}"
              class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 mt-0.5 cursor-pointer transition-all shrink-0"
              onchange="toggleTaskOffline('${ai.id}')"
            />
            <div class="flex-1 min-w-0">
              <label for="offline_task_${ai.id}" class="text-xs text-slate-300 hover:text-white cursor-pointer select-none leading-relaxed block">${ai.task}</label>
            </div>
            <span class="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded shrink-0">${ai.estimatedHours}h</span>
          </div>
        `;
      }).join('');
    };

    // Helper to generate the milestone cards HTML
    const getMilestonesHtml = () => {
      return roadmap.milestones.map((m, index) => {
        return `
          <div class="bg-slate-955 rounded-3xl border border-indigo-950/80 p-5 sm:p-6 space-y-4 hover:border-indigo-500/20 transition-all print-card">
            <div class="flex flex-col sm:flex-row justify-between sm:items-start gap-2 border-b border-indigo-950/40 pb-3">
              <div>
                <span class="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded">PHASE ${index + 1} • ${m.duration}</span>
                <h3 class="text-lg font-extrabold text-white mt-1.5 tracking-tight text-glow text-black-p">${m.title}</h3>
              </div>
              <span class="text-[10px] font-mono text-slate-500">ID: ${m.id}</span>
            </div>
            
            <p class="text-xs text-slate-300 leading-relaxed text-black-p">${m.description}</p>
            
            <div class="p-3 bg-slate-900/40 rounded-xl border border-indigo-950/80 text-[11px] text-slate-300 italic leading-relaxed print-card">
              <strong class="text-indigo-400 text-3xs font-extrabold uppercase tracking-widest block mb-1">Recruiter Coach Advice:</strong>
              ${m.recommendationReason}
            </div>

            <div class="space-y-2">
              <h4 class="text-3xs font-extrabold text-indigo-400 uppercase tracking-widest">Key Topics:</h4>
              <div class="flex flex-wrap gap-1">
                ${m.topics.map(t => `<span class="px-2 py-0.5 bg-slate-900/60 border border-indigo-950 text-[10px] text-slate-300 rounded font-medium text-black-p print-card">${t}</span>`).join('')}
              </div>
            </div>

            <div class="space-y-2 pt-2">
              <h4 class="text-3xs font-extrabold text-indigo-400 uppercase tracking-widest">Interactive Action Items:</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                ${getActionItemsHtml(m.actionItems)}
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pathfinder AI - ${roadmap.jobTitle} Career Roadmap</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #050b14;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
    }
    .text-glow {
      text-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
    }
    @media print {
      body {
        background-color: #ffffff !important;
        color: #0f172a !important;
      }
      .no-print {
        display: none !important;
      }
      .print-card {
        border: 1px solid #e2e8f0 !important;
        background-color: #ffffff !important;
        color: #0f172a !important;
        box-shadow: none !important;
      }
      .text-black-p {
        color: #0f172a !important;
      }
      .border-light-p {
        border-color: #e2e8f0 !important;
      }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col p-4 sm:p-8 md:p-12 selection:bg-indigo-600 selection:text-white">

  <!-- Main Container -->
  <div class="max-w-5xl mx-auto w-full space-y-8">
    
    <!-- Header -->
    <header class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-indigo-950/60 border-light-p">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        </div>
        <div>
          <span class="text-[10px] font-extrabold uppercase bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent tracking-widest block font-mono">Personalized Career Strategy</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight -mt-0.5 text-black-p">Pathfinder AI Plan</h1>
        </div>
      </div>

      <!-- User Badge -->
      <div class="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-indigo-950/60 rounded-2xl shrink-0 print-card">
        <div class="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold font-mono">
          RS
        </div>
        <div class="text-left">
          <span class="text-[9px] uppercase font-bold text-slate-500 block leading-none">Verified Candidate Profile</span>
          <span class="text-xs font-bold text-indigo-200 mt-0.5 block font-mono text-black-p">rihanshaik855@gmail.com</span>
        </div>
      </div>
    </header>

    <!-- Top Action Controls (hidden on Print) -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-950/10 p-4 rounded-2xl border border-indigo-500/10 no-print">
      <div class="text-slate-400 text-xs flex items-center gap-2">
        <span class="text-lg">💡</span>
        <span>This premium roadmap supports offline self-study. Checked action items auto-save to your offline browser memory.</span>
      </div>
      <button onclick="window.print()" class="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
        Print / Save as PDF
      </button>
    </div>

    <!-- Overview Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      <!-- Primary Core Info (Spans 4) -->
      <div class="lg:col-span-4 bg-slate-900/60 border border-indigo-950/60 rounded-3xl p-6 flex flex-col justify-between print-card">
        <div>
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-400 text-3xs font-extrabold uppercase tracking-widest bg-slate-950 px-2 py-1 rounded">Target Role</span>
            <span class="text-indigo-400 text-xs font-mono font-bold">${roadmap.difficultyLevel}</span>
          </div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight text-glow text-black-p">${roadmap.jobTitle}</h2>
          <p class="text-indigo-400 font-bold text-xxs mt-2 font-mono">Estimated Prep Level: ${roadmap.estimatedRemainingTime}</p>
          
          <div class="my-5 border-t border-indigo-950/40 pt-4 space-y-4">
            <div>
              <span class="text-indigo-400 font-extrabold text-3xs uppercase tracking-widest block mb-1">Academic CGPA Feedback</span>
              <p class="text-xs text-slate-300 leading-relaxed text-black-p">${roadmap.gapAnalysis.cgpaFeedback}</p>
            </div>
            
            <div>
              <span class="text-indigo-400 font-extrabold text-3xs uppercase tracking-widest block mb-1">Recruiter Interview Strategy</span>
              <p class="text-xs text-slate-300 leading-relaxed text-black-p">${roadmap.gapAnalysis.interviewPreparationAdvice}</p>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-indigo-950/40 text-[10px] text-slate-500 font-mono">
          Plan Compiled: ${new Date().toLocaleDateString()}
        </div>
      </div>

      <!-- Strengths & Gaps (Spans 8) -->
      <div class="lg:col-span-8 bg-slate-900/60 border border-indigo-950/60 rounded-3xl p-6 flex flex-col justify-between print-card">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div class="space-y-4">
            <div class="flex items-center gap-2 border-b border-indigo-950/40 pb-2 border-light-p">
              <svg class="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
              <h3 class="font-bold text-white text-sm text-black-p">Identified Candidate Strengths</h3>
            </div>
            <div class="space-y-2">
              ${roadmap.gapAnalysis.resumeStrengths.map(s => `
                <div class="flex items-start gap-2 text-xs text-slate-300 text-black-p">
                  <span class="text-indigo-400 mt-0.5">•</span>
                  <span>${s}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-2 border-b border-indigo-950/40 pb-2 border-light-p">
              <svg class="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <h3 class="font-bold text-white text-sm text-black-p">Critical Bridging Gaps</h3>
            </div>
            <div class="space-y-2">
              ${roadmap.gapAnalysis.missingSkills.map(s => `
                <div class="flex items-start gap-2 text-xs text-slate-300 text-black-p">
                  <span class="text-violet-400 mt-0.5">•</span>
                  <span>${s}</span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <div class="mt-6 pt-4 border-t border-indigo-950/40 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 text-xs flex gap-2 items-center print-card">
          <span class="text-indigo-400">⚡</span>
          <span class="text-slate-300 leading-relaxed text-black-p">
            <strong>Target Bridge Priority:</strong> Your milestones below prioritizes building skills for <strong class="text-white text-black-p">${roadmap.gapAnalysis.missingSkills[0] || 'critical industry expectations'}</strong>.
          </span>
        </div>
      </div>

    </div>

    <!-- Timeline & Milestones Header -->
    <div class="text-center pt-4">
      <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight text-black-p">Course Timeline & Milestone Actions</h2>
      <p class="text-slate-400 mt-1 text-xs">Execute these step-by-step milestones to satisfy recruiter benchmark expectations.</p>
    </div>

    <!-- Milestones List -->
    <div class="space-y-6">
      ${getMilestonesHtml()}
    </div>

    <!-- Footer -->
    <footer class="pt-8 border-t border-indigo-950/60 border-light-p flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
      <span>Generated by Pathfinder AI Career Architect</span>
      <span>Verified Profile ID: <strong class="text-slate-400 text-black-p">rihanshaik855@gmail.com</strong></span>
    </footer>

  </div>

  <!-- Interactive script to save checking state offline in local storage -->
  <script>
    const STORAGE_KEY = "offline_roadmap_tasks_" + "${roadmap.jobTitle.replace(/\s+/g, "_")}";
    let completedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // Initialize state
    document.addEventListener("DOMContentLoaded", () => {
      // Restore cached checks from background
      completedTasks.forEach(id => {
        const checkbox = document.getElementById('offline_task_' + id);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    });

    function toggleTaskOffline(id) {
      const idx = completedTasks.indexOf(id);
      if (idx > -1) {
        completedTasks.splice(idx, 1);
      } else {
        completedTasks.push(id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTasks));
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${roadmap.jobTitle.replace(/\s+/g, "_")}_premium_roadmap.html`;
    link.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div id="app_root" className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header id="app_header" className="border-b border-indigo-950 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Compass className="h-6 w-6 text-white stroke-[2.5]" id="pathfinder_compass" />
          </div>
          <div>
            <span className="text-2xs font-extrabold uppercase bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent tracking-widest block">AI Career Architect</span>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight -mt-0.5">Pathfinder AI</h1>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20 font-semibold animate-pulse">V2.4</span>
            </div>
          </div>
        </div>

        {/* Verified User Profile Feature for rihanshaik855@gmail.com */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/80 border border-indigo-950 rounded-xl" id="user_profile_badge">
          <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold font-mono">
            RS
          </div>
          <div className="text-left hidden xs:block">
            <span className="text-[9px] uppercase font-bold text-slate-500 block leading-none">Verified Candidate Profile</span>
            <span className="text-xs font-bold text-indigo-200 mt-0.5 block font-mono">rihanshaik855@gmail.com</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" title="Connected Session" />
        </div>

        <div className="flex items-center gap-3">
          {roadmap && (
            <>
              {showForm ? (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex items-center gap-2 px-3.5 py-1.5 border border-slate-705 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg transition-all"
                  id="btn_back_to_roadmap"
                >
                  <Compass className="h-3.5 w-3.5 text-indigo-400" /> Back to Roadmap
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 border border-indigo-500/30 hover:border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-400 rounded-lg transition-all"
                  id="btn_edit_inputs"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-400" /> Generate Another / Edit
                </button>
              )}
              <button
                type="button"
                onClick={downloadSummaryText}
                className="hidden md:flex items-center gap-2 px-3.5 py-1.5 border border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg transition-all"
                id="btn_download"
                title="Download text file summary"
              >
                <Download className="h-3.5 w-3.5" /> Export Plan
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-3.5 py-1.5 border border-rose-900/30 hover:border-rose-800/50 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-semibold text-rose-400 rounded-lg transition-all"
                id="btn_reset"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Start Over
              </button>
            </>
          )}
          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-block text-2xs font-semibold text-slate-400 hover:text-white transition-all bg-slate-800/30 border border-slate-800 px-3 py-1.5 rounded-lg"
          >
            Built for Google AI Studio
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main id="main_container" className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Error message Banner */}
        {error && (
          <div id="error_banner" className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex gap-3 text-sm items-start">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Generation Failed</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:text-white bg-slate-800/80 rounded-md px-2 py-1 transition-all"
            >
              Clear
            </button>
          </div>
        )}

        {/* MODE 1: THE INPUT WORKSPACE PANEL */}
        {(!roadmap || showForm) && (
          <div id="input_workspace" className="max-w-4xl mx-auto w-full space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 py-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Interactive Roadmap Engine
              </div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
                Bridge the Gap to Your Dream Role
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Provide your CGPA, key expertise, and the target role criteria. Pathfinder AI will leverage Gemini to deliver an interactive step-by-step milestone bento dashboard complete with tailored resources.
              </p>
            </div>

            {/* Form using Bento cards layout for beautiful aesthetic */}
            <form onSubmit={generateRoadmap} className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Box 1: Academic Standing & Personal Info */}
              <div className="md:col-span-4 bg-slate-800/60 border border-slate-750 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-950/40">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-indigo-400" />
                      <h3 className="font-bold text-white text-base">Academic Score</h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900/40 px-2.5 py-1 rounded">CGPA Context</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-semibold text-slate-300">Grade / CGPA</label>
                        <div className="flex gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => { setDegreeScale("10"); setCgpa("8.5"); }}
                            className={`px-1.5 py-0.5 rounded ${degreeScale === "10" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-slate-500"}`}
                          >
                            10.0 Scale
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDegreeScale("4"); setCgpa("3.4"); }}
                            className={`px-1.5 py-0.5 rounded ${degreeScale === "4" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-slate-500"}`}
                          >
                            4.0 Scale
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={degreeScale === "10" ? 10 : 4}
                        step="0.01"
                        required
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900/80 border border-indigo-950/60 rounded-lg text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Degree & Year Context</label>
                      <textarea
                        value={extraContext}
                        onChange={(e) => setExtraContext(e.target.value)}
                        placeholder="e.g. 3rd Year B.Tech CSE, focused on Cloud electives."
                        rows={3}
                        className="w-full px-3.5 py-2 bg-slate-900/80 border border-indigo-950/60 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-indigo-955 mt-4 text-[11px] text-slate-450 flex items-start gap-1.5 leading-relaxed">
                  <HelpCircle className="h-4 w-4 text-indigo-450 shrink-0 mt-0.5" />
                  <span>
                    Your CGPA drives custom suggestions on whether to emphasize resume metrics or projects to shadow scores.
                  </span>
                </div>
              </div>

              {/* Box 2: Your Knowledge Inventory */}
              <div className="md:col-span-8 bg-slate-800/60 border border-slate-750 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-950/40">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-indigo-400" />
                      <h3 className="font-bold text-white text-base">Key Knowledge & Current Skills</h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900/40 px-2.5 py-1 rounded">What You Know</span>
                  </div>

                  {/* Skills tags field */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a known skill & press Enter"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        className="flex-1 px-3.5 py-2 bg-slate-900/80 border border-indigo-950/60 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkill(skillInput)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs border border-indigo-500/30 hover:border-indigo-550/55 rounded-lg transition-all"
                      >
                        Add
                      </button>
                    </div>

                    {/* Active skill cloud */}
                    <div className="p-3 bg-slate-900/40 rounded-xl min-h-[60px] flex flex-wrap gap-1.5 border border-indigo-950/60">
                      {skillsList.length === 0 ? (
                        <span className="text-slate-500 text-xs italic p-1">No skills added yet. Add skills to map gaps.</span>
                      ) : (
                        skillsList.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-lg"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(i)}
                              className="text-indigo-400/60 hover:text-white ml-0.5 focus:outline-none"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Pre defined quick selection tags */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Quick add commonly known:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {SKILL_SUGGESTIONS.map((skill) => {
                          const hasit = skillsList.some(s => s.toLowerCase() === skill.toLowerCase());
                          return (
                            <button
                              key={skill}
                              type="button"
                              disabled={hasit}
                              onClick={() => handleAddSkill(skill)}
                              className={`px-2 py-0.5 border rounded-md text-[10px] transition-all ${
                                hasit
                                  ? "bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed"
                                  : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              +{skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-700/30 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Strategy Engine:</span> Your skills will represent your baseline profile, while the target criteria will define recommendations.
                </div>
              </div>

              {/* Box 3: Target Job Description / Aspirations (Spans 12 col or 8) */}
              <div className="md:col-span-12 bg-slate-800/60 border border-slate-750 rounded-3xl p-6 space-y-4 hover:border-indigo-500/30 transition-all shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-indigo-950/40 gap-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-base">Desired Job / Aspiration Details</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900/40 px-2.5 py-1 rounded inline-self-start">Target Target</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">Job Description Analysis criteria</label>
                    <textarea
                      required
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste details of the role or company description here. For example: 'Backend Python Engineer position at Stripe. Experience with API frameworks, performance bottleneck identification, and database optimization techniques is expected...'"
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-900/80 border border-indigo-950/60 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="lg:col-span-4 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block mb-1.5">Fill with standard template requirements:</span>
                      <div className="space-y-2">
                        {PRESET_JDS.map((preset, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => fillTemplate(preset.desc)}
                            className="w-full p-2.5 bg-slate-900/60 border border-slate-850 rounded-xl hover:border-indigo-500/30 hover:bg-slate-900 text-left transition-all text-2xs group"
                          >
                            <p className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                              {preset.role} <ChevronRight className="h-3 w-3" />
                            </p>
                            <p className="text-slate-400 mt-1 line-clamp-2 leading-relaxed">{preset.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Trigger Box */}
                <div className="pt-4 border-t border-indigo-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-450">
                    Your Gemini API calls are made server-side. Review or manage credentials via Settings {">"} Secrets.
                  </div>
                  <div className="flex gap-2 items-center w-full sm:w-auto">
                    {roadmap && (
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="w-full sm:w-auto px-5 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-sm rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading || skillsList.length === 0}
                      className={`w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-extrabold text-sm rounded-xl hover:from-indigo-455 hover:to-violet-555 shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 shrink-0 ${
                        (isLoading || skillsList.length === 0) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Formulating Roadmap Blueprint...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-white" />
                          Aquire Path Strategy
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </form>
          </div>
        )}

        {/* MODE 2: GENERATED BENTO GRID ROADMAP */}
        {roadmap && !showForm && (
          <div id="roadmap_bento_grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Row 1, Column Span 3: Standing Metrics (CGPA Bento) */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-750 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-all bento-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <GraduationCap className="h-40 w-40 text-indigo-400" />
              </div>

              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-2xs font-extrabold uppercase tracking-widest bg-slate-950/50 px-2 py-1 rounded">Metrics Context</span>
                  <span className="text-indigo-400 text-xs font-mono font-bold">{cgpa}</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">CGPA Status</h2>
                
                {/* Visual score display or tier */}
                <p className="text-indigo-400 text-xs font-bold mt-2 uppercase tracking-wide">
                  {parseFloat(cgpa) >= 8.5 || parseFloat(cgpa) >= 3.6 ? "High Academic Standings" : "Advancement Recommended"}
                </p>
                
                <p className="text-slate-300 text-xs mt-3 leading-relaxed border-t border-indigo-950/50 pt-3">
                  {roadmap.gapAnalysis.cgpaFeedback}
                </p>
              </div>

              {/* Rihanshaik Profile reference in Bento card 1 */}
              <div className="mt-4 p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xxs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <div className="truncate">
                  <span className="text-slate-400 text-[10px] block font-semibold leading-none">CANDIDATE</span>
                  <span className="text-slate-200 font-mono font-bold truncate block mt-0.5" title="rihanshaik855@gmail.com">
                    rihanshaik855@gmail.com
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-2xs mb-1.5 text-slate-400 font-semibold uppercase">
                  <span>Profile Preparedness</span>
                  <span>{progressStats.percentage}% Ready</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressStats.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Row 1, Column Span 5: Target Role & Prep Time indicator Bento */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-755 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all bento-card relative group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-2xs font-extrabold uppercase tracking-widest bg-slate-950/45 px-2 py-1 rounded">Target Insights</span>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
                      {roadmap.difficultyLevel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 bg-slate-950/60 p-4 rounded-2xl border border-indigo-950 shadow-inner mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-extrabold text-sm truncate">{roadmap.jobTitle}</p>
                    <p className="text-indigo-300 text-xxs truncate">Estimated preparation: {roadmap.estimatedRemainingTime}</p>
                  </div>
                </div>

                <div>
                   <h4 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider mb-2">Focused Interview Advice</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {roadmap.gapAnalysis.interviewPreparationAdvice}
                  </p>
                </div>
              </div>

              {/* Progress counter pill */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Checklist Tasks completed:</span>
                <span className="font-bold text-indigo-400 px-2 py-0.5 bg-slate-950 rounded font-mono border border-indigo-950/60">
                  {progressStats.completed} / {progressStats.total}
                </span>
              </div>
            </div>

            {/* Row 1, Column Span 4: Skill Gaps Analysis Bento */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-755 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all bento-card">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 text-2xs font-extrabold uppercase tracking-widest bg-slate-950/45 px-2 py-1 rounded">Skill Map Contrast</span>
                  <span className="text-violet-400 text-xxs font-mono font-semibold uppercase">Real-Time Comparison</span>
                </div>

                <div className="space-y-4">
                  {/* Matching Strengths */}
                  <div>
                    <h4 className="text-2xs font-extrabold text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 shrink-0" /> Your Baseline Strengths
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {roadmap.gapAnalysis.resumeStrengths.map((str, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-950 border border-indigo-500/20 text-slate-300 rounded-md text-[10px] font-medium leading-normal">
                          {str}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Identified Gaps to close */}
                  <div>
                    <h4 className="text-2xs font-extrabold text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 shrink-0" /> Target Skill Gaps
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {roadmap.gapAnalysis.missingSkills.length === 0 ? (
                        <span className="text-slate-500 text-xxs italic">No major skill gaps identified! Excellent.</span>
                      ) : (
                        roadmap.gapAnalysis.missingSkills.map((gap, i) => (
                          <span key={i} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md text-[10px] font-semibold leading-normal">
                            {gap}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom focus banner */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <span className="text-slate-400 font-extrabold text-2xs uppercase tracking-wide block mb-1">Critical Roadmap Focus</span>
                <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                  <p className="text-indigo-400 text-[11px] leading-relaxed">
                    Closed preparation steps priority is adjusted towards: <strong className="text-white bg-slate-950/60 px-1.5 py-0.5 border border-indigo-950/50 rounded">{roadmap.gapAnalysis.missingSkills[0] || "Advanced Core Mastery"}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Row 2, Column Span 8: Accelerated Milestones List (Interactive learning tracks) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-755 rounded-3xl p-6 hover:border-indigo-500/30 transition-all bento-card flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-indigo-950/40 pb-4 mb-6 gap-3">
                <div>
                  <h3 className="text-white font-extrabold text-lg flex items-center gap-1.5">
                    <Compass className="h-5 w-5 text-indigo-400 animate-pulse" /> Your Interactive Roadmap Milestones
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Click any phase label to load specific Action tasks & resource libraries.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-slate-950 rounded-lg text-xxs text-slate-400 font-mono">
                    Total: {roadmap.milestones.length} Phases
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 items-stretch">
                
                {/* Milestone Side-List */}
                <div className="md:col-span-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {roadmap.milestones.map((m, index) => {
                    const isSelected = m.id === selectedMilestoneId;
                    
                    // calculate completed tasks for this milestone specifically
                    const mileTasks = m.actionItems;
                    const doneMileTasks = mileTasks.filter(item => completedTaskIds.includes(item.id)).length;
                    const isAllDone = mileTasks.length > 0 && doneMileTasks === mileTasks.length;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMilestoneId(m.id)}
                        className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-start gap-3 relative overflow-hidden group ${
                          isSelected
                            ? "bg-slate-950 border-indigo-500 text-white shadow-md shadow-indigo-500/5"
                            : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-indigo-500/30 hover:bg-slate-900"
                        }`}
                      >
                        {/* Step Connection Bar for UI path */}
                        {index < roadmap.milestones.length - 1 && (
                          <div className="absolute left-[25px] top-[46px] w-0.5 h-12 bg-slate-800 group-hover:bg-slate-700 hidden md:block" />
                        )}

                        <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center font-mono font-bold text-xs mt-0.5 ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : isAllDone
                              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/35"
                              : "bg-slate-800 text-slate-405"
                        }`}>
                          {isAllDone ? <Check className="h-3 w-3" /> : index + 1}
                        </div>

                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex justify-between items-start">
                            <span className={`text-[9px] uppercase font-bold tracking-wider ${
                              isSelected ? "text-indigo-405 text-indigo-400" : "text-slate-500"
                            }`}>
                              {m.duration}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono font-semibold">
                              {doneMileTasks}/{mileTasks.length} Done
                            </span>
                          </div>
                          <p className="font-extrabold text-slate-200 text-xs sm:text-sm truncate mt-0.5">{m.title}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Milestone Active Details Panel Container */}
                <div className="md:col-span-7 bg-slate-950/40 p-5 rounded-2xl border border-indigo-950/60 flex flex-col justify-between">
                  {activeMilestone ? (
                    <div className="space-y-4">
                      {/* Active Milestone Title */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-extrabold uppercase text-[9px] tracking-wider rounded border border-indigo-500/20">
                            {activeMilestone.duration}
                          </span>
                          <span className="text-xxs text-slate-400">Phase Identifier: {activeMilestone.id}</span>
                        </div>
                        <h4 className="text-white font-extrabold text-base leading-tight">{activeMilestone.title}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed mt-1.5">{activeMilestone.description}</p>
                      </div>

                      {/* Recommendation Rationale */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-indigo-950 text-[11px] text-slate-300 leading-relaxed italic">
                        <span className="font-bold text-indigo-400 uppercase tracking-wide text-3xs block mb-1">Recruiter Coach Note:</span>
                        {activeMilestone.recommendationReason}
                      </div>

                      {/* Topics To Understand list */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Acquisition Checklist:</span>
                        <div className="flex flex-wrap gap-1">
                          {activeMilestone.topics.map((top, stepi) => (
                            <span key={stepi} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-[10px] rounded font-medium">
                              {top}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Action Item Checklists */}
                      <div className="space-y-2 border-t border-indigo-950/40 pt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Required Action Items:</span>
                        <div className="space-y-1.5">
                          {activeMilestone.actionItems.map((ai) => {
                            const isDone = completedTaskIds.includes(ai.id);
                            return (
                              <div
                                key={ai.id}
                                onClick={() => toggleTaskCompletion(ai.id)}
                                className={`flex items-start gap-2.5 p-2 bg-slate-900/60 rounded-lg border hover:border-indigo-500/30 transition-all cursor-pointer group select-none ${
                                  isDone ? "border-indigo-500/20 bg-indigo-550/[0.01]" : "border-slate-800"
                                }`}
                              >
                                <button
                                  type="button"
                                  className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-all ${
                                    isDone
                                      ? "bg-indigo-600 border-indigo-650 text-white"
                                      : "border-slate-600 group-hover:border-indigo-500 bg-slate-950"
                                  }`}
                                >
                                  {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs text-slate-200 leading-relaxed font-sans ${isDone ? "line-through text-slate-500" : ""}`}>
                                    {ai.task}
                                  </p>
                                </div>
                                <span className="text-3xs bg-slate-950 px-1.5 py-0.5 rounded text-slate-405 text-slate-500 font-mono font-semibold shrink-0">
                                  {ai.estimatedHours}h
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs italic">Select a phase to view target items</div>
                  )}
                </div>

              </div>
            </div>

            {/* Row 2, Column Span 4: Recommended Resource Hub Bento */}
            <div className="lg:col-span-4 bg-gradient-to-b from-indigo-950/60 to-slate-950 text-white border border-indigo-500/25 rounded-3xl p-6 hover:border-indigo-400/40 transition-all bento-card flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-indigo-300 text-2xs font-extrabold uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">Study Materials</span>
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-extrabold text-2xl tracking-tight leading-none text-white">Resource Repository</h3>
                <p className="mt-2 text-slate-400 text-xs font-semibold leading-relaxed">
                  Highly specific documentation, classes or guides hand-picked to support current phase gaps.
                </p>

                {/* Resource List */}
                <div className="space-y-2.5 mt-6 max-h-[300px] overflow-y-auto pr-1">
                  {activeMilestone && activeMilestone.keyResources.length > 0 ? (
                    activeMilestone.keyResources.map((res, i) => {
                      const getIcon = (type: string) => {
                        switch (type?.toLowerCase()) {
                          case "video":
                            return <Video className="h-4 w-4 text-indigo-300" />;
                          case "documentation":
                          case "article":
                            return <FileText className="h-4 w-4 text-indigo-300" />;
                          default:
                            return <BookOpen className="h-4 w-4 text-indigo-300" />;
                        }
                      };

                      return (
                        <a
                          key={i}
                          href={res.url.startsWith("http") ? res.url : `https://google.com/search?q=${encodeURIComponent(res.url)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block bg-slate-900/60 hover:bg-slate-900/80 p-3 rounded-2xl border border-indigo-950 hover:border-indigo-500/20 transition-all outline-none"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 bg-indigo-500/10 rounded-lg shrink-0 mt-0.5 border border-indigo-500/20">
                              {getIcon(res.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-white leading-normal truncate group-hover:underline">
                                {res.title}
                              </p>
                              <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest block mt-0.5">
                                {res.type || "Source"} • Link
                              </span>
                            </div>
                            <ExternalLink className="h-3 w-3 text-indigo-400 shrink-0 mt-1" />
                          </div>
                        </a>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-indigo-200/30 text-xs italic">
                      Select a phase to list customized material options automatically.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick tip */}
              <div className="text-xxs text-slate-400 border-t border-indigo-950/60 pt-4 mt-4 leading-relaxed">
                Tip: Non-HTML links search via Google query matching. Use accurate documentation pointers.
              </div>
            </div>

            {/* Row 3, Column Span 12: High Level Strategy summary */}
            <div className="lg:col-span-12 bg-slate-900 border border-indigo-950/60 rounded-3xl p-6 hover:border-indigo-550/30 transition-all min-h-[100px] flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shrink-0">
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-extrabold text-sm tracking-wide uppercase">General Preparation Sequence</h4>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  {roadmap.overallStrategy}
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer id="app_footer" className="border-t border-slate-900 bg-slate-950/20 py-6 text-center text-xs text-slate-500 shrink-0 mt-12">
        <p>© 2026 Pathfinder AI Career Strategist. Fully responsive client-side checklist persistence enabled.</p>
      </footer>
    </div>
  );
}
