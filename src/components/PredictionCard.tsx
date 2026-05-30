/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Match, 
  AIPrediction, 
  PredictionStatus, 
  RiskLevel, 
  MatchStatus 
} from "../types";
import { 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  Calendar,
  Sparkles,
  HelpCircle
} from "lucide-react";

interface PredictionCardProps {
  match: Match;
  prediction?: AIPrediction;
  onAnalyze: (matchId: string) => void;
  onViewDetails: (predictionId: string) => void;
  isLoading: boolean;
}

export default function PredictionCard({
  match,
  prediction,
  onAnalyze,
  onViewDetails,
  isLoading
}: PredictionCardProps) {
  
  // Format Date and Time nicely in Slovak
  const formatMatchTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("sk-SK", {
        day: "numeric",
        month: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  // Helper for sport icon
  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case "futbal":
        return "⚽";
      case "hokej":
        return "🏒";
      case "tenis":
        return "🎾";
      default:
        return "🏆";
    }
  };

  // Label and styling for Risk
  const getRiskBadge = (risk?: RiskLevel) => {
    if (!risk) return null;
    switch (risk) {
      case RiskLevel.LOW:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {RiskLevel.LOW}
          </span>
        );
      case RiskLevel.MEDIUM:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
            {RiskLevel.MEDIUM}
          </span>
        );
      case RiskLevel.HIGH:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert size={12} className="mr-1" />
            {RiskLevel.HIGH}
          </span>
        );
    }
  };

  // Evaluation status badges
  const getStatusBadge = (status: PredictionStatus) => {
    switch (status) {
      case PredictionStatus.WON:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 shadow-xs">
            <CheckCircle size={12} className="mr-1 animate-bounce" /> VÝHRA
          </span>
        );
      case PredictionStatus.LOST:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-xs">
            <XCircle size={12} className="mr-1" /> PREHRA
          </span>
        );
      case PredictionStatus.VOID:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            VRÁTENÉ VKLAD (VOID)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock size={12} className="mr-1 animate-spin" /> ČAKÁ SA NA KONIEC
          </span>
        );
    }
  };

  return (
    <div id={`match-card-${match.id}`} className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Top Bar: Sport, League, Status */}
      <div className="p-4 bg-slate-50/50 flex justify-between items-center border-b border-slate-100/80">
        <div className="flex items-center space-x-2">
          <span className="text-xl" role="img" aria-label="sport">{getSportIcon(match.sport)}</span>
          <span className="text-xs font-mono text-slate-500 font-semibold uppercase tracking-wider">{match.league}</span>
        </div>
        <div>
          {match.status === MatchStatus.LIVE ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-extrabold bg-red-500 text-white animate-pulse">
              <Activity size={10} className="mr-1 animate-spin" /> LIVE {match.currentMinute}' ({match.currentPeriod})
            </span>
          ) : match.status === MatchStatus.FINISHED ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-200 text-slate-700">
              URADNÝ KONIEC
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Calendar size={10} className="mr-1" /> OD {formatMatchTime(match.dateTime)}
            </span>
          )}
        </div>
      </div>

      {/* Hero: Teams & Current Scores */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="mb-4">
          <div className="text-center font-display font-bold text-slate-800 tracking-tight text-lg mb-2 flex items-center justify-center space-x-2">
            <span className="flex-1 text-right truncate" title={match.homeTeam}>{match.homeTeam}</span>
            <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-600 font-mono">
              {match.status !== MatchStatus.SCHEDULED ? (
                <span className="font-bold text-slate-900">{match.homeScore} : {match.awayScore}</span>
              ) : (
                "VS"
              )}
            </span>
            <span className="flex-1 text-left truncate" title={match.awayTeam}>{match.awayTeam}</span>
          </div>
          {match.status === MatchStatus.LIVE && match.liveStats && (
            <div className="text-3xs text-center font-mono text-slate-400 mt-1 bg-slate-50 py-1 rounded-sm">
              Držanie: {match.liveStats.possession} | Strely: {match.liveStats.shots}
            </div>
          )}
        </div>

        {/* Prediction Segment if exists */}
        {prediction ? (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-3xs text-slate-400 uppercase tracking-widest font-bold">Odporúčaný trh</p>
                <p className="text-xs font-semibold text-slate-800">{prediction.marketName}</p>
              </div>
              <div className="text-right">
                <p className="text-3xs text-slate-400 uppercase tracking-widest font-bold">Hodnota tipu</p>
                <p className="text-sm font-black text-indigo-600 font-mono focus:outline-none">
                  {prediction.recommendedTip} <span className="text-xs text-slate-500 font-normal">@ {prediction.recommendedOdds.toFixed(2)}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 items-center">
              <div>
                {getRiskBadge(prediction.riskLevel)}
              </div>
              {/* Score Meter */}
              <div className="flex items-center justify-end space-x-1.5">
                <div className="text-right">
                  <p className="text-4xs text-slate-400 uppercase font-black">Dôvera AI</p>
                  <p className="text-xs font-black text-slate-700 font-mono">{prediction.confidenceScore}%</p>
                </div>
                <div className="w-12 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${prediction.confidenceScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button 
                id={`btn-view-${match.id}`}
                onClick={() => onViewDetails(prediction.id)}
                className="w-full text-center px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>Podrobná AI Analýza</span>
                <TrendingUp size={12} />
              </button>
              {match.status === MatchStatus.FINISHED && (
                <div className="flex items-center justify-center">
                  {getStatusBadge(prediction.status)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-indigo-50/20 border border-dashed border-indigo-100 rounded-xl flex flex-col items-center justify-center">
            <Sparkles size={24} className="text-indigo-400 mb-2 animate-pulse" />
            <p className="text-xs text-slate-500 mb-3 font-semibold">Tento zápas nemá vyhodnotený žiadny AI tip.</p>
            <button
              id={`btn-analyze-${match.id}`}
              onClick={() => onAnalyze(match.id)}
              disabled={isLoading}
              className={`px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-xs font-black hover:from-indigo-700 hover:to-indigo-800 transition shadow-xs cursor-pointer flex items-center space-x-2 ${
                isLoading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>AI počíta pravdepodobnosti...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="animate-spin" />
                  <span>Spracovať AI Analýzu</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
