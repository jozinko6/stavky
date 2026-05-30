/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Match, 
  AIPrediction, 
  MatchStatus, 
  PredictionStatus, 
  RiskLevel, 
  PlacementAdvice, 
  ScraperLog 
} from "./types";
import PredictionCard from "./components/PredictionCard";
import { 
  TrendingUp, 
  Sparkles, 
  Activity, 
  Calendar, 
  BarChart3, 
  FileText, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Database, 
  BookOpen, 
  Sliders, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Cpu,
  Calculator,
  Flame,
  Info
} from "lucide-react";

export default function App() {
  // Sidebar Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "live" | "archive" | "ai-strategy" | "stats" | "scrapers">("dashboard");

  // State Store
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [scraperLogs, setScraperLogs] = useState<ScraperLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Filtering & Selection
  const [archiveDate, setArchiveDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedPrediction, setSelectedPrediction] = useState<AIPrediction | null>(null);
  const [activeSportFilter, setActiveSportFilter] = useState<string>("Všetky");
  const [activeRiskFilter, setActiveRiskFilter] = useState<string>("Všetky");
  
  // Loaders
  const [loadingMatches, setLoadingMatches] = useState<boolean>(false);
  const [analyzingMatchId, setAnalyzingMatchId] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [scraping, setScraping] = useState<boolean>(false);
  const [importQuery, setImportQuery] = useState<string>("Niké Liga");
  const [importing, setImporting] = useState<boolean>(false);

  // Success alert states
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Load everything on mount
  useEffect(() => {
    fetchData();
  }, []);

  const triggerAlert = (text: string, type: "success" | "error" | "info" = "success") => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const fetchData = async () => {
    setLoadingMatches(true);
    try {
      const [resMatches, resPreds, resLogs, resStats] = await Promise.all([
        fetch("/api/matches").then(r => r.json()),
        fetch("/api/predictions").then(r => r.json()),
        fetch("/api/logs").then(r => r.json()),
        fetch("/api/stats").then(r => r.json())
      ]);

      setMatches(resMatches || []);
      setPredictions(resPreds || []);
      setScraperLogs(resLogs || []);
      setStats(resStats || null);
    } catch (err) {
      console.error("Chyba pri načítaní dát zo servera", err);
      triggerAlert("Chyba pri spojení s backend serverom. Použite simulované prostredie.", "error");
    } finally {
      setLoadingMatches(false);
    }
  };

  // Legally triggers manual scraping / data reload simulation
  const handleRunScraper = async () => {
    setScraping(true);
    try {
      const response = await fetch("/api/scraper/run", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        triggerAlert(`Dátový zberač úspešne dobehol. Pridaný nový zápas: ${data.newMatch.homeTeam} - ${data.newMatch.awayTeam}`);
        fetchData();
      }
    } catch (err) {
      triggerAlert("Chyba scraper modulu.", "error");
    } finally {
      setScraping(false);
    }
  };

  // Triggers real online import of matches via Google Search Grounding
  const handleImportRealMatches = async (queryText: string) => {
    setImporting(true);
    try {
      const response = await fetch("/api/scraper/import-real-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchQuery: queryText })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        triggerAlert(data.message, "success");
        fetchData();
      } else {
        triggerAlert(data.error || "Nepodarilo sa stiahnuť reálne zápasy. Skontrolujte kľúč GEMINI_API_KEY v Settings.", "error");
      }
    } catch (err) {
      triggerAlert("Zlyhala sieťová komunikácia počas importu skutočných zápasov.", "error");
    } finally {
      setImporting(false);
    }
  };

  // Automated evaluator triggering
  const handleRunEvaluator = async () => {
    setEvaluating(true);
    try {
      const response = await fetch("/api/predictions/evaluate", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        triggerAlert(`Vyhodnotenie dokončené! Vyhodnotených zápasov: ${data.evaluatedCount}`);
        fetchData();
      }
    } catch (err) {
      triggerAlert("Chyba vyhodnocovacieho modulu.", "error");
    } finally {
      setEvaluating(false);
    }
  };

  // Single Match Gemini AI analyze call
  const handleAnalyzeMatch = async (matchId: string) => {
    setAnalyzingMatchId(matchId);
    try {
      const response = await fetch("/api/ai/analyze-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })
      });
      const data = await response.json();
      if (data.prediction) {
        triggerAlert("AI úspešne vygenerovala pravdepodobnostný tip v slovenskom jazyku!");
        // Automatically view details of the newly created tip
        setSelectedPrediction(data.prediction);
        fetchData();
      } else {
        triggerAlert(data.error || "Nepodarilo sa vytvoriť predikciu.", "error");
      }
    } catch (err) {
      triggerAlert("Zlyhala komunikácia s AI modelom.", "error");
    } finally {
      setAnalyzingMatchId(null);
    }
  };

  // Filter outcomes
  const getFilteredMatches = () => {
    return matches.filter(m => {
      // Sport filter
      if (activeSportFilter !== "Všetky" && m.sport !== activeSportFilter) return false;
      
      // Tab alignment
      if (activeTab === "live") return m.status === MatchStatus.LIVE;
      if (activeTab === "dashboard") return m.status !== MatchStatus.FINISHED;
      
      return true;
    });
  };

  const getPredictionForMatch = (matchId: string) => {
    return predictions.find(p => p.matchId === matchId);
  };

  // Get archive predictions filter
  const getArchivePredictions = () => {
    return predictions.filter(p => {
      const dateMatches = p.dateTime.startsWith(archiveDate);
      const sportMatches = activeSportFilter === "Všetky" || p.sport === activeSportFilter;
      const riskMatches = activeRiskFilter === "Všetky" || p.riskLevel === activeRiskFilter;
      return dateMatches && sportMatches && riskMatches;
    });
  };

  // ROI / Rating colors
  const getRoiColor = (roi: number) => {
    if (roi > 10) return "text-emerald-600 font-extrabold";
    if (roi > 0) return "text-green-600 font-bold";
    if (roi < 0) return "text-rose-600 font-bold";
    return "text-slate-600";
  };

  return (
    <div id="betarchitect-app-container" className="min-h-screen bg-[#f1f5f9] text-[#1e293b] flex shadow-inner">
      
      {/* 1. SIDEBAR - Stays fixed on desktop adhering to 'Professional Polish' */}
      <aside className="w-68 bg-[#0f172a] text-[#f8fafc] flex flex-col justify-between shrink-0 border-r border-[#1e293b] relative z-20 shadow-xl">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-[#1e293b] flex flex-col gap-1">
            <div className="flex items-center space-x-2">
              <span className="p-1 px-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-lg text-sm font-black font-display tracking-tight shadow-md">
                BA
              </span>
              <span className="font-display font-extrabold text-lg bg-gradient-to-r from-white via-indigo-200 to-indigo-100 bg-clip-text text-transparent tracking-tighter">
                BETARCHITECT AI
              </span>
            </div>
            <p className="text-4xs text-[#94a3b8] tracking-widest font-mono mt-1">SLOVAK PRESTIGE ANALYTICS</p>
          </div>

          {/* Navigation Items */}
          <nav className="mt-6 px-3 space-y-1">
            <button
              id="nav-dashboard"
              onClick={() => { setActiveTab("dashboard"); setSelectedPrediction(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${
                activeTab === "dashboard" 
                  ? "bg-[#1e293b] text-white border-l-4 border-indigo-500" 
                  : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white"
              }`}
            >
              <TrendingUp size={16} className={activeTab === "dashboard" ? "text-indigo-400" : ""} />
              <span>Dnešné kurzy & tipy</span>
            </button>

            <button
              id="nav-live"
              onClick={() => { setActiveTab("live"); setSelectedPrediction(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${
                activeTab === "live" 
                  ? "bg-[#1e293b] text-white border-l-4 border-indigo-500" 
                  : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white"
              }`}
            >
              <Activity size={16} className={activeTab === "live" ? "text-red-400 animate-pulse" : ""} />
              <span className="flex-1 text-left">Live stávky</span>
              <span className="text-4xs font-bold font-mono px-2 py-0.5 rounded-sm bg-red-600 text-white animate-bounce">
                {matches.filter(m => m.status === MatchStatus.LIVE).length}
              </span>
            </button>

            <button
              id="nav-archive"
              onClick={() => { setActiveTab("archive"); setSelectedPrediction(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${
                activeTab === "archive" 
                  ? "bg-[#1e293b] text-white border-l-4 border-indigo-500" 
                  : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white"
              }`}
            >
              <Calendar size={16} className={activeTab === "archive" ? "text-indigo-400" : ""} />
              <span>História & Archív</span>
            </button>

            <button
              id="nav-stats"
              onClick={() => { setActiveTab("stats"); setSelectedPrediction(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${
                activeTab === "stats" 
                  ? "bg-[#1e293b] text-white border-l-4 border-indigo-500" 
                  : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white"
              }`}
            >
              <BarChart3 size={16} className={activeTab === "stats" ? "text-indigo-400" : ""} />
              <span>Úspešnosť & Štatistiky</span>
            </button>

            <button
              id="nav-ai-strategy"
              onClick={() => { setActiveTab("ai-strategy"); setSelectedPrediction(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${
                activeTab === "ai-strategy" 
                  ? "bg-[#1e293b] text-white border-l-4 border-indigo-500" 
                  : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white"
              }`}
            >
              <BookOpen size={16} className={activeTab === "ai-strategy" ? "text-indigo-400" : ""} />
              <span>AI Stratégia & Pravidlá</span>
            </button>

            <button
              id="nav-scrapers"
              onClick={() => { setActiveTab("scrapers"); setSelectedPrediction(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer ${
                activeTab === "scrapers" 
                  ? "bg-[#1e293b] text-white border-l-4 border-indigo-500" 
                  : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white"
              }`}
            >
              <Sliders size={16} className={activeTab === "scrapers" ? "text-indigo-400" : ""} />
              <span>Zber dát & Logy</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: System Configuration health & indicators */}
        <div className="p-4 border-t border-[#1e293b] bg-[#0c1222] text-xs">
          <div className="text-4xs text-[#475569] font-bold tracking-widest uppercase mb-2">INTEGRÁCIA SYSTÉMOV</div>
          <div className="space-y-1.5 font-mono text-3xs text-[#94a3b8]">
            <div className="flex justify-between items-center">
              <span>Zber (Scraping):</span>
              <span className="text-emerald-400 font-bold flex items-center">● AKTÍVNY</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Google Gemini:</span>
              <span className="text-emerald-400 font-bold flex items-center">● PRIPOJENÝ</span>
            </div>
            <div className="flex justify-between items-center" title="Local transactional SQLite simulation inside disk DB">
              <span>Databáza:</span>
              <span className="text-[#6366f1] font-bold">SQLITE-PROXY</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1e293b] text-4xs text-[#475569] text-center">
            Verzia MVP v1.2 | GMT 2026
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKING SPACE */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        
        {/* Dynamic global warning banner for success/fail logs */}
        {alertMessage && (
          <div className={`p-3.5 text-center text-xs font-black text-white flex items-center justify-center space-x-2 transition-all duration-300 ${
            alertMessage.type === "success" ? "bg-indigo-600" : alertMessage.type === "error" ? "bg-rose-600" : "bg-amber-600"
          }`}>
            <ShieldCheck size={16} className="animate-spin" />
            <span>{alertMessage.text}</span>
          </div>
        )}

        {/* Top bar header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 shrink-0 flex items-center justify-between shadow-xs">
          <div>
            <h1 className="font-display font-extrabold text-slate-800 tracking-tight text-lg">
              {activeTab === "dashboard" && "Dnešné kurzy & Predzápasovové AI Analýzy"}
              {activeTab === "live" && "Live stávky a priebežný stav v slovenskom stávkovom priestore"}
              {activeTab === "archive" && "Kalendárny archív všetkých výsledkov a tipov"}
              {activeTab === "stats" && "Výkonnosť, úspešnosť ratingov & ROI kalkulácia"}
              {activeTab === "ai-strategy" && "Konfigurácia inteligentnej Gemini prompter architektúry"}
              {activeTab === "scrapers" && "Riadenie dátových zberateľov a robotických scraperov"}
            </h1>
            <p className="text-3xs text-slate-400 font-bold uppercase tracking-wider">
              {activeTab === "dashboard" && `${getFilteredMatches().length} aktívnych športových stretnutí`}
              {activeTab === "live" && "Reálny čas, live kurzy Tipsport, Fortuna & Niké"}
              {activeTab === "archive" && "Archív a spätná uveriteľnosť bez mýlenia faktov"}
              {activeTab === "stats" && "Udržateľný manažment kapitálu a zodpovedné stávkovanie"}
              {activeTab === "ai-strategy" && "Legálny model, transparentnosť dát a prompt design"}
              {activeTab === "scrapers" && "Napojenie na slovenské zdroje a logovanie compliance stavov"}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-evaluate"
              onClick={handleRunEvaluator}
              disabled={evaluating}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-black text-slate-700 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Skontroluje skončené zápasy, načíta výsledok a vyhodnotí úspešnosť tipu"
            >
              {evaluating ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <ShieldCheck size={14} className="text-indigo-600" />
              )}
              <span>Spracovať vyhodnotenie</span>
            </button>

            <button
              id="btn-scraping-top"
              onClick={handleRunScraper}
              disabled={scraping}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-black text-white transition flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="Spustí legálny zber dát"
            >
              {scraping ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Database size={14} />
              )}
              <span>Legálny Zber dát (Fortuna/Niké)</span>
            </button>
            
            <button 
              onClick={fetchData} 
              disabled={loadingMatches}
              className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              <RefreshCw size={14} className={loadingMatches ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* Outer body */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* TAB 1 & 2: DASHBOARD & LIVE */}
          {(activeTab === "dashboard" || activeTab === "live") && (
            <div className="space-y-6">
              
              {/* Filter tabs above matches */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center mr-2">
                    <Filter size={13} className="mr-1 text-slate-400" /> Filter Športu:
                  </span>
                  {["Všetky", "Futbal", "Hokej", "Tenis"].map(sport => (
                    <button
                      key={sport}
                      onClick={() => setActiveSportFilter(sport)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeSportFilter === sport 
                          ? "bg-indigo-600 text-white shadow-xs" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>

                <div className="text-3xs text-slate-400 font-mono italic">
                  *Všetky analýzy sú pravdepodobnostné. Nikdy nestávkujte peniaze, ktoré si nemôžete dovoliť stratiť.
                </div>
              </div>

              {/* Sekcia importovania skutočných zápasov cez Google Search Grounding */}
              <div className="bg-gradient-to-r from-slate-900 to-[#1e293b] text-white p-5 rounded-2xl border border-indigo-500/25 shadow-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-widest font-mono">
                      <Sparkles size={14} className="text-violet-400" />
                      <span>Online AI Scraper (Zápasy z reálneho sveta)</span>
                    </div>
                    <h2 className="text-sm font-extrabold tracking-tight">Zdajú sa vám zápasy v simulátore nezmyselné alebo neaktuálne?</h2>
                    <p className="text-3xs text-slate-300 font-medium">
                      Naša AI dokáže prostredníctvom <strong className="text-[#a5b4fc]">Google Search Grounding</strong> prehľadať internet v reálnom čase! Získajte najnovšie skutočné zápasy s reálnymi kurzami pre akúkoľvek ligu na svete.
                    </p>
                  </div>
                  
                  {/* Vyhľadávací formulár */}
                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Napr. Niké Liga, Roland Garros..."
                        value={importQuery}
                        onChange={(e) => setImportQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                    <button
                      onClick={() => handleImportRealMatches(importQuery)}
                      disabled={importing || !importQuery}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm shrink-0 cursor-pointer text-white"
                    >
                      {importing ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Vyhľadávam...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>Importovať zápasy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Rýchle tagy */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-4xs text-slate-400 font-bold uppercase tracking-widest font-mono">Odporúčané dopyty:</span>
                  {[
                    { label: "⚽ Slovenská Niké liga", q: "Slovenská Niké liga zápasy dnešok" },
                    { label: "🏒 Tipos Extraliga", q: "Tipos Extraliga hokej zápasy dnešok" },
                    { label: "🎾 Roland Garros (Tenis)", q: "French Open Roland Garros zápasy dnešok" },
                    { label: "🏆 Liga Majstrov (UEFA)", q: "Liga majstrov UEFA zápasy" }
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => {
                        setImportQuery(btn.q);
                        handleImportRealMatches(btn.q);
                      }}
                      disabled={importing}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-3xs font-bold text-slate-200 transition cursor-pointer disabled:opacity-50"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Cards Grid */}
              {loadingMatches ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-slate-200/60 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-semibold text-slate-600">Sťahujú sa športové kurzy slovenskej scény...</p>
                </div>
              ) : getFilteredMatches().length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60 flex flex-col items-center justify-center p-6">
                  <AlertCircle size={40} className="text-amber-500 mb-3" />
                  <p className="text-base font-bold text-slate-800">Nenašli sa žiadne vyhovujúce zápasy</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Pre tento šport filter momentálne nie sú zaznamenané prebiehajúce ani nadchádzajúce stretnutia. Kliknite na legálny zber dát na pridanie nových zápasov na dnes.
                  </p>
                  <button 
                    onClick={handleRunScraper} 
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition"
                  >
                    Simulovať reálny zber kurzov
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {getFilteredMatches().map(match => (
                    <div key={match.id}>
                      <PredictionCard
                        match={match}
                        prediction={getPredictionForMatch(match.id)}
                        onAnalyze={handleAnalyzeMatch}
                        onViewDetails={(predId) => {
                          const pred = predictions.find(p => p.id === predId);
                          if (pred) setSelectedPrediction(pred);
                        }}
                        isLoading={analyzingMatchId === match.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ARCHIVE */}
          {activeTab === "archive" && (
            <div className="space-y-6">
              
              {/* Archive Filters panel */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  
                  <div>
                    <label className="block text-3xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Zvoľte kalendárny deň</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={archiveDate}
                        onChange={(e) => setArchiveDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-indigo-500 text-slate-700 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-3xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Šport</label>
                    <select 
                      value={activeSportFilter}
                      onChange={(e) => setActiveSportFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 font-bold bg-white focus:outline-indigo-500"
                    >
                      <option value="Všetky">Všetky športy</option>
                      <option value="Futbal">Futbal</option>
                      <option value="Hokej">Hokej</option>
                      <option value="Tenis">Tenis</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-3xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Rizikovosť</label>
                    <select
                      value={activeRiskFilter}
                      onChange={(e) => setActiveRiskFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 font-bold bg-white focus:outline-indigo-500"
                    >
                      <option value="Všetky">Všetky riziká</option>
                      <option value={RiskLevel.LOW}>{RiskLevel.LOW}</option>
                      <option value={RiskLevel.MEDIUM}>{RiskLevel.MEDIUM}</option>
                      <option value={RiskLevel.HIGH}>{RiskLevel.HIGH}</option>
                    </select>
                  </div>

                  <div className="text-right">
                    <button 
                      onClick={() => setArchiveDate(new Date().toISOString().split("T")[0])}
                      className="w-full md:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Dnes ({new Date().toISOString().split("T")[0]})
                    </button>
                  </div>

                </div>
              </div>

              {/* Archive Results Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold font-display text-slate-800">Predikčné tipy za deň: {archiveDate}</span>
                  <span className="text-3xs font-mono text-slate-400 uppercase font-bold bg-white p-1 px-2.5 rounded-sm">
                    Počet nájdených: {getArchivePredictions().length}
                  </span>
                </div>

                {getArchivePredictions().length === 0 ? (
                  <div className="text-center py-20 bg-white">
                    <Calendar size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-500">Pre zvolený deň ({archiveDate}) neboli zaznamenané žiadne predikcie.</p>
                    <p className="text-3xs text-slate-400 max-w-md mx-auto mt-1">
                      Môžete vybrať iný dátum, zredukovať filtre športov, alebo prejsť na panel Dnes, vytvoriť analýzy pomocou AI, a po skončení zápasov stlačiť “Spracovať vyhodnotenie”.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="p-4 text-3xs uppercase font-black tracking-wider text-slate-500">Zápas / Čas</th>
                          <th className="p-4 text-3xs uppercase font-black tracking-wider text-slate-500">Súťaž</th>
                          <th className="p-4 text-3xs uppercase font-black tracking-wider text-slate-500">Zvolený trh</th>
                          <th className="p-4 text-3xs uppercase font-black tracking-wider text-slate-500">Odporúčanie</th>
                          <th className="p-4 text-3xs uppercase font-black tracking-wider text-slate-500">Kurz</th>
                          <th className="p-4 text-3xs uppercase font-black tracking-wider text-slate-500">Riziko</th>
                          <th className="p-4 text-3xs uppercase font-black tracking-wider text-slate-500 text-center">AI úspešnosť</th>
                          <th className="p-4 text-3xs uppercase font-black tracking-wider text-slate-500 text-right">Stav vyhodnotenia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getArchivePredictions().map(pred => {
                          const matchObj = matches.find(m => m.id === pred.matchId);
                          return (
                            <tr key={pred.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-4">
                                <div className="font-bold text-slate-800 text-xs">{pred.matchName}</div>
                                <div className="text-3xs text-amber-600 font-mono uppercase font-semibold">{pred.sport}</div>
                              </td>
                              <td className="p-4 font-semibold text-[#64748b] text-3xs uppercase">{pred.league}</td>
                              <td className="p-4 text-xs font-semibold text-[#1e293b]">{pred.marketName}</td>
                              <td className="p-4">
                                <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-sm">
                                  {pred.recommendedTip}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-black text-slate-800 text-xs">@ {pred.recommendedOdds.toFixed(2)}</td>
                              <td className="p-4">
                                {pred.riskLevel === RiskLevel.LOW && (
                                  <span className="p-1 px-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-sm text-3xs font-semibold">Nízke</span>
                                )}
                                {pred.riskLevel === RiskLevel.MEDIUM && (
                                  <span className="p-1 px-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-sm text-3xs font-semibold">Stredné</span>
                                )}
                                {pred.riskLevel === RiskLevel.HIGH && (
                                  <span className="p-1 px-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-sm text-3xs font-semibold">Vysoké</span>
                                )}
                              </td>
                              <td className="p-4 text-center font-mono text-xs font-bold text-indigo-600">{pred.confidenceScore}%</td>
                              <td className="p-4 text-right">
                                {pred.status === PredictionStatus.WON && (
                                  <span className="p-1 px-2.5 bg-green-100 text-green-800 text-3xs font-extrabold rounded-md border border-green-200">WON (Uhraté)</span>
                                )}
                                {pred.status === PredictionStatus.LOST && (
                                  <span className="p-1 px-2.5 bg-rose-100 text-rose-800 text-3xs font-extrabold rounded-md border border-rose-200">LOST (Prehrané)</span>
                                )}
                                {pred.status === PredictionStatus.VOID && (
                                  <span className="p-1 px-2.5 bg-slate-100 text-slate-600 text-3xs font-extrabold rounded-md">VOID (Storno)</span>
                                )}
                                {pred.status === PredictionStatus.UNKNOWN && (
                                  <button
                                    onClick={() => setSelectedPrediction(pred)}
                                    className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-md text-3xs font-bold cursor-pointer transition ease-in-out"
                                  >
                                    Čaká na zápas / Detaily
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STATS & PERFORMANCE */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              
              {/* Standard Performance indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="text-3xs font-bold text-slate-400 uppercase tracking-widest">Zisk / Profit (10€ na tip)</div>
                  <div className={`text-2xl font-black font-display tracking-tight mt-1 ${stats?.totalProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {stats?.totalProfit >= 0 ? "+" : ""}{stats?.totalProfit?.toFixed(2) || "0.00"} €
                  </div>
                  <div className="text-4xs text-slate-400 mt-1">Celková suma teoretických stávok</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="text-3xs font-bold text-slate-400 uppercase tracking-widest text-[#64748b]">CELKOVÝ ROI (Návratnosť investície)</div>
                  <div className={`text-2xl font-black font-display tracking-tight mt-1 ${getRoiColor(stats?.roi || 0)}`}>
                    {stats?.roi || "0.0"} %
                  </div>
                  <div className="text-4xs text-[#10b981] mt-1 font-semibold">↑ Sľubný dlhodobý vývoj</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="text-3xs font-bold text-slate-400 uppercase tracking-widest text-[#64748b]">ÚSPEŠNOSŤ AI TIPOV (WIN RATE)</div>
                  <div className="text-2xl font-black font-display tracking-tight text-slate-800 mt-1">
                    {stats?.winRate || "0.0"} %
                  </div>
                  <div className="text-4xs text-[#64748b] mt-1">Bez započítania stornovaných tiketov (VOID)</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="text-3xs font-bold text-slate-400 uppercase tracking-widest">AKTÍVNE / CELKOVÉ TIPY</div>
                  <div className="text-2xl font-black font-display tracking-tight text-slate-800 mt-1">
                    {stats?.activeTips || 0} / {stats?.totalTips || 0}
                  </div>
                  <div className="text-4xs text-slate-400 mt-1">Tipy čakajúce na dohratie a schválenie výsledku</div>
                </div>
              </div>

              {/* Grid with tables and visualization */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sport breakdown */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-display font-extrabold text-[#0f172a] text-sm">Analýza úspešnosti podľa Športu</h3>
                    <p className="text-3xs text-slate-400 font-bold uppercase mt-0.5">Slovenská hokejová, futbalová liga a tenis</p>
                  </div>

                  <div className="space-y-4">
                    {stats?.sportsBreakdown?.map((spBreakdown: any) => (
                      <div key={spBreakdown.sport} className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-xs text-slate-800">
                            {spBreakdown.sport === "Futbal" ? "⚽ " : spBreakdown.sport === "Hokej" ? "🏒 " : "🎾 "}
                            {spBreakdown.sport}
                          </span>
                          <span className="font-mono text-xs font-black text-indigo-600">ROI: {spBreakdown.roi}%</span>
                        </div>
                        <div className="flex justify-between text-3xs text-[#64748b] mb-1 font-mono">
                          <span>Vyhodnotených tipov: {spBreakdown.total}</span>
                          <span>Úspešnosť: {spBreakdown.successRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${spBreakdown.successRate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {(!stats?.sportsBreakdown || stats.sportsBreakdown.length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-6">Žiadne vyhodnotené športy pre štatistiky.</p>
                    )}
                  </div>
                </div>

                {/* Risk assessment overview */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-display font-extrabold text-[#0f172a] text-sm">Korelácia Rizikovosti & Úspešnosti</h3>
                    <p className="text-3xs text-slate-400 font-bold uppercase mt-0.5">Pravidlová kontrola miery rizika versus reálna prax</p>
                  </div>

                  <div className="space-y-4">
                    {stats?.riskBreakdown?.map((rkBreakdown: any) => (
                      <div key={rkBreakdown.riskLevel} className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-xs text-slate-800 flex items-center">
                            <Flame size={12} className="mr-1 text-indigo-500" />
                            {rkBreakdown.riskLevel}
                          </span>
                          <span className="font-mono text-xs font-black text-slate-700">Win rate: {rkBreakdown.successRate}%</span>
                        </div>
                        <div className="flex justify-between text-3xs text-[#64748b] mb-1 font-mono">
                          <span>Tipy: {rkBreakdown.total}</span>
                          <span>Zberatef ROI: {rkBreakdown.roi}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          {/* Choose bar color by risk */}
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              rkBreakdown.riskLevel.includes("Nízke") ? "bg-emerald-500" :
                              rkBreakdown.riskLevel.includes("Stredné") ? "bg-amber-500" : "bg-red-500"
                            }`} 
                            style={{ width: `${rkBreakdown.successRate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {(!stats?.riskBreakdown || stats.riskBreakdown.length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-6">Zatiaľ nie sú vyhodnotené žiadne tipy.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Responsible betting guide Slovak */}
              <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100/60 p-5 mt-6 flex items-start space-x-4">
                <ShieldCheck size={28} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display font-bold text-sm text-indigo-900">Upozornenie o rizikách a zodpovednom tipovaní</h4>
                  <p className="text-xs text-indigo-950/80 mt-1 leading-relaxed">
                    Tento automatizovaný analytický software je vyvíjaný ako podporná pomôcka na analýzu historických a live športových eventov slovenskej scény. Všetky výpočty, percentuálne odhady a vyhodnotenia majú čisto štatistickú/pravdepodobnostnú povahu. Nikdy nepredpokladajte 100% istotu úspechu. Zodpovedné hranie (Responsible Gaming) je hlavný stavebný kameň tohto herného analytického modulu. Osobám mladším ako 18 rokov je hazardné hranie zákonom SR prísne zakázané.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI STRATEGY & DIALOGUE WITH GEMINI */}
          {activeTab === "ai-strategy" && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Cpu size={24} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-slate-800 tracking-tight text-base">Architektúra prepojenia Google Gemini API</h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Srdcom nášho systému je integrácia s modelom <code className="bg-slate-100 font-mono text-3xs p-0.5 px-1.5 text-indigo-600">gemini-3.5-flash</code>. Umožňuje plne automatizovanú transformáciu neštruktúrovaných športových dát o historických formách celkov a kurzov od slovenských stávkových kancelárií do inteligentných tipov.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-xs text-slate-700 mb-1">Žiadna manipulácia ochrany webov</h4>
                    <p className="text-3xs text-slate-500">
                      Naše riešenie legálne sleduje verejne dostupné feedy alebo povolené API. Neporušuje CAPTCHA kontroly ani nezdieľa herné session cookies tretím stranám.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-xs text-slate-700 mb-1">Slovenská jazyková lokalizácia</h4>
                    <p className="text-3xs text-slate-500">
                      Gemini prostredníctvom prísneho <code className="text-3xs font-mono">responseSchema</code> formátuje výstup priamo v materinskom jazyku pre slovenské publikum vrátane gramatiky.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-xs text-slate-700 mb-1">Hodnotenia rizika na základe reality</h4>
                    <p className="text-3xs text-slate-500">
                      Každému tipu je striktne definovaný jeden z troch stavov po uvážení bookmakerovej marže a zmeny vypísaných kurzov.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prompt configuration template viewer */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold font-display text-slate-800">Systémové Inštrukcie (System Prompt) pre Google Gemini</span>
                  <span className="p-1 px-2.5 bg-[#0f172a] text-white text-3xs font-mono rounded-md">COMPLIANT SCHEMA</span>
                </div>
                <div className="p-5 font-mono text-xs bg-slate-900 text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-96">
{`Si profesionálny športový analytik a full-stack expert so zameraním na slovenské stávkové trhy.
Tvojou úlohou je vygenerovať hĺbkovú pravdepodobnostnú analýzu a tip pre zadaný zápas.

UPOZORNENIE: Výstupy nesmú tvrdiť, že tip je stopercentný alebo istý. Každý tip musí obsahovať mieru rizika a jasné upozornenie, že ide o analýzu založenú na pravdepodobnosti.

Nasleduj tieto pravidlá pre tvorbu analýzy:
1. Analyzuj silné a slabé stránky tímov, vzájomné zápasy, aktuálnu formu z textového popisu zápasu.
2. Urči najlepší stávkový trh (napr. "Hlavný zápas (1X2)", "Oba tímy dajú gól", etc.) a tip.
3. Zarad tip do kategórie rizika: "Nízke riziko", "Stredné riziko" alebo "Vysoké riziko".
4. Odporuč prístup: "Pridať na tiket pre-match" alebo "Sledovať live a staviť v priebehu".
5. Uveď 3 logické, faktické dôvody na základe férovej pravdepodobnosti.
6. Urči pravdepodobnostné skóre úspešnosti od 0 do 100.`}
                </div>
              </div>

              {/* Gemini SDK call simulation helper */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                <h3 className="font-display font-extrabold text-[#0f172a] text-sm mb-3">Model a API kľúč</h3>
                <div className="p-4 rounded-xl bg-indigo-50/20 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-indigo-900 uppercase">Status API Kľúča</p>
                    <p className="text-3xs text-slate-500 mt-1 max-w-md">
                      Pokiaľ je nastavený kľúč v **Secrets** pod symbolom `GEMINI_API_KEY`, systém vykoná reálne volanie s asynchrónnym streamom na serveri. Pokiaľ chýba, aplikácia používa pokročilý slovenský expertný pravidlový generátor.
                    </p>
                  </div>
                  <div>
                    {process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" ? (
                      <span className="p-1 px-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                        AKTÍVNY V SECRETS
                      </span>
                    ) : (
                      <span className="p-1 px-3 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200" title="Volania budú presmerované na pravidlový lokálny generátor">
                        FALLBACK_ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: SCRAPER CONTROLLER & LOG MONITOR */}
          {activeTab === "scrapers" && (
            <div className="space-y-6">
              
              {/* Compliance card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-[#0f172a] text-sm">Legálny a bezpečný zber dát</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Zberače dát pracujú v súlade s direktívami robots.txt a rešpektujú verejný prístup na weboch slovenských stávkových kancelárií (Fortuna, Niké, Tipsport). Systém nestahuje dáta agresívne, obsahuje umelé spomalenie (sleep delay 1000ms), čím zabraňuje preťaženiu serverov (rate-limiting) a úplne sa vyhýba obchádzaniu technických ochrán (CAPTCHA, login bypass).
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#0f172a] uppercase mb-1">Simulovať hodinový zber pre-match stávok</h4>
                    <p className="text-3xs text-slate-400">Načíta zoznam zápasov, ich čas, ligu a aktuálne kurzy a vytvorí snapshot v databáze.</p>
                  </div>
                  <button
                    onClick={handleRunScraper}
                    disabled={scraping}
                    className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {scraping ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Sťahujem futbal, hokej, tenis...</span>
                      </>
                    ) : (
                      <>
                        <Database size={14} />
                        <span>Spustiť pre-match scraper</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#0f172a] uppercase mb-1">Spustiť automatické vyhodnocovanie</h4>
                    <p className="text-3xs text-slate-400">Porovná reálne dosiahnuté skóre s odporúčaným AI tipom a označí ho ako WON alebo LOST.</p>
                  </div>
                  <button
                    onClick={handleRunEvaluator}
                    disabled={evaluating}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {evaluating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Porovnávam s výsledkovou tabuľou...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Vyhodnotiť tikety</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Scraper Logs List */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold font-display text-slate-800">Denník udalostí (Scraper logs)</span>
                  <span className="p-1 px-2 text-indigo-700 bg-indigo-50 border border-indigo-100 font-mono text-4xs rounded-md">LIVE LOG ENGINE</span>
                </div>

                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {scraperLogs.map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between space-x-3">
                      <div className="flex items-start space-x-2.5">
                        <span className={`p-1 rounded-md text-3xs font-bold shrink-0 ${log.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                          {log.status}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{log.message}</p>
                          <p className="text-4xs text-slate-400 mt-0.5 font-mono">Zdroj: {log.source} | Synchronizovaných položiek: {log.itemsProcessed}</p>
                        </div>
                      </div>
                      <span className="text-4xs text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString("sk-SK")}
                      </span>
                    </div>
                  ))}
                  {scraperLogs.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-6">Zatiaľ nie sú zaznamenané žiadne logy.</p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer detailing disclaimer */}
        <footer className="h-12 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-4xs text-[#94a3b8] shrink-0">
          <div>BETARCHITECT AI nie je prevádzkovateľom hazardných hier. Analýzy sú informatívneho charakteru. Hrajte zodpovedne.</div>
          <div className="font-mono">Serverový čas: 2026-05-30 CET</div>
        </footer>

      </main>

      {/* 3. DYNAMIC RIGHT PRE-MATCH / POST-MATCH DETAILED DRAWER */}
      {selectedPrediction && (
        <div id="ai-detail-drawer" className="fixed inset-y-0 right-0 w-80 lg:w-96 bg-white shadow-2xl border-l border-slate-200/85 z-50 flex flex-col justify-between animate-slide-in duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-[#0f172a] text-white flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-1">
                <Sparkles size={14} className="text-indigo-400 animate-spin-slow" />
                <span className="text-4xs uppercase tracking-widest font-bold text-indigo-300">Detailná AI Analýza</span>
              </div>
              <h3 className="font-display font-black text-xs mt-0.5 truncate max-w-64" title={selectedPrediction.matchName}>
                {selectedPrediction.matchName}
              </h3>
            </div>
            <button
              onClick={() => setSelectedPrediction(null)}
              className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-md transition cursor-pointer font-bold text-xs"
            >
              ZAVRIEŤ
            </button>
          </div>

          {/* Drawer Body - Scrollable content */}
          <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-[#1e293b]">
            
            {/* Event identifiers */}
            <div className="grid grid-cols-2 gap-2 text-3xs font-mono bg-slate-50 p-2.5 rounded-lg">
              <div>
                <span className="block text-slate-400 uppercase tracking-widest">Šport</span>
                <span className="font-bold text-slate-700">{selectedPrediction.sport}</span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase tracking-widest">Liga</span>
                <span className="font-bold text-slate-700 truncate block" title={selectedPrediction.league}>{selectedPrediction.league}</span>
              </div>
            </div>

            {/* Tip Value badge bar */}
            <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-4xs text-indigo-700 uppercase tracking-wider font-extrabold block">Vybraný trh a Tip</span>
                <span className="font-black text-sm text-indigo-950 mt-1 block">{selectedPrediction.marketName}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-[#1e293b] text-base">
                  {selectedPrediction.recommendedTip}
                </span>
                <span className="block text-4xs text-slate-500 mt-0.5 font-bold">@ {selectedPrediction.recommendedOdds.toFixed(2)}</span>
              </div>
            </div>

            {/* Confidence Score meter */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-3xs font-bold uppercase text-slate-400 tracking-wider">
                <span>Pravdepodobnostné Skóre AI</span>
                <span className="font-mono text-indigo-600 text-xs">{selectedPrediction.confidenceScore} / 100</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-2 rounded-full" 
                  style={{ width: `${selectedPrediction.confidenceScore}%` }}
                ></div>
              </div>
            </div>

            {/* Risk details */}
            <div>
              <span className="block text-3xs font-black uppercase text-slate-400 tracking-widest mb-1">Miera rizika</span>
              {selectedPrediction.riskLevel === RiskLevel.LOW && (
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-950">
                  <span className="font-bold">Nízke riziko</span>: Stabilný zápas so silným historickým podkladom. Odporúča sa na AKO tiket.
                </div>
              )}
              {selectedPrediction.riskLevel === RiskLevel.MEDIUM && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 text-amber-950">
                  <span className="font-bold">Stredné riziko</span>: Vyvážené šance, dôležitá motivácia. Vhodné ako sólo stávka.
                </div>
              )}
              {selectedPrediction.riskLevel === RiskLevel.HIGH && (
                <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100 text-rose-950">
                  <span className="font-bold">Vysoké riziko</span>: Atraktívny kurz s vyššou hernou neistotou. Skôr na okrajové sledovanie.
                </div>
              )}
            </div>

            {/* Reasons block */}
            <div className="space-y-2">
              <span className="block text-3xs font-black uppercase text-slate-400 tracking-widest">Kľúčové dôvody pre tip</span>
              <ul className="space-y-2">
                {selectedPrediction.reasons.map((r, i) => (
                  <li key={i} className="flex space-x-2 items-start bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    <CheckCircle2 size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Structured decisions data */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="block text-3xs font-black uppercase text-slate-400 tracking-widest">Použité vstupné dáta</span>
              
              {selectedPrediction.keyDataUsed?.formRatio && (
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="block text-4xs font-bold text-slate-400 uppercase">Zhodnotenie formy</span>
                  <p className="text-slate-700 font-medium mt-0.5">{selectedPrediction.keyDataUsed.formRatio}</p>
                </div>
              )}

              {selectedPrediction.keyDataUsed?.headToHeadSentiment && (
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="block text-4xs font-bold text-slate-400 uppercase">Vzájomné zápasy</span>
                  <p className="text-slate-700 font-medium mt-0.5">{selectedPrediction.keyDataUsed.headToHeadSentiment}</p>
                </div>
              )}

              {selectedPrediction.keyDataUsed?.importanceOfMatch && (
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="block text-4xs font-bold text-slate-400 uppercase">Ligový kontext</span>
                  <p className="text-slate-700 font-medium mt-0.5">{selectedPrediction.keyDataUsed.importanceOfMatch}</p>
                </div>
              )}
            </div>

            {/* Outcome evaluation status */}
            {selectedPrediction.status !== PredictionStatus.UNKNOWN && (
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <span className="text-4xs uppercase tracking-wider font-extrabold block text-indigo-900">Výsledný stav tipu</span>
                <span className="font-bold text-xs text-indigo-950 mt-1 block font-mono">
                  {selectedPrediction.evaluationReason || "Tip bol úspešne vyhodnotený."}
                </span>
              </div>
            )}

            {/* Placement Recommendation */}
            <div className="p-3 bg-slate-900 text-slate-300 rounded-xl">
              <span className="block text-4xs font-extrabold uppercase tracking-wider text-slate-400">Tactical placement recommendation:</span>
              <p className="font-bold text-xs mt-1 text-white">{selectedPrediction.placementAdvice}</p>
            </div>

          </div>

          {/* Prompt warning & confirmation footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-4xs text-slate-400 italic">
              Zverejnené: {new Date(selectedPrediction.createdAt).toLocaleString("sk-SK")} | Spravodlivá stávková pravdepodobnosť
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
