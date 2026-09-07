import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase'; // Adjust path to your supabase config if needed

function Dashboardwork({ activeBlue }) {
    const [stats, setStats] = useState({
        newLeads: 0,
        convertedLeads: 0,
        conversionRate: '0.0%',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeadStats();
    }, []);

    const fetchLeadStats = async () => {
        try {
            setLoading(true);

            // 1. Get current logged-in user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw userError;

            // Get Employee ID from user metadata or auth ID
            const currentEmpId = user.user_metadata?.empid || user.id;

            // 2. Fetch all leads submitted by / assigned to this employee
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('status, employee_id, created_by')
                // Checks matching employee ID column (adjust column name if needed)
                .or(`employee_id.eq.${currentEmpId},created_by.eq.${currentEmpId}`);

            if (leadsError) throw leadsError;

            const allLeads = leads || [];
            
            // 3. Calculate statistics
            const total = allLeads.length;
            
            // Count converted/completed leads (case-insensitive check)
            const converted = allLeads.filter(
                (lead) => lead.status && lead.status.toLowerCase().trim() === 'completed'
            ).length;

            const rate = total > 0 ? ((converted / total) * 100).toFixed(1) + '%' : '0.0%';

            setStats({
                newLeads: total,
                convertedLeads: converted,
                conversionRate: rate,
            });
        } catch (err) {
            console.error('Error fetching lead statistics:', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-dark mb-4 fs-4 fw-semibold">Dashboard Overview</h3>
            
            {loading ? (
                <div className="text-muted p-3">Loading statistics...</div>
            ) : (
                <div className="row g-3">
                    {/* Total / New Leads Card */}
                    <div className="col-12 col-sm-6 col-md-4">
                        <div className="card shadow-sm border-0 text-center p-4 bg-white rounded-3">
                            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                <span className="fs-5">➕</span>
                                <h5 className="text-muted m-0 fs-6 fw-semibold">New Leads</h5>
                            </div>
                            <p className="fs-2 fw-bold mb-0" style={{ color: activeBlue }}>
                                {stats.newLeads}
                            </p>
                        </div>
                    </div>

                    {/* Converted Leads Card */}
                    <div className="col-12 col-sm-6 col-md-4">
                        <div className="card shadow-sm border-0 text-center p-4 bg-white rounded-3">
                            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                <span className="fs-5">✅</span>
                                <h5 className="text-muted m-0 fs-6 fw-semibold">Converted Leads</h5>
                            </div>
                            <p className="fs-2 fw-bold text-success mb-0">
                                {stats.convertedLeads}
                            </p>
                        </div>
                    </div>

                    {/* Conversion Rate Card */}
                    <div className="col-12 col-sm-6 col-md-4">
                        <div className="card shadow-sm border-0 text-center p-4 bg-white rounded-3">
                            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                <span className="fs-5">📈</span>
                                <h5 className="text-muted m-0 fs-6 fw-semibold">Conversion Rate</h5>
                            </div>
                            <p className="fs-2 fw-bold mb-0" style={{ color: '#8b5cf6' }}>
                                {stats.conversionRate}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboardwork;