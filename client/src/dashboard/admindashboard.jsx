import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

import EmployeeDetailsView from './employeedetails';
import LeadsView from './employeeleads';
import ProjectsView from './projectfile';
import ProfileView from './profile';
import DashboardOverview from './dash';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'employees', label: 'Employee Details', icon: '👥' },
    { id: 'leads', label: 'Employee Leads', icon: '📊' },
    { id: 'projects', label: 'Project Details', icon: '📁' },
    { id: 'profile', label: 'Profile', icon: '👤' }
];

const STATUS_MAP = {
    success: ['completed', 'accepted', 'converted', 'done'],
    danger: ['declined', 'rejected', 'failed'],
    secondary: ['canceled', 'cancelled'],
    warning: ['pending', 'in progress', 'new', 'new / pending']
};

function AdminDashboard() {
    const [isNavOpen, setIsNavOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [userName, setUserName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);

    const [allEmployees, setAllEmployees] = useState([]);
    const [allLeads, setAllLeads] = useState([]);
    const [allProjects, setAllProjects] = useState([]);

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState('status');
    const [statusFilters, setStatusFilters] = useState({ completed: false, declined: false, canceled: false, pending: false });
    const [otherFilters, setOtherFilters] = useState({ option1: false, option2: false, option3: false });

    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            supabase.from('users').select('*'),
            supabase.from('leads').select('*'),
            supabase.from('projects').select('*')
        ]).then(([{ data: emp }, { data: leads }, { data: proj }]) => {
            if (emp) setAllEmployees(emp);
            if (leads) setAllLeads(leads);
            if (proj) setAllProjects(proj);
        });
    }, []);

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
            setUserName(user?.user_metadata?.full_name || savedUser || 'Admin');
        })();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate('/login');
    };

    const handleApplyFilters = () => {
        setShowFilterModal(false);
        if (filterCategory === 'status') setActiveTab('leads');
        else if (otherFilters.option1) setActiveTab('projects');
        else if (otherFilters.option2 || otherFilters.option3) setActiveTab('employees');
    };

    const getStatusBadgeClass = (status) => {
        const norm = (status || '').toLowerCase().trim();
        if (STATUS_MAP.success.includes(norm)) return 'bg-success';
        if (STATUS_MAP.danger.includes(norm)) return 'bg-danger';
        if (STATUS_MAP.secondary.includes(norm)) return 'bg-secondary';
        return 'bg-warning text-dark';
    };

    const q = searchQuery.toLowerCase().trim();
    const filterByQ = (list) => list.filter((item) => JSON.stringify(item).toLowerCase().includes(q));

    const matchedEmployees = filterByQ(allEmployees);
    const matchedLeads = filterByQ(allLeads);
    const matchedProjects = filterByQ(allProjects);

    const activeStatusKeys = Object.keys(statusFilters).filter((k) => statusFilters[k]);
    const finalLeads = matchedLeads.filter((lead) => 
        activeStatusKeys.length === 0 || activeStatusKeys.includes((lead.status || '').toLowerCase())
    );

    if (accessDenied) {
        return (
            <div className="container mt-5 text-center">
                <div className="alert alert-danger shadow-sm d-inline-block p-4" role="alert">
                    <h4 className="alert-heading">Access Denied</h4>
                    <p className="mb-0">Please log in to access the admin dashboard.</p>
                    <small className="text-muted">Redirecting to login...</small>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex vh-100 bg-light">
            {/* Sidebar */}
            <div
                className={`bg-dark text-white p-3 d-flex flex-column justify-content-between h-100 transition-all ${
                    isNavOpen ? 'col-12 col-md-3 col-lg-2' : 'd-none d-md-flex col-md-1 align-items-center'
                }`}
                style={{ transition: '0.3s ease' }}
            >
                <div className="w-100">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        {isNavOpen && <h4 className="m-0 fs-5 text-truncate">{userName}</h4>}
                        <button className="btn btn-outline-light btn-sm ms-auto" onClick={() => setIsNavOpen(!isNavOpen)} title="Toggle Menu">
                            ☰
                        </button>
                    </div>

                    <ul className="nav nav-pills flex-column mb-auto">
                        {NAV_ITEMS.map(({ id, label, icon }) => (
                            <li className="nav-item mb-2" key={id}>
                                <button
                                    className={`nav-link w-100 text-start text-white ${activeTab === id && !q ? 'active bg-primary' : ''}`}
                                    onClick={() => { setSearchQuery(''); setActiveTab(id); }}
                                >
                                    {icon} {isNavOpen && label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="w-100 pt-3 border-top border-secondary mt-auto">
                    <button className="btn btn-danger w-100" onClick={handleLogout}>
                        🚪 {isNavOpen && 'Logout'}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow-1 p-4 overflow-auto">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
                    <div className="d-flex align-items-center gap-3">
                        {!isNavOpen && <button className="btn btn-dark btn-sm" onClick={() => setIsNavOpen(true)}>☰ Menu</button>}
                        <h2 className="m-0 text-capitalize fs-3">
                            {q ? `Search Results for "${searchQuery}"` : NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Dashboard Overview'}
                        </h2>
                    </div>

                    <div className="d-flex align-items-center gap-2 ms-auto">
                        <div className="input-group" style={{ maxWidth: '320px' }}>
                            <span className="input-group-text bg-white border-end-0">🔍</span>
                            <input
                                type="text"
                                className="form-control border-start-0 border-end-0"
                                placeholder="Search all tables..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="btn btn-outline-secondary bg-white border-start-0 border-end-0 text-muted" type="button" onClick={() => setSearchQuery('')}>✕</button>
                            )}
                            <button className="btn btn-outline-secondary bg-white border-start-0 fs-6" type="button" title="Filter Options" onClick={() => setShowFilterModal(true)}>🔽</button>
                        </div>
                    </div>
                </div>

                {/* SEARCH RESULTS VIEW */}
                {q !== '' ? (
                    <div className="d-flex flex-column gap-4">
                        <SearchResultCard title={`👥 Employee Details (${matchedEmployees.length})`} titleColor="text-dark" headers={['Emp ID', 'Name', 'Email', 'Designation / Role']}>
                            {matchedEmployees.length > 0 ? (
                                matchedEmployees.map((emp) => (
                                    <tr key={emp.emp_id || emp.id}>
                                        <td>{emp.emp_id || emp.id}</td>
                                        <td>{emp.name || emp.full_name || 'N/A'}</td>
                                        <td>{emp.email || 'N/A'}</td>
                                        <td>{emp.designation || emp.role || 'N/A'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-muted text-center py-2">No matching employee details found.</td></tr>
                            )}
                        </SearchResultCard>

                        <SearchResultCard title={`📊 Employee Leads (${finalLeads.length})`} titleColor="text-primary" headers={['Lead ID', 'Client Name', 'Submitted By', 'Status']}>
                            {finalLeads.length > 0 ? (
                                finalLeads.map((lead) => (
                                    <tr key={lead.id}>
                                        <td>{lead.id}</td>
                                        <td>{lead.client_name || lead.client || 'N/A'}</td>
                                        <td>{lead.emp_id || lead.employee_id || 'N/A'}</td>
                                        <td><span className={`badge ${getStatusBadgeClass(lead.status)}`}>{lead.status || 'N/A'}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-muted text-center py-2">No matching employee leads found.</td></tr>
                            )}
                        </SearchResultCard>

                        <SearchResultCard title={`📁 Project Details (${matchedProjects.length})`} titleColor="text-success" headers={['Project ID', 'Project Name', 'Client Name', 'Status']}>
                            {matchedProjects.length > 0 ? (
                                matchedProjects.map((proj) => (
                                    <tr key={proj.project_id || proj.id}>
                                        <td>{proj.project_id || proj.id}</td>
                                        <td>{proj.project_name || proj.title || 'N/A'}</td>
                                        <td>{proj.client_name || proj.client || 'N/A'}</td>
                                        <td><span className="badge bg-info">{proj.status || 'N/A'}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-muted text-center py-2">No matching project details found.</td></tr>
                            )}
                        </SearchResultCard>
                    </div>
                ) : (
                    /* DEFAULT TAB VIEWS */
                    <>
                        {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} searchQuery={searchQuery} statusFilters={statusFilters} otherFilters={otherFilters} />}
                        {activeTab === 'employees' && <EmployeeDetailsView searchQuery={searchQuery} statusFilters={statusFilters} otherFilters={otherFilters} />}
                        {activeTab === 'leads' && <LeadsView searchQuery={searchQuery} statusFilters={statusFilters} otherFilters={otherFilters} />}
                        {activeTab === 'projects' && <ProjectsView searchQuery={searchQuery} statusFilters={statusFilters} otherFilters={otherFilters} />}
                        {activeTab === 'profile' && <ProfileView setDashboardUserName={setUserName} />}
                    </>
                )}
            </div>

            {/* Filter Modal Popup */}
            {showFilterModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">🔽 Filter Options</h5>
                                <button type="button" className="btn-close" onClick={() => setShowFilterModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="d-flex justify-content-around mb-4 pb-2 border-bottom">
                                    {['status', 'other'].map((cat) => (
                                        <div className="form-check form-check-inline" key={cat}>
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="filterCategory"
                                                id={`by-${cat}`}
                                                value={cat}
                                                checked={filterCategory === cat}
                                                onChange={(e) => setFilterCategory(e.target.value)}
                                            />
                                            <label className="form-check-label fw-bold text-capitalize" htmlFor={`by-${cat}`}>
                                                By {cat}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {filterCategory === 'status' ? (
                                    <div>
                                        <p className="text-muted mb-2">Select status filters:</p>
                                        <div className="row g-2">
                                            {['completed', 'declined', 'canceled', 'pending'].map((st) => (
                                                <div className="col-6" key={st}>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={st}
                                                            name={st}
                                                            checked={statusFilters[st]}
                                                            onChange={(e) => setStatusFilters((prev) => ({ ...prev, [st]: e.target.checked }))}
                                                        />
                                                        <label className="form-check-label text-capitalize" htmlFor={st}>{st}</label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-muted mb-2">Other filters:</p>
                                        {[
                                            { id: 'option1', label: 'Client Name' },
                                            { id: 'option2', label: 'Employee Name' },
                                            { id: 'option3', label: 'Employee Id' }
                                        ].map(({ id, label }) => (
                                            <div className="form-check mb-2" key={id}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={id}
                                                    name={id}
                                                    checked={otherFilters[id]}
                                                    onChange={(e) => setOtherFilters((prev) => ({ ...prev, [id]: e.target.checked }))}
                                                />
                                                <label className="form-check-label" htmlFor={id}>{label}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => {
                                    setStatusFilters({ completed: false, declined: false, canceled: false, pending: false });
                                    setOtherFilters({ option1: false, option2: false, option3: false });
                                }}>Reset</button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyFilters}>Apply Filters</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reusable table card wrapper for search results
function SearchResultCard({ title, titleColor, headers, children }) {
    return (
        <div className="card shadow-sm border-0 p-3">
            <h5 className={`${titleColor} mb-3`}>{title}</h5>
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                    </thead>
                    <tbody>{children}</tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminDashboard;