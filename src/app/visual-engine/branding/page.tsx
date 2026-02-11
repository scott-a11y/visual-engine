'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Building2,
    Mail,
    Phone,
    Globe,
    Palette as PaletteIcon,
    Save,
    Trash2,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { isDemoMode } from '@/lib/demo-data';
import type { Company } from '@/lib/types/database';

const DEMO_COMPANY: Company = {
    id: 'demo-company',
    name: 'Chad E. Davis Construction',
    logo_url: null,
    primary_color: '#f59e0b',
    contact_email: 'chad@davisconstruction.com',
    contact_phone: '(425) 555-0142',
    website: 'davisconstruction.com',
    created_at: new Date().toISOString(),
};

export default function BrandingCenterPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);

    const [formData, setFormData] = useState<Partial<Company>>({
        name: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        primary_color: '#6366f1'
    });

    useEffect(() => {
        async function fetchCompanies() {
            if (isDemoMode()) {
                setCompanies([DEMO_COMPANY]);
                setLoading(false);
                return;
            }
            try {
                const res = await fetch('/api/companies');
                const data = await res.json();
                setCompanies(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setCompanies([]);
            } finally {
                setLoading(false);
            }
        }
        fetchCompanies();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                const newCompany = await res.json();
                setCompanies([...companies, newCompany]);
                setShowNewForm(false);
                setFormData({
                    name: '',
                    contact_email: '',
                    contact_phone: '',
                    website: '',
                    primary_color: '#6366f1'
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loading size="lg" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Brand Center</h1>
                    <p className="text-white/40">Manage builder identities and marketing profiles</p>
                </div>
                <Button
                    onClick={() => setShowNewForm(true)}
                    className="bg-white text-black hover:bg-white/90 rounded-full"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Company
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Company List */}
                <div className="lg:col-span-2 space-y-4">
                    {companies.length === 0 ? (
                        <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center text-white/20">
                            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No companies found. Create your first builder profile.</p>
                        </div>
                    ) : (
                        companies.map((company) => (
                            <div key={company.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                                        style={{ backgroundColor: company.primary_color }}
                                    >
                                        {company.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{company.name}</h3>
                                        <div className="flex items-center gap-4 text-xs text-white/40 mt-1">
                                            {company.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {company.contact_email}</span>}
                                            {company.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {company.website}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="rounded-full text-white/40 hover:text-white">
                                        <Save className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-full text-white/40 hover:text-red-400">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Sidebar Info / Quick Setup */}
                <div className="space-y-6">
                    {showNewForm ? (
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="font-bold text-xl">Create Profile</h3>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Company Name</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="e.g. Chad Davis Homes"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Brand Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={formData.primary_color}
                                            onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                            className="w-11 h-11 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                                        />
                                        <input
                                            value={formData.primary_color}
                                            onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl h-11 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Contact Email</label>
                                    <input
                                        type="email"
                                        value={formData.contact_email || ''}
                                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setShowNewForm(false)}
                                        variant="ghost"
                                        className="flex-1 rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                                    >
                                        {saving ? <Loading size="sm" /> : 'Save Profile'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Multi-Company Support</h3>
                            <p className="text-sm text-white/60 leading-relaxed">
                                You can now create multiple brand identities. Each project can be linked to a specific builder,
                                and generated visuals will automatically include their contact info and branding.
                            </p>
                        </div>
                    )}

                    {/* Chad Davis Quick Info if known */}
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 block mb-4">Current Selection</label>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <Check className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Standard Branding</p>
                                <p className="text-[10px] text-white/40">Visual Engine Default</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
