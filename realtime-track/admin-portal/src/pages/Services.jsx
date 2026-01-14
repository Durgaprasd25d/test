import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus,
    Edit2,
    Trash2,
    LayoutGrid,
    Package,
    X,
    Save,
    AlertCircle,
    ChevronRight,
    Search
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:4000/api/services';

export default function Services() {
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form States
    const [serviceForm, setServiceForm] = useState({
        name: '', price: '', time: '1 hr', description: '', category: ''
    });
    const [categoryForm, setCategoryForm] = useState({
        name: '', slug: '', icon: 'build-outline'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, serRes] = await Promise.all([
                axios.get(`${API_BASE}/categories`),
                axios.get(`${API_BASE}/all`)
            ]);
            setCategories(catRes.data.data);
            setServices(serRes.data.data);
            if (catRes.data.data.length > 0 && !activeTab) {
                setActiveTab(catRes.data.data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`${API_BASE}/${editingItem._id}`, serviceForm);
            } else {
                await axios.post(`${API_BASE}/`, { ...serviceForm, category: activeTab });
            }
            setShowServiceModal(false);
            fetchData();
        } catch (error) {
            alert('Error saving service');
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`${API_BASE}/categories/${editingItem._id}`, categoryForm);
            } else {
                await axios.post(`${API_BASE}/categories`, categoryForm);
            }
            setShowCategoryModal(false);
            fetchData();
        } catch (error) {
            alert('Error saving category');
        }
    };

    const deleteService = async (id) => {
        if (!window.confirm('Delete this service?')) return;
        try {
            await axios.delete(`${API_BASE}/${id}`);
            fetchData();
        } catch (error) {
            alert('Error deleting service');
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm('Delete this category? This will not delete the services inside but they will be unassigned.')) return;
        try {
            await axios.delete(`${API_BASE}/categories/${id}`);
            fetchData();
        } catch (error) {
            alert('Error deleting category');
        }
    };

    const filteredServices = services.filter(s =>
        (activeTab === 'all' || s.category?._id === activeTab) &&
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Service Management</h2>
                    <p className="text-slate-500 text-sm">Configure your service catalog, categories and pricing</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setCategoryForm({ name: '', slug: '', icon: 'build-outline' });
                            setShowCategoryModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
                    >
                        <LayoutGrid size={18} />
                        New Category
                    </button>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setServiceForm({ name: '', price: '', time: '1 hr', description: '', category: activeTab });
                            setShowServiceModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 px-5 py-2 rounded-xl text-white font-semibold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                    >
                        <Plus size={18} />
                        New Service
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Categories List */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categories</h3>
                        </div>
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <Package size={18} className={activeTab === 'all' ? 'text-blue-600' : 'text-slate-400'} />
                                    All Services
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-blue-200' : 'bg-slate-100'}`}>
                                    {services.length}
                                </span>
                            </button>

                            {categories.map((cat) => (
                                <div key={cat._id} className="group relative">
                                    <div
                                        onClick={() => setActiveTab(cat._id)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === cat._id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="text-lg opacity-80">{cat.icon === 'build-outline' ? '🔧' : '🛠️'}</span>
                                            {cat.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === cat._id ? 'bg-blue-200' : 'bg-slate-100'}`}>
                                                {services.filter(s => s.category?._id === cat._id).length}
                                            </span>
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-2 transition-opacity">
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingItem(cat);
                                                    setCategoryForm({ name: cat.name, slug: cat.slug, icon: cat.icon });
                                                    setShowCategoryModal(true);
                                                }} className="p-1 hover:text-blue-600"><Edit2 size={12} /></button>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteCategory(cat._id);
                                                }} className="p-1 hover:text-red-500"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Services Grid */}
                <div className="lg:col-span-9 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search services..."
                            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-2xl" />
                            ))
                        ) : filteredServices.length === 0 ? (
                            <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center text-slate-400">
                                <Package size={48} className="mb-4 opacity-20" />
                                <p>No services found in this category</p>
                            </div>
                        ) : (
                            filteredServices.map((service) => (
                                <div key={service._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                                {service.name}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{service.category?.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingItem(service);
                                                    setServiceForm({
                                                        name: service.name,
                                                        price: service.price,
                                                        time: service.time || '1 hr',
                                                        description: service.description || '',
                                                        category: service.category?._id
                                                    });
                                                    setShowServiceModal(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteService(service._id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-black text-slate-900">₹{service.price}</span>
                                            <span className="text-xs text-slate-400 font-medium">{service.time || '1 hr'}</span>
                                        </div>
                                        <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md font-bold">READY</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Service Modal */}
            {showServiceModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Edit Service' : 'New Service'}</h3>
                            <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                        </div>
                        <form onSubmit={handleServiceSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                                    value={serviceForm.name}
                                    placeholder="e.g. Split AC Repair"
                                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Base Price (₹)</label>
                                    <input
                                        type="number" required
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                                        value={serviceForm.price}
                                        placeholder="500"
                                        onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Duration</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                                        value={serviceForm.time}
                                        placeholder="1 hr"
                                        onChange={e => setServiceForm({ ...serviceForm, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium min-h-[100px]"
                                    value={serviceForm.description}
                                    placeholder="Tell customers what is included..."
                                    onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-4">
                                <Save size={20} />
                                {editingItem ? 'Update Service' : 'Create Service'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Edit Category' : 'New Category'}</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                        </div>
                        <form onSubmit={handleCategorySubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                                    value={categoryForm.name}
                                    placeholder="e.g. AC Repair"
                                    onChange={e => {
                                        const val = e.target.value;
                                        setCategoryForm({ ...categoryForm, name: val, slug: val.toLowerCase().replace(/ /g, '-') })
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL Slug</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl text-slate-400 font-mono text-sm"
                                    value={categoryForm.slug}
                                    disabled
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4">
                                <Save size={20} />
                                {editingItem ? 'Update Category' : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
