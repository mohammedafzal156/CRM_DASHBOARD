import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

function DashboardOverview({ setActiveTab = () => {}, searchQuery = '' }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        newLeads: 0,
        convertedLeads: 0,
        canceledLeads: 0,
        inProgressLeads: 0,
        lostLeads: 0,
        totalLeads: 0,
        conversionRate: '0.0%'
    });

    useEffect(() => {
        fetchDashboardData();

        // Real-time subscriptions for both leads and users tables
        const leadsChannel = supabase
            .channel('dashboard_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                () => fetchDashboardData()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                () => fetchDashboardData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(leadsChannel);
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch total count from the 'users' table
            const { count: empCount, error: empError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (empError) console.error('Error fetching employees:', empError.message);

            // 2. Fetch all leads
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('status');

            if (leadsError) throw leadsError;

            // 3. Calculate dynamic metrics
            const allLeads = leads || [];
            const totalLeadsCount = allLeads.length;

            let newCount = 0;
            let convertedCount = 0;
            let canceledCount = 0;
            let inProgressCount = 0;
            let lostCount = 0;

            allLeads.forEach((lead) => {
                const status = lead.status?.toString().toLowerCase().trim() || 'new';
                if (status === 'converted' || status === 'completed' || status === 'accepted' || status === 'done') {
                    convertedCount++;
                } else if (status === 'canceled' || status === 'cancelled') {
                    canceledCount++;
                } else if (status === 'in progress') {
                    inProgressCount++;
                } else if (status === 'declined' || status === 'rejected' || status === 'lost') {
                    lostCount++;
                } else {
                    newCount++;
                }
            });

            const rate = totalLeadsCount > 0 
                ? ((convertedCount / totalLeadsCount) * 100).toFixed(1) + '%' 
                : '0.0%';

            setStats({
                totalEmployees: empCount || 0,
                newLeads: newCount,
                convertedLeads: convertedCount,
                canceledLeads: canceledCount,
                inProgressLeads: inProgressCount,
                lostLeads: lostCount,
                totalLeads: totalLeadsCount,
                conversionRate: rate
            });

        } catch (err) {
            console.error('Error loading dashboard data:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate bar chart proportions dynamically
    const maxChartVal = Math.max(
        stats.totalEmployees, 
        stats.newLeads, 
        stats.convertedLeads, 
        stats.canceledLeads, 
        stats.lostLeads, 
        5
    );
    
    const companyStatusData = [
        { label: 'Total Employees', value: stats.totalEmployees, color: '#0d6efd', maxValue: maxChartVal },
        { label: 'New Leads', value: stats.newLeads, color: '#ffc107', maxValue: maxChartVal },
        { label: 'Converted', value: stats.convertedLeads, color: '#198754', maxValue: maxChartVal },
        { label: 'Canceled', value: stats.canceledLeads, color: '#6c757d', maxValue: maxChartVal },
        { label: 'Declined', value: stats.lostLeads, color: '#dc3545', maxValue: maxChartVal },
    ];

    const filteredCompanyData = companyStatusData.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="card p-4 shadow-sm">Loading live dashboard metrics...</div>;
    }

    return (
        <div className="container-fluid p-0">
            {/* Top Cards Row (Adjusted grid columns for 5 cards) */}
            <div className="row g-3 mb-4">
                
                {/* Total Employees Card */}
                <div className="col-12 col-sm-6 col-md-4 col-xl">
                    <div 
                        className="card border-0 shadow-sm p-3 border-start border-primary border-4 h-100"
                        onClick={() => setActiveTab('employees')}
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                        title="Click to view Employee Details"
                        onMouseEnter={(e) => e.currentTarget.classList.add('shadow')}
                        onMouseLeave={(e) => e.currentTarget.classList.remove('shadow')}
                    >
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <small className="text-muted fw-semibold">Total Employees</small>
                                <h2 className="mb-0 mt-1 fw-bold">{stats.totalEmployees}</h2>
                            </div>
                            <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle fs-3">
                                👥
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Leads Card */}
                <div className="col-12 col-sm-6 col-md-4 col-xl">
                    <div 
                        className="card border-0 shadow-sm p-3 border-start border-warning border-4 h-100"
                        onClick={() => setActiveTab('leads')}
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => e.currentTarget.classList.add('shadow')}
                        onMouseLeave={(e) => e.currentTarget.classList.remove('shadow')}
                    >
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <small className="text-muted fw-semibold">New Leads</small>
                                <h2 className="mb-0 mt-1 fw-bold">{stats.newLeads}</h2>
                            </div>
                            <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-circle fs-3">
                                📈
                            </div>
                        </div>
                    </div>
                </div>

                {/* Converted Leads Card */}
                <div className="col-12 col-sm-6 col-md-4 col-xl">
                    <div 
                        className="card border-0 shadow-sm p-3 border-start border-success border-4 h-100"
                        onClick={() => setActiveTab('leads')}
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                        title="Click to view Employee Leads"
                        onMouseEnter={(e) => e.currentTarget.classList.add('shadow')}
                        onMouseLeave={(e) => e.currentTarget.classList.remove('shadow')}
                    >
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <small className="text-muted fw-semibold">Converted Leads</small>
                                <h2 className="mb-0 mt-1 fw-bold">{stats.convertedLeads}</h2>
                            </div>
                            <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle fs-3">
                                ✅
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canceled Leads Card */}
                <div className="col-12 col-sm-6 col-md-4 col-xl">
                    <div 
                        className="card border-0 shadow-sm p-3 border-start border-secondary border-4 h-100"
                        onClick={() => setActiveTab('leads')}
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                        title="Click to view Employee Leads"
                        onMouseEnter={(e) => e.currentTarget.classList.add('shadow')}
                        onMouseLeave={(e) => e.currentTarget.classList.remove('shadow')}
                    >
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <small className="text-muted fw-semibold">Canceled Leads</small>
                                <h2 className="mb-0 mt-1 fw-bold">{stats.canceledLeads}</h2>
                            </div>
                            <div className="bg-secondary bg-opacity-10 text-secondary p-3 rounded-circle fs-3">
                                ✖️
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversion Rate Card */}
                <div className="col-12 col-sm-6 col-md-4 col-xl">
                    <div 
                        className="card border-0 shadow-sm p-3 border-start border-info border-4 h-100"
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => e.currentTarget.classList.add('shadow')}
                        onMouseLeave={(e) => e.currentTarget.classList.remove('shadow')}
                    >
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <small className="text-muted fw-semibold">Conversion Rate</small>
                                <h2 className="mb-0 mt-1 fw-bold">{stats.conversionRate}</h2>
                            </div>
                            <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle fs-3">
                                🎯
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Graphs & Charts Row */}
            <div className="row g-4">
                <div className="col-12 col-lg-8">
                    <div className="card p-4 shadow-sm border-0 h-100">
                        <h5 className="fw-bold mb-4">📊 Company Status & Lead Pipeline</h5>
                        <div className="d-flex align-items-end justify-content-around bg-light p-4 rounded" style={{ height: '260px' }}>
                            {(filteredCompanyData.length > 0 ? filteredCompanyData : companyStatusData).map((item) => {
                                const heightPercentage = item.maxValue > 0 ? (item.value / item.maxValue) * 100 : 0;
                                return (
                                    <div key={item.label} className="d-flex flex-column align-items-center h-100 justify-content-end" style={{ width: '18%' }}>
                                        <small className="fw-bold mb-1">{item.value}</small>
                                        <div 
                                            className="w-100 rounded-top"
                                            style={{
                                                height: `${Math.max(heightPercentage, 4)}%`,
                                                backgroundColor: item.color,
                                                transition: 'height 0.4s ease'
                                            }}
                                            title={`${item.label}: ${item.value}`}
                                        />
                                        <small className="text-muted mt-2 fw-semibold text-truncate w-100 text-center">{item.label}</small>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <div className="card p-4 shadow-sm border-0 h-100">
                        <h5 className="fw-bold mb-3">Target Completion</h5>
                        <p className="text-muted small">Lead conversion target overview for current month.</p>
                        
                        <div className="mt-3">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="fw-semibold">Converted</span>
                                <span className="fw-bold text-success">{stats.convertedLeads} / 20</span>
                            </div>
                            <div className="progress mb-3" style={{ height: '10px' }}>
                                <div className="progress-bar bg-success" style={{ width: `${Math.min((stats.convertedLeads / 20) * 100, 100)}%` }}></div>
                            </div>

                            <div className="d-flex justify-content-between mb-1">
                                <span className="fw-semibold">New Leads Contacted</span>
                                <span className="fw-bold text-primary">{stats.newLeads} / 25</span>
                            </div>
                            <div className="progress mb-3" style={{ height: '10px' }}>
                                <div className="progress-bar bg-primary" style={{ width: `${Math.min((stats.newLeads / 25) * 100, 100)}%` }}></div>
                            </div>

                            <div className="d-flex justify-content-between mb-1">
                                <span className="fw-semibold">Canceled Leads</span>
                                <span className="fw-bold text-secondary">{stats.canceledLeads} / 15</span>
                            </div>
                            <div className="progress mb-2" style={{ height: '10px' }}>
                                <div className="progress-bar bg-secondary" style={{ width: `${Math.min((stats.canceledLeads / 15) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardOverview;