
import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Alert } from 'react-bootstrap';
import Button from 'components/base/Button';
import { useForm, SubmitHandler } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { supabase, supabaseAdmin } from 'supabaseClient';
import { UserRole, EmploymentType, EmploymentStatus, Department } from 'types/user';
import toast from 'react-hot-toast';

interface AddUserFormInputs {
  // Profile
  email: string;
  full_name: string;
  role: UserRole;
  phone_number: string;
  // Employee
  department_id: string; // Will be a select
  position_title: string;
  employment_type: EmploymentType;
  employee_id_number: string;
  date_hired: string;
}

const AddUser = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<AddUserFormInputs>();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase.from('departments').select('*').order('name');
        if (error) throw error;
        setDepartments(data || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const onSubmit: SubmitHandler<AddUserFormInputs> = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!supabaseAdmin) {
        throw new Error('Admin privileges are required to create users. Service Role Key missing.');
      }

      // 1. Invite Auth User using Admin Client
      // This sends a confirmation email to the user to set their password
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        data.email,
        {
          data: {
            full_name: data.full_name
          },
          redirectTo: `${window.location.origin}/pages/authentication/card/set-password`
        }
      );

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. The 'profiles' entry is created automatically by the DB trigger (on_auth_user_created)
      // We just need to update it with the specific role and phone number
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          role: data.role,
          phone_number: data.phone_number
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // 3. Create Employee Record
      const validDepartmentId = data.department_id || null;

      const { error: employeeError } = await supabaseAdmin
        .from('employees')
        .insert({
          profile_id: authData.user.id,
          department_id: validDepartmentId, 
          position_title: data.position_title,
          employee_id_number: data.employee_id_number,
          employment_type: data.employment_type,
          date_hired: data.date_hired || new Date().toISOString()
        });
      
      if (employeeError) throw employeeError;

      toast.success('User invited successfully! Confirmation email sent.');
      setTimeout(() => navigate('/users/list'), 2000);

    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Add New User</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/users/list')} startIcon={<FontAwesomeIcon icon={faArrowLeft} />}>
          Back to List
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row>
          {/* Account Information */}
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Account Information</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. Juan Dela Cruz" 
                    {...register('full_name', { required: 'Full Name is required' })} 
                    isInvalid={!!errors.full_name}
                  />
                  <Form.Control.Feedback type="invalid">{errors.full_name?.message}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="name@passibale.com" 
                    {...register('email', { required: 'Email is required' })}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="+63 900 000 0000" 
                    {...register('phone_number')}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>System Role</Form.Label>
                  <Form.Select {...register('role', { required: true })}>
                    <option value="viewer">Viewer</option>
                    <option value="field_officer">Field Officer</option>
                    <option value="officer">Officer</option>
                    <option value="department_head">Department Head</option>
                    <option value="municipal_admin">Municipal Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Employment Information */}
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Employment Details</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select {...register('department_id')}>
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Position Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. Administrative Officer I" 
                    {...register('position_title', { required: 'Position is required' })}
                    isInvalid={!!errors.position_title}
                  />
                  <Form.Control.Feedback type="invalid">{errors.position_title?.message}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Employee ID Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. EMP-2023-001" 
                    {...register('employee_id_number')}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Employment Type</Form.Label>
                  <Form.Select {...register('employment_type')}>
                    <option value="permanent">Permanent</option>
                    <option value="contractual">Contractual</option>
                    <option value="job_order">Job Order</option>
                    <option value="consultant">Consultant</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date Hired</Form.Label>
                  <Form.Control 
                    type="date" 
                    {...register('date_hired')}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="d-flex justify-content-end">
          <Button variant="primary" type="submit" disabled={loading} startIcon={<FontAwesomeIcon icon={faSave} />}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AddUser;
