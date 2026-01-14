import React, { useState } from 'react';
import {
    Settings as SettingsIcon,
    Shield,
    Bell,
    Globe,
    Database,
    Save,
    Lock,
    Percent,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

export default function Settings() {
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        platformFee: 20,
        maintenanceMode: false,
        autoApproval: false,
        notificationEmails: 'admin@zyroac.com',
        minWithdrawal: 500
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const SettingGroup = ({ title, description, children }) => (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{description}</p>
                </div>
            </div>
            <div className="p-6 space-y-6">
                {children}
            </div>
        </div>
    );

    const SettingItem = ({ icon: Icon, label, description, children, danger }) => (
        <div className="flex items-start justify-between gap-8 py-2">
            <div className="flex gap-4">
                <div className={`p-3 rounded-2xl ${danger ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h4 className={`font-bold ${danger ? 'text-rose-600' : 'text-slate-800'}`}>{label}</h4>
                    <p className="text-sm text-slate-400 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="shrink-0">
                {children}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <SettingsIcon className="text-slate-400" size={32} />
                        System Settings
                    </h2>
                    <p className="text-slate-500 mt-1">Global configuration and platform controls</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                >
                    {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                    {saved ? 'Saved Successfully' : 'Save Changes'}
                </button>
            </div>

            <SettingGroup title="Financial Controls" description="Manage platform fees and transaction limits">
                <SettingItem
                    icon={Percent}
                    label="Platform Commission Fee"
                    description="Percentage taken from each completed service transaction."
                >
                    <div className="relative">
                        <input
                            type="number"
                            className="w-24 px-4 py-2 bg-slate-50 border-none rounded-xl text-right font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                            value={settings.platformFee}
                            onChange={e => setSettings({ ...settings, platformFee: e.target.value })}
                        />
                        <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                    </div>
                </SettingItem>

                <SettingItem
                    icon={Database}
                    label="Minimum Withdrawal Limit"
                    description="The threshold amount for technicians to request a payout."
                >
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input
                            type="number"
                            className="w-28 px-4 py-2 bg-slate-50 border-none rounded-xl text-right font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                            value={settings.minWithdrawal}
                            onChange={e => setSettings({ ...settings, minWithdrawal: e.target.value })}
                        />
                    </div>
                </SettingItem>
            </SettingGroup>

            <SettingGroup title="Security & Approvals" description="Configure verification and access protocols">
                <SettingItem
                    icon={Shield}
                    label="Auto-Approve Technicians"
                    description="Automatically approve KYC if documents are uploaded."
                >
                    <button
                        onClick={() => setSettings({ ...settings, autoApproval: !settings.autoApproval })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoApproval ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoApproval ? 'left-7' : 'left-1'}`} />
                    </button>
                </SettingItem>

                <SettingItem
                    icon={Lock}
                    label="Advanced Firewall"
                    description="Enable strict IP monitoring for administrative operations."
                >
                    <button className="w-12 h-6 rounded-full bg-blue-600 relative">
                        <div className="absolute top-1 w-4 h-4 bg-white rounded-full left-7" />
                    </button>
                </SettingItem>
            </SettingGroup>

            <SettingGroup title="Infrastructure" description="Platform availability and system health">
                <SettingItem
                    icon={AlertTriangle}
                    label="Maintenance Mode"
                    description="Puts the customer app in read-only mode during updates."
                    danger
                >
                    <button
                        onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-rose-500' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
                    </button>
                </SettingItem>

                <SettingItem
                    icon={Bell}
                    label="System Alerts"
                    description="Receive emails for failed transactions or server spikes."
                >
                    <input
                        className="w-64 px-4 py-2 bg-slate-50 border-none rounded-xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500/20"
                        value={settings.notificationEmails}
                        onChange={e => setSettings({ ...settings, notificationEmails: e.target.value })}
                    />
                </SettingItem>
            </SettingGroup>
        </div>
    );
}
