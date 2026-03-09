
import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Button from 'components/base/Button';
import { useForm, SubmitHandler } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faCamera } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router';
import { supabase, supabaseAdmin } from 'supabaseClient';
import { UserRole, EmploymentType, Department } from 'types/user';
import toast from 'react-hot-toast';
import Avatar from 'components/base/Avatar';
import defaultAvatar from 'assets/img/team/avatar.webp';

interface EditUserFormInputs {
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

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSelfProfile, setIsSelfProfile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<EditUserFormInputs>();

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

    const fetchUser = async () => {
      try {
        setFetching(true);
        
        // Get current authenticated user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error('Not authenticated');
        setCurrentUserId(currentUser.id);

        // Determine target ID: either URL param or current user's ID
        // If route is /users/profile, id is undefined, so we use currentUser.id
        const targetId = id || currentUser.id;
        setIsSelfProfile(targetId === currentUser.id);

        // If editing self, we can use regular client for profile/employee data
        // But if editing others, we might need admin client depending on policies.
        // For now, let's try standard client first as it's safer, 
        // falling back to admin if needed/available and allowed.
        
        // 1. Fetch Auth User Metadata (Requires Admin for others, but self can get via getUser)
        let userData: any = null;
        
        if (targetId === currentUser.id) {
            userData = currentUser;
        } else {
            if (!supabaseAdmin) throw new Error('Admin privileges required to view other users');
            const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(targetId);
            if (error) throw error;
            userData = user;
        }

        if (!userData) throw new Error('User not found');

        // 2. Fetch Profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .single();
        if (profileError) throw profileError;

        // 3. Fetch Employee
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('profile_id', targetId)
          .single();
        
        // Employee might not exist if data is inconsistent, but we proceed
        if (employeeError && employeeError.code !== 'PGRST116') throw employeeError;

        // Set form values
        setValue('email', userData.email || '');
        setValue('full_name', userData.user_metadata?.full_name || '');
        setValue('role', profile.role);
        setValue('phone_number', profile.phone_number || '');
        setAvatarUrl(userData.user_metadata?.avatar_url || profile.avatar_url || null);
        
        if (employee) {
          setValue('department_id', employee.department_id || '');
          setValue('position_title', employee.position_title || '');
          setValue('employee_id_number', employee.employee_id_number || '');
          setValue('employment_type', employee.employment_type || 'permanent');
          
          if (employee.date_hired) {
             setValue('date_hired', new Date(employee.date_hired).toISOString().split('T')[0]);
          }
        }

      } catch (err: any) {
        console.error('Error fetching user details:', err);
        setError(err.message || 'Failed to load user details');
      } finally {
        setFetching(false);
      }
    };

    fetchDepartments();
    fetchUser();
  }, [id, setValue]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, this error might occur.
        // Try creating the bucket if we have admin rights (or just log it)
        // Usually bucket creation is a one-time setup in Supabase dashboard or migration.
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image. Please ensure the "avatars" bucket exists and is public.');
      }

      // Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Update local state to show preview immediately
      setAvatarUrl(publicUrl);

      // We will save the URL to the DB when the form is submitted, or we can update it immediately here.
      // For better UX, let's just keep it in state and save it with the rest of the form.
      // But actually, for profile pics, immediate save is often expected or easier to manage.
      // Let's stick to "save on submit" pattern to keep it transactional with other changes, 
      // OR just update the state variable which is then used in onSubmit.
      // We need to make sure onSubmit uses this new avatarUrl.

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit: SubmitHandler<EditUserFormInputs> = async (data) => {
    const targetId = id || currentUserId;
    if (!targetId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update Auth User (Email & Metadata)
      // Only Admin can update other users' auth data via admin API.
      // Self can update own metadata via updateUser.
      if (isSelfProfile) {
          const { error } = await supabase.auth.updateUser({
            email: data.email,
            data: { 
                full_name: data.full_name,
                avatar_url: avatarUrl // Include avatar_url in metadata
            }
          });
          if (error) throw error;
      } else {
          if (!supabaseAdmin) throw new Error('Admin privileges required');
          const { error } = await supabaseAdmin.auth.admin.updateUserById(targetId, {
            email: data.email,
            user_metadata: { 
                full_name: data.full_name,
                avatar_url: avatarUrl // Include avatar_url in metadata
            }
          });
          if (error) throw error;
      }

      // 2. Update Profile
      // RLS should allow users to update their own profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          // Only allow role update if admin? For now assume form access implies permission
          // But usually regular users shouldn't change their own role.
          // Let's keep it simple: if self, maybe don't update role?
          // Or trust the UI to disable the field.
          ...(isSelfProfile ? {} : { role: data.role }), // Prevent self-role change for safety unless logic added
          phone_number: data.phone_number,
          avatar_url: avatarUrl // Update profile table as well
        })
        .eq('id', targetId);

      if (profileError) throw profileError;

      // 3. Update Employee Record
      // Check if employee record exists first
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('profile_id', targetId)
        .single();

      const employeeData = {
        department_id: data.department_id || null,
        position_title: data.position_title,
        employee_id_number: data.employee_id_number,
        employment_type: data.employment_type,
        date_hired: data.date_hired || new Date().toISOString()
      };

      let employeeError;
      if (existingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('profile_id', targetId);
        employeeError = error;
      } else {
        const { error } = await supabase
          .from('employees')
          .insert({
            profile_id: targetId,
            ...employeeData
          });
        employeeError = error;
      }
      
      if (employeeError) throw employeeError;

      toast.success('Profile updated successfully!');
      // If self profile, maybe just stay? Or redirect to dashboard?
      if (!isSelfProfile) {
         setTimeout(() => navigate('/users/list'), 1500);
      }

    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isSelfProfile ? 'My Profile' : 'Edit User'}</h2>
        {!isSelfProfile && (
          <Button variant="outline-secondary" onClick={() => navigate('/users/list')} startIcon={<FontAwesomeIcon icon={faArrowLeft} />}>
            Back to List
          </Button>
        )}
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
                <div className="d-flex flex-column align-items-center mb-4">
                  <div className="position-relative">
                    <Avatar 
                      src={avatarUrl || defaultAvatar} 
                      size="3xl" 
                      className="rounded-circle border border-2 border-white shadow-sm"
                    />
                    <label 
                      htmlFor="avatar-upload" 
                      className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 cursor-pointer shadow-sm hover-bg-primary-dark transition-base d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px' }}
                    >
                      {uploadingAvatar ? (
                        <Spinner animation="border" size="sm" variant="white" />
                      ) : (
                        <FontAwesomeIcon icon={faCamera} size="sm" />
                      )}
                    </label>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      accept="image/*" 
                      className="d-none" 
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </div>
                  <p className="text-body-tertiary fs-9 mt-2 mb-0">Allowed *.jpeg, *.jpg, *.png, *.webp</p>
                </div>

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
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditUser;
