'use client';

import { PersonaCard } from './persona-card';
import { DEMO_PERSONAS } from '@/lib/demo-data';
import { User, ShieldCheck } from 'lucide-react';

interface PersonaSelectorProps {
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function PersonaSelector({ selectedId, onSelect }: PersonaSelectorProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    Developer Persona / Strategy
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Default / No Persona */}
                <div
                    onClick={() => onSelect('')}
                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${!selectedId
                            ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_25px_rgba(245,158,11,0.1)]'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                >
                    <div className="p-3 bg-white/10 rounded-full">
                        <User className="w-6 h-6 text-white/40" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Generic Modern</h3>
                        <p className="text-xs text-white/40">Standard luxury new build defaults</p>
                    </div>
                </div>

                {/* Dallis Raynor */}
                {DEMO_PERSONAS.map(persona => (
                    <PersonaCard
                        key={persona.id}
                        persona={persona}
                        isSelected={selectedId === persona.id}
                        onSelect={onSelect}
                    />
                ))}
            </div>

            <p className="text-[11px] text-white/30 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                <strong className="text-white/60">Note:</strong> Selecting a persona automatically tunes the AI Visual Engine (Gemini/Veo)
                to match specific finish levels, cabinet specs, and neighborhood architectural principles.
            </p>
        </div>
    );
}
