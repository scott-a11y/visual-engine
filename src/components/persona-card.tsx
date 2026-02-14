'use client';

import { DeveloperPersona } from '@/lib/types/persona';
import { Briefcase, MapPin, Wrench, Home, Shield, Zap } from 'lucide-react';

interface PersonaCardProps {
    persona: DeveloperPersona;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
}

export function PersonaCard({ persona, isSelected, onSelect }: PersonaCardProps) {
    return (
        <div
            onClick={() => onSelect?.(persona.id)}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer ${isSelected
                ? 'border-cyan-500 bg-cyan-500/5 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
        >
            {/* Header / Archetype */}
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-cyan-500/20 rounded-xl">
                        <Home className="w-6 h-6 text-cyan-400" />
                    </div>
                    {isSelected && (
                        <div className="bg-cyan-500 text-black text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider animate-pulse">
                            Active Persona
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{persona.name}</h3>
                <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{persona.role}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{persona.market}</span>
                </div>

                <p className="text-sm text-cyan-400 font-medium mb-6 uppercase tracking-widest text-[11px]">
                    {persona.archetype}
                </p>

                {/* Strategy Details */}
                <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-white/80 uppercase">Risk & Capital</span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed font-light">
                            {persona.risk_profile.description}
                        </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4 text-orange-400" />
                            <span className="text-xs font-semibold text-white/80 uppercase">Finish Standard</span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed font-light">
                            {persona.finish_level.label}: {persona.finish_level.description}
                        </p>
                    </div>
                </div>

                {/* Cabinet & Ethos Badges */}
                <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-2">
                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-white/70">
                        {persona.cabinet_spec.kitchen.style}
                    </div>
                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-white/70">
                        {persona.preservation_ethos.label}
                    </div>
                </div>
            </div>

            {/* Hover Effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}
