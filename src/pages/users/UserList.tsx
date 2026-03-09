
import React, { useEffect, useState } from 'react';
import { Col, Row, Card, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import Button from 'components/base/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faUserShield, faUserTie, faUser, faMobileAlt } from '@fortawesome/free-solid-svg-icons';
import { UserEmployeeView } from 'types/user';
import { useNavigate, Link } from 'react-router';
import toast from 'react-hot-toast';
import { supabase, supabaseAdmin } from 'supabaseClient';
import ConfirmationModal from 'components/common/ConfirmationModal';
import PasSibaleLoader from 'components/common/PasSibaleLoader';

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserEmployeeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (!supabaseAdmin) throw new Error('Admin client not initialized');

      // 1. Fetch Auth Users (for email & full_name)
      const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      // 2. Fetch Profiles (for role)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      if (profilesError) throw profilesError;

      // 3. Fetch Employees (for department & position)
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*, departments(name)');
      if (employeesError) throw employeesError;

      // 4. Merge Data
      const mergedUsers: UserEmployeeView[] = authUsers.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        const employee = employees?.find(e => e.profile_id === user.id);
        
        let status: any = 'active';
        if (user.banned_until && new Date(user.banned_until) > new Date()) {
          status = 'banned';
        } else if (!user.email_confirmed_at) {
          status = 'invited';
        } else if (employee?.employment_status) {
          status = employee.employment_status;
        }

        return {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'N/A',
          role: profile?.role || 'viewer',
          status: status,
          created_at: user.created_at,
          department_name: employee?.departments?.name || '-',
          position_title: employee?.position_title || '-',
          employment_type: employee?.employment_type || '-'
        };
      });

      setUsers(mergedUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'super_admin': return <Badge bg="danger"><FontAwesomeIcon icon={faUserShield} className="me-1" />Super Admin</Badge>;
      case 'municipal_admin': return <Badge bg="warning" text="dark"><FontAwesomeIcon icon={faUserTie} className="me-1" />Municipal Admin</Badge>;
      case 'department_head': return <Badge bg="info"><FontAwesomeIcon icon={faUser} className="me-1" />Department Head</Badge>;
      case 'field_officer': return <Badge bg="secondary"><FontAwesomeIcon icon={faMobileAlt} className="me-1" />Field Officer</Badge>;
      case 'officer': return <Badge bg="secondary"><FontAwesomeIcon icon={faMobileAlt} className="me-1" />Officer</Badge>;
      default: return <Badge bg="light" text="dark">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge bg="success">Active</Badge>;
      case 'invited': return <Badge bg="warning" text="dark">Invited</Badge>;
      case 'banned': return <Badge bg="danger">Banned</Badge>;
      case 'suspended': return <Badge bg="danger">Suspended</Badge>;
      case 'inactive': return <Badge bg="secondary">Inactive</Badge>;
      case 'terminated': return <Badge bg="dark">Terminated</Badge>;
      case 'resigned': return <Badge bg="secondary">Resigned</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handleDeleteClick = (userId: string) => {
    setDeleteId(userId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);
      if (!supabaseAdmin) throw new Error('Admin client not initialized');

      // Delete from Auth (this should cascade to profiles/employees if configured, but let's be safe)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(deleteId);
      if (error) throw error;

      // Optimistically update UI
      setUsers(users.filter(user => user.id !== deleteId));
      toast.success('User deleted successfully');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  if (loading) return <PasSibaleLoader />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <Button 
          variant="primary" 
          startIcon={<FontAwesomeIcon icon={faPlus} />}
          onClick={() => navigate('/users/add')}
        >
          Add New User
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
            <Table responsive hover>
              <thead>
              <tr>
                <th>Name / Email</th>
                <th>Role</th>
                <th>Department / Position</th>
                <th>Employment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="fw-bold">{user.full_name}</div>
                    <div className="small text-muted">{user.email}</div>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <div className="fw-bold">{user.department_name}</div>
                    <div className="small text-muted">{user.position_title}</div>
                  </td>
                  <td>
                    <Badge bg="light" text="dark" className="border text-capitalize">{user.employment_type?.replace('_', ' ')}</Badge>
                  </td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>
                    <Link to={`/users/edit-user/${user.id}`} className="btn btn-link p-0 me-2">
                      <FontAwesomeIcon icon={faEdit} />
                    </Link>
                    <Button variant="link" className="p-0 text-danger" onClick={() => handleDeleteClick(user.id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            </Table>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        icon="trash"
      />
    </div>
  );
};

export default UserList;
