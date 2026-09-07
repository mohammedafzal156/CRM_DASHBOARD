import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

import Dashboardwork from './edash';
import NewLeads from './newleads';
import ProvidedLeads from './ProvidedLeads';
import ProfileView from './Profile';

const COLORS = {
    sidebarBg: '#1e293b',
    activeBlue: '#0284c7',
    hoverSlate: '#334155',
    textMuted: '#94a3b8',
};

export default function EmployeeDashboard() {
    const [isNavOpen, setIsNavOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userName, setUserName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    const navigate = useNavigate();

    // Filter States
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState('status');
    const [selectedStatuses, setSelectedStatuses] = useState({
        accepted: false, converted: false, declined: false, pending: false,
    });
    const [clientName, setClientName] = useState('');
    const [leadId, setLeadId] = useState('');

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const savedUser = localStorage.getItem('loggedInUser');
            const savedEmpId = localStorage.getItem('empId');

            if (!user && !savedUser && !savedEmpId) {
                setAccessDenied(true);
                localStorage.clear();
                setTimeout(() => navigate('/login'), 1500);
                return;
            }
            setUserName(user?.user_metadata?.full_name || savedUser || 'Employee');
        })();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate('/login');
    };

    const handleStatusCheckboxChange = (status) => {
        setSelectedStatuses((prev) => ({ ...prev, [status]: !prev[status] }));
    };

    const handleApplyFilter = () => {
        setActiveTab('providedLeads');
        setShowFilterModal(false);
    };

    if (accessDenied) {
        return (
            <div className="container mt-5 text-center">
                <div className="alert alert-danger shadow-sm d-inline-block p-4" role="alert">
                    <h4 className="alert-heading">Access Denied</h4>
                    <p className="mb-0">Please log in to access the employee dashboard.</p>
                    <small className="text-muted">Redirecting to login...</small>
                </div>
            </div>
        );
    }

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '🎛️', action: () => setActiveTab('dashboard') },
        { id: 'newLeads', label: 'New Leads', icon: '➕', action: () => setShowNewLeadModal(true) },
        { id: 'providedLeads', label: 'Provided Leads', icon: '📌', action: () => setActiveTab('providedLeads') },
        { id: 'profile', label: 'Profile', icon: '👤', action: () => setShowProfileModal(true) },
    ];

    return (
        <div className="d-flex vh-100 overflow-hidden" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #e2e8f0 40%, #bae6fd 100%)', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
            <style>{`
                .nav-custom-btn { transition: all 0.2s; color: ${COLORS.textMuted}; background: transparent; border: none; border-radius: 8px; padding: 10px 14px; width: 100%; text-align: left; display: flex; align-items: center; gap: 12px; font-size: 15px; }
                .nav-custom-btn:hover { background-color: ${COLORS.hoverSlate} !important; color: #fff !important; }
                .nav-custom-btn.active { background-color: ${COLORS.activeBlue} !important; color: #fff !important; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3); }
                .logout-custom-btn { transition: all 0.2s; background-color: #0f172a; color: #94a3b8; border: none; border-radius: 8px; padding: 10px 14px; }
                .logout-custom-btn:hover { background-color: ${COLORS.activeBlue} !important; color: #fff !important; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4); }
            `}</style>

            {/* Sidebar */}
            <div className="p-3 d-flex flex-column h-100" style={{ width: isNavOpen ? '250px' : '80px', minWidth: isNavOpen ? '250px' : '80px', backgroundColor: COLORS.sidebarBg, transition: 'width 0.3s ease', boxShadow: '4px 0 15px rgba(0,0,0,0.1)', zIndex: 10 }}>
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                    {isNavOpen && <div className="d-flex align-items-center gap-2"><span className="fs-5">💼</span><h2 className="m-0 fs-5 fw-bold text-info text-truncate">Connect & Co.</h2></div>}
                    <button className="btn btn-outline-light btn-sm ms-auto" onClick={() => setIsNavOpen(!isNavOpen)} title="Toggle Menu">☰</button>
                </div>

                <ul className="nav flex-column mb-auto gap-1">
                    {navItems.map((item) => (
                        <li className="nav-item" key={item.id}>
                            <button className={`nav-custom-btn ${activeTab === item.id ? 'active' : ''}`} onClick={item.action}>
                                <span>{item.icon}</span>
                                {isNavOpen && <span>{item.label}</span>}
                            </button>
                        </li>
                    ))}
                </ul>

                <hr className="text-secondary" />
                <button className="btn logout-custom-btn w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold" onClick={handleLogout}>
                    <span>🚪</span>{isNavOpen && 'Logout'}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow-1 p-4 overflow-auto h-100">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary-subtle gap-3">
                    <div className="d-flex align-items-center gap-3">
                        {!isNavOpen && <button className="btn btn-dark btn-sm d-flex align-items-center gap-1" onClick={() => setIsNavOpen(true)}>☰ Menu</button>}
                        <h2 className="m-0 text-dark fw-bold fs-4">Welcome back, {userName}!</h2>
                    </div>

                    <div className="d-flex align-items-center gap-3 ms-auto">
                        <div className="input-group" style={{ maxWidth: '300px' }}>
                            <span className="input-group-text bg-white border-end-0">🔍</span>
                            <input type="text" className="form-control border-start-0 border-end-0" placeholder="Search dashboard..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <button className={`btn border border-start-0 ${showFilterModal ? 'btn-primary text-white' : 'btn-light text-secondary'}`} type="button" onClick={() => setShowFilterModal(true)} title="Filter options">⚙️</button>
                        </div>
                    </div>
                </div>

                {/* Main Dynamic View Panel */}
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.05)', border: '1px solid rgba(255, 255, 255, 0.7)' }}>
                    {activeTab === 'dashboard' && <Dashboardwork activeBlue={COLORS.activeBlue} />}
                    {activeTab === 'providedLeads' && <ProvidedLeads searchQuery={searchQuery} filterCategory={filterCategory} selectedStatuses={selectedStatuses} clientName={clientName} leadId={leadId} />}
                </div>
            </div>

            {/* FILTER MODAL */}
            {showFilterModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
                        <div className="modal-content rounded-4 border-0 shadow-lg p-3">
                            <div className="modal-header border-0 pb-1">
                                <h5 className="modal-title fw-bold text-dark fs-5">Filter Search</h5>
                                <button type="button" className="btn-close" onClick={() => setShowFilterModal(false)}></button>
                            </div>

                            <div className="modal-body py-2">
                                <div className="d-flex align-items-center gap-4 mb-3">
                                    {['status', 'other'].map((cat) => (
                                        <div className="form-check m-0" key={cat}>
                                            <input className="form-check-input" type="radio" name="filterCategory" id={`filterBy-${cat}`} value={cat} checked={filterCategory === cat} onChange={() => setFilterCategory(cat)} />
                                            <label className="form-check-label fw-semibold text-dark text-capitalize" htmlFor={`filterBy-${cat}`}>{cat === 'status' ? 'By Status' : 'Other'}</label>
                                        </div>
                                    ))}
                                </div>

                                {filterCategory === 'status' ? (
                                    <div className="ms-2 my-2 ps-3 border-start border-2 border-primary">
                                        {['accepted', 'converted', 'declined', 'pending'].map((status) => (
                                            <div className="form-check my-1" key={status}>
                                                <input className="form-check-input" type="checkbox" id={`status-${status}`} checked={selectedStatuses[status]} onChange={() => handleStatusCheckboxChange(status)} />
                                                <label className="form-check-label text-capitalize text-secondary" htmlFor={`status-${status}`}>{status}</label>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="ms-2 my-2 ps-3 border-start border-2 border-primary">
                                        {[
                                            { label: 'Client Name', value: clientName, setter: setClientName, placeholder: 'Enter client name...' },
                                            { label: 'Lead ID', value: leadId, setter: setLeadId, placeholder: 'Enter lead ID...' }
                                        ].map((field, idx) => (
                                            <div className={idx === 0 ? 'mb-3' : 'mb-2'} key={field.label}>
                                                <label className="form-label small fw-semibold text-secondary mb-1">{field.label}</label>
                                                <input type="text" className="form-control form-control-sm rounded-2" placeholder={field.placeholder} value={field.value} onChange={(e) => field.setter(e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer border-0 pt-3 d-flex justify-content-end gap-2">
                                <button type="button" className="btn btn-light text-secondary rounded-3 px-3" onClick={() => setShowFilterModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary rounded-3 px-4" onClick={handleApplyFilter}>Apply Filter</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {showNewLeadModal && <NewLeads onClose={() => setShowNewLeadModal(false)} />}
            {showProfileModal && <ProfileView onClose={() => setShowProfileModal(false)} />}
        </div>
    );
}