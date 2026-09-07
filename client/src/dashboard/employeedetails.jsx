import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase'; 

function EmployeeDetailsView() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state variables
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [empStats, setEmpStats] = useState({ totalLeads: 0, convertedLeads: 0 });
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        fetchEmployees();

        // Listen for real-time changes to the 'users' table
        const channel = supabase
            .channel('users_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                () => fetchEmployees()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'Employee')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEmployees(data || []);
        } catch (err) {
            console.error('Error fetching employees:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Updated handleNameClick function
    const handleNameClick = async (emp) => {
        setSelectedEmp(emp);
        setModalLoading(true);

        // Capture all possible identifiers for the employee
        const empCode = emp.emp_id || emp.empId;
        const dbId = emp.id;
        const empEmail = emp.email;

        try {
            // Fetch all leads from the table
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('*');

            if (leadsError) throw leadsError;

            // Filter leads associated with this employee
            const userLeads = (leads || []).filter((lead) => {
                const assignedTo = lead.employee_id || lead.emp_id || lead.assigned_to;
                const submittedBy = lead.submitted_by || lead.created_by || lead.user_id;
                const leadEmail = lead.employee_email || lead.user_email;

                return (
                    (empCode && (assignedTo === empCode || submittedBy === empCode)) ||
                    (dbId && (assignedTo === dbId || submittedBy === dbId)) ||
                    (empEmail && leadEmail === empEmail)
                );
            });

            // Calculate metrics
            const total = userLeads.length;
            const converted = userLeads.filter((l) => {
                const s = l.status?.toString().toLowerCase().trim();
                return ['converted', 'completed', 'accepted', 'done', 'closed'].includes(s);
            }).length;

            setEmpStats({
                totalLeads: total,
                convertedLeads: converted
            });
        } catch (err) {
            console.error('Error fetching lead stats:', err.message);
            setEmpStats({ totalLeads: 0, convertedLeads: 0 });
        } finally {
            setModalLoading(false);
        }
    };

    const filteredEmployees = employees.filter((emp) => {
        const empId = emp.empId || emp.emp_id || emp.id || '';
        const name = emp.name || '';
        const email = emp.email || '';
        const term = searchTerm.toLowerCase();

        return (
            empId.toString().toLowerCase().includes(term) ||
            name.toLowerCase().includes(term) ||
            email.toLowerCase().includes(term)
        );
    });

    if (loading) return <div className="card p-3 shadow-sm">Loading employee details...</div>;
    if (error) return <div className="card p-3 shadow-sm text-danger">Error: {error}</div>;

    return (
        <div className="card p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="m-0">Employee List</h4>

                <div className="input-group" style={{ maxWidth: '300px' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="btn btn-primary" type="button">
                        🔍 Search
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>Emp ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <tr key={emp.id}>
                                    <td>{emp.empId || emp.emp_id || emp.id}</td>
                                    <td>
                                        <button
                                            className="btn btn-link p-0 text-decoration-none fw-bold text-dark"
                                            onClick={() => handleNameClick(emp)}
                                        >
                                            {emp.name || 'N/A'}
                                        </button>
                                    </td>
                                    <td>{emp.email || 'N/A'}</td>
                                    <td>
                                        <span className="badge bg-secondary">
                                            {emp.role || 'Employee'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted">
                                    No employees found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Employee Details Pop-up Modal */}
            {selectedEmp && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            
                            <div className="modal-header bg-dark text-white">
                                <h5 className="modal-title">👤 Employee Profile</h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setSelectedEmp(null)}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                {modalLoading ? (
                                    <div className="text-center py-3">Loading stats...</div>
                                ) : (
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <small className="text-muted d-block fw-bold">FULL NAME</small>
                                            <span className="fs-6 fw-semibold">{selectedEmp.name || 'N/A'}</span>
                                        </div>
                                        <div className="col-6">
                                            <small className="text-muted d-block fw-bold">ROLE</small>
                                            <span className="badge bg-secondary">{selectedEmp.role || 'Employee'}</span>
                                        </div>

                                        <div className="col-6">
                                            <small className="text-muted d-block fw-bold">EMP ID</small>
                                            <span>{selectedEmp.empId || selectedEmp.emp_id || selectedEmp.id}</span>
                                        </div>
                                        <div className="col-6">
                                            <small className="text-muted d-block fw-bold">EMAIL ID</small>
                                            <span className="text-truncate d-block">{selectedEmp.email || 'N/A'}</span>
                                        </div>

                                        <div className="col-6">
                                            <small className="text-muted d-block fw-bold">PHONE NUMBER</small>
                                            <span>{selectedEmp.phone || selectedEmp.phone_number || 'N/A'}</span>
                                        </div>
                                        <div className="col-6">
                                            <small className="text-muted d-block fw-bold">ADDRESS</small>
                                            <span>{selectedEmp.address || 'N/A'}</span>
                                        </div>

                                        <hr className="my-3" />

                                        <div className="col-6">
                                            <div className="p-3 bg-light rounded text-center border">
                                                <small className="text-muted d-block fw-semibold">TOTAL LEADS</small>
                                                <h4 className="mb-0 fw-bold text-primary mt-1">{empStats.totalLeads}</h4>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="p-3 bg-light rounded text-center border">
                                                <small className="text-muted d-block fw-semibold">CONVERTED LEADS</small>
                                                <h4 className="mb-0 fw-bold text-success mt-1">{empStats.convertedLeads}</h4>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary px-4" 
                                    onClick={() => setSelectedEmp(null)}
                                >
                                    Close
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EmployeeDetailsView;