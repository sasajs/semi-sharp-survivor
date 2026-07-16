/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, Button } from './ui';
import { 
  BookOpen, 
  Cpu, 
  Database, 
  Scale, 
  User, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  GitMerge, 
  Layers, 
  Activity, 
  TrendingUp, 
  Heart, 
  Calendar,
  BookmarkCheck,
  Zap,
  HelpCircle,
  TrendingDown
} from 'lucide-react';

export const WhySemiSharp: React.FC = () => {

  return (
    <div className="space-y-24 py-6 animate-fade-in font-sans">
      
      {/* SECTION 1: Why SemiSharp Exists */}
      <section className="relative overflow-hidden bg-slate-900 text-white rounded-2xl p-8 md:p-12 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Cpu className="w-64 h-64 text-slate-400" />
        </div>
        
        <div className="relative z-10 max-w-4xl space-y-6">
          <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-md uppercase tracking-wider font-mono">
            Platform Philosophy
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Why SemiSharp Exists
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed">
            SemiSharp was created to answer a simple question: <span className="text-emerald-400 font-semibold font-sans">Can survivor pool decisions be improved through research, analytics, and transparent decision-support rather than intuition or weekly opinions?</span>
          </p>
          <div className="h-px bg-slate-800 my-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-400 leading-relaxed font-normal">
            <p>
              Rather than beginning with a visual layout, SemiSharp was built from a rigorous analytical foundation outward. Every recommendation shown in the application originates from validated data, reproducible analytical models, and tested optimization strategies.
            </p>
            <p>
              The user interface exists to explain those results—not generate them. We believe in separating mathematical processing from presenting information to the end user to preserve integrity and academic rigor.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Built Like a Research Project */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 space-y-8 shadow-3xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
              Academic Foundation
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Built Like a Research Project
            </h2>
            <p className="text-xs text-slate-500 max-w-xl font-semibold">
              The project began with a systematic literature review to identify analytical methods supported by research and convert them into reproducible models.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-100 self-start">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-slate-650 leading-relaxed font-semibold">
            To establish a solid theoretical foundation, this project began with a systematic literature review of sports analytics, decision science, and optimization. The objective was to identify methods supported by research and convert them into reproducible analytical models. Topics reviewed included:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Sports Analytics', desc: 'Predictive modeling, team strength assessment, and power ratings.' },
              { title: 'Decision Science', desc: 'Quantitative decision analysis and optimization under uncertainty.' },
              { title: 'Survivor Pool Optimization', desc: 'Game-theoretic modeling of multi-stage elimination tournaments.' },
              { title: 'Sports Betting Markets', desc: 'Consensus pricing and efficiency analysis of sportsbook lines.' },
              { title: 'Risk and Uncertainty', desc: 'Injury modeling, weather hazards, and stadium location parameters.' },
              { title: 'Forecasting', desc: 'Statistical spread forecasting and simulation methodology.' },
              { title: 'Operations Research', desc: 'Pathing algorithms and resource optimization strategies.' },
              { title: 'Optimization', desc: 'Dynamic programming and sequential planning models.' },
              { title: 'Artificial Intelligence', desc: 'Machine learning feature engineering and model ensemble optimization.' }
            ].map((topic, index) => (
              <Card key={index} className="p-5 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5 mb-2">
                  <BookmarkCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="text-xs font-black text-slate-900 font-mono uppercase tracking-wide">{topic.title}</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  {topic.desc}
                </p>
              </Card>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Methodology: Systematic Literature Review (SLR)</span>
            <span className="font-bold text-slate-600">A complete annotated literature review will be published separately.</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: How SemiSharp Works */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-8 md:p-10 space-y-8 shadow-3xs">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] font-extrabold bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
            Operational Architecture
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            How SemiSharp Works
          </h2>
          <p className="text-xs text-slate-650 font-semibold leading-relaxed">
            Research ideas are transformed into analytical models, tested, refined, and ultimately presented as decision-support tools.
          </p>
        </div>

        {/* Visual Flow diagram */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 md:p-8 shadow-3xs overflow-x-auto">
          <div className="min-w-[640px] flex items-center justify-between gap-2 py-4">
            {[
              { step: 'Research', desc: 'Systematic Reviews', icon: BookOpen },
              { step: 'Validated Data', desc: 'Information Pipelines', icon: Database },
              { step: 'Feature Engineering', desc: 'Model Variables', icon: GitMerge },
              { step: 'Analytical Models', desc: 'Win Probabilities', icon: Cpu },
              { step: 'Strategy Engines', desc: 'Path Optimizers', icon: Layers },
              { step: 'Strategy Outputs', desc: 'Decision Options', icon: Activity },
              { step: 'User Interface', desc: 'Decision Support', icon: Scale }
            ].map((node, index, arr) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center text-center space-y-2 flex-1 px-1">
                  <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs relative">
                    <node.icon className="w-5 h-5" />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-[9px] font-black font-mono text-slate-900 rounded-full flex items-center justify-center border border-white">
                      {index + 1}
                    </span>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider font-mono">
                    {node.step}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold max-w-[100px]">
                    {node.desc}
                  </p>
                </div>
                {index < arr.length - 1 && (
                  <div className="text-slate-300 font-bold font-mono text-lg shrink-0 select-none">
                    →
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-center max-w-3xl mx-auto">
          <p className="text-xs text-indigo-900 leading-relaxed font-bold">
            Every recommendation shown in SemiSharp is produced using a consistent analytical process grounded in validated data, transparent decision policies, and season-long optimization. The goal is not to predict every game correctly—it is to help users make more disciplined survivor decisions.
          </p>
        </div>
      </section>

      {/* SECTION 4: The Data Behind SemiSharp */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 space-y-8 shadow-3xs">
        <div className="border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
              Information Sources
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              The Data Behind SemiSharp
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              SemiSharp integrates multiple independent, high-quality data streams rather than relying on a single dataset to inform our decision-support models.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              source: 'NFLVerse',
              icon: Calendar,
              items: ['Schedules & historical results', 'Betting lines & game metadata']
            },
            {
              source: 'Pro Football Focus',
              icon: TrendingUp,
              items: ['Team power ratings', 'Quarterback ratings & team strength']
            },
            {
              source: 'Sports Injury Central',
              icon: Heart,
              items: ['Player injury information', 'Overall team health scores']
            },
            {
              source: 'Sportsbook Market Data',
              icon: Database,
              items: ['Consensus betting spreads', 'Multi-market odds comparisons']
            },
            {
              source: 'SemiSharp Models',
              icon: Cpu,
              items: ['Projected spreads & upset risk', 'Baseline & risk-adjusted win probabilities', 'Strategy optimization models']
            }
          ].map((src, index) => {
            const Icon = src.icon;
            return (
              <Card key={index} className="p-6 border border-slate-200 bg-white hover:border-slate-300 shadow-3xs hover:shadow-2xs transition-all space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-slate-900 text-white rounded-lg">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{src.source}</h4>
                </div>
                <ul className="space-y-2.5">
                  {src.items.map((item, iIdx) => (
                    <li key={iIdx} className="flex items-start gap-2 text-xs text-slate-600 font-semibold leading-relaxed">
                      <span className="text-emerald-500 font-black select-none mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: Multiple Strategies */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-8 md:p-10 space-y-8 shadow-3xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
              Optimization Engines
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Multiple Strategies
            </h2>
            <p className="text-xs text-slate-500 max-w-xl font-semibold">
              Each strategy optimizes a different objective. SemiSharp evaluates multiple analytical approaches to suit distinct contest rules and risk levels.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl text-slate-700 border border-slate-200 self-start">
            <Zap className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: 'Current Week Highest Win',
              objective: 'Maximize Short-Term Survival',
              desc: 'Selects the team with the single highest expected win probability for the current week.'
            },
            {
              name: 'Future Value',
              objective: 'Conserve Season Capital',
              desc: 'Penalizes selections with high future utility to keep elite teams available for critical late-season weeks.'
            },
            {
              name: 'Bottom Six Road Fade',
              objective: 'Exploit Divisional Weakness',
              desc: 'Isolates and targets home teams playing against traveling bottom-tier opponents.'
            },
            {
              name: 'Market Arbitrage Exit',
              objective: 'Capitalize on Market Discrepancies',
              desc: 'Exploits mathematical inefficiencies where models suggest a significant edge over public picking consensus.'
            },
            {
              name: 'Monte Carlo',
              objective: 'Simulate Season Scenarios',
              desc: 'Simulates thousands of parallel season scenarios to maximize the overall survival probability.'
            },
            {
              name: 'Dynamic Programming',
              objective: 'Global Optimization',
              desc: 'Applies backwards induction recursively to map the mathematically optimal pick sequence across all weeks.'
            }
          ].map((strat, idx) => (
            <Card key={idx} className="p-6 bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-2xs transition-all space-y-3">
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest font-mono">
                {strat.objective}
              </span>
              <h4 className="text-sm font-black text-slate-950 font-sans">
                {strat.name}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {strat.desc}
              </p>
            </Card>
          ))}
        </div>

        <div className="bg-slate-900 text-slate-200 rounded-xl p-6 border border-slate-800 space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            Why Recommendation Workspace Exists
          </h4>
          <p className="text-xs leading-relaxed font-semibold text-slate-300">
            No single strategy is correct for every contest or user. Recommendation Workspace exists because comparing multiple analytical viewpoints often produces better decisions than relying on a single model.
          </p>
        </div>
      </section>

      {/* SECTION 6: Research-Based Decision Support */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 space-y-8 shadow-3xs">
        <div className="border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
              Aesthetic Comparisons
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Research-Based Decision Support
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              We design our models to represent disciplined decision intelligence rather than narrative-driven speculation.
            </p>
          </div>
        </div>

        {/* Side-by-Side Comparison Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: Typical Picks */}
          <div className="border border-slate-200 rounded-2xl bg-slate-50 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
              <TrendingDown className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-black text-slate-500 uppercase tracking-widest font-mono">
                Typical Weekly Picks
              </h3>
            </div>
            
            <ul className="space-y-4">
              {[
                'Focus on one week at a time without multi-week mathematical planning.',
                'Often opinion-driven based on weekly media, narrative biases, or gut feelings.',
                'Usually forces one single recommendation for all contestants.',
                'Little to no transparency regarding how selections were determined or weighted.',
                'Extremely difficult to duplicate or audit results mathematically.'
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-600 font-semibold leading-relaxed">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: SemiSharp */}
          <div className="border border-slate-900 rounded-2xl bg-slate-950 text-white p-6 md:p-8 space-y-6 shadow-md">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-black text-emerald-400 uppercase tracking-widest font-mono">
                SemiSharp
              </h3>
            </div>
            
            <ul className="space-y-4">
              {[
                'Season-long optimization utilizing sequential decision modeling.',
                'Research-driven methodology backed by quantitative decision science.',
                'Model-validated recommendations based on objective data points.',
                'Multiple competing strategies accommodating various risk profiles.',
                'Transparent methodology showing risk assessments and probabilities openly.',
                'Reproducible analytics ensuring mathematical consistency.',
                'Entry-specific recommendations adapting to your remaining team list.',
                'Contest-aware optimization catering dynamically to diverse format rules.'
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-300 font-semibold leading-relaxed">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* SECTION 7: About the Project */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-8 md:p-10 space-y-8 shadow-3xs">
        <div className="border-b border-slate-200 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
              The Researcher
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              About the Project
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              The analytical platform behind SemiSharp is developed within an active academic research setting.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
          {/* Left Column: Portrait Card */}
          <div className="w-full md:w-auto shrink-0 flex justify-center">
            <div className="w-48 h-48 md:w-56 md:h-56 relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
              <img 
                src="/steve_portrait.jpg" 
                alt="Portrait of Steve Schilhabel" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Column: Biography & Narrative */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 font-sans tracking-tight">Steve Schilhabel</h3>
                <p className="text-xs font-black text-slate-500 font-mono uppercase tracking-wider mt-1">
                  Professor of Information Systems
                </p>
                <p className="text-sm text-indigo-700 font-bold mt-0.5">
                  University of Wisconsin Oshkosh
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-650 leading-relaxed font-semibold">
                <p>
                  SemiSharp combines academic research, software engineering, data analytics, optimization, and artificial intelligence to explore better decision-support for NFL survivor contests.
                </p>
                <p>
                  This project functions as an ongoing research platform rather than a weekly prediction service. The goal is to investigate how sequential path optimization and predictive modeling can assist decision makers under conditions of extreme volatility.
                </p>
              </div>
            </div>
            
            <div className="pt-2">
              <Button 
                onClick={() => window.open('https://www.steveschilhabel.com', '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 font-mono text-xs py-2.5"
              >
                Learn more at steveschilhabel.com <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: Decision Support, Not Certainty */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 space-y-8 shadow-3xs">
        <div className="border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
              Strategic Reality
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Decision Support, Not Certainty
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              We define clear boundaries to help users manage realistic expectations in highly volatile sporting events.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: IS */}
          <Card className="p-6 border border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50/35 transition-colors space-y-4">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              SemiSharp IS
            </h3>
            <ul className="space-y-3">
              {[
                'Research driven: Grounded in systematic academic literature reviews.',
                'Data driven: Derived purely from verified feeds like PFF and NFLVerse.',
                'Transparent: All models, risk points, and probabilities are displayed openly.',
                'Explainable: Engine rationales explain WHY picks are suggested step-by-step.',
                'Continuously improving: Ingests new data variables weekly to refine future paths.'
              ].map((text, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold leading-relaxed">
                  <span className="text-emerald-500 font-black mt-0.5">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Card: IS NOT */}
          <Card className="p-6 border border-rose-100 bg-rose-50/20 hover:bg-rose-50/35 transition-colors space-y-4">
            <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              SemiSharp IS NOT
            </h3>
            <ul className="space-y-3">
              {[
                'Guaranteed winners: Football games are highly volatile physical contests.',
                'Gambling advice: We offer modeling insight, not commercial tipping structures.',
                'Financial advice: Do not place wagers based solely on analytical indicators.',
                'A prediction of certainty: Sports contain uncontrollable variance (turnovers, weather).',
                'A replacement for judgment: The user always makes the final structural choice.'
              ].map((text, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold leading-relaxed">
                  <span className="text-rose-500 font-black mt-0.5">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-6 text-center max-w-2xl mx-auto space-y-3">
          <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest font-mono">
            Platform Objective
          </h4>
          <p className="text-xs leading-relaxed font-semibold text-slate-300">
            SemiSharp cannot eliminate uncertainty. Its purpose is to help users make more disciplined, transparent, and strategically informed survivor decisions.
          </p>
        </div>
      </section>

    </div>
  );
};
