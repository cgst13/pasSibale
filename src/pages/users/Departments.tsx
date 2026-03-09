
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, ListGroup, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import Button from 'components/base/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBuilding, faEdit, faTrash, faSave } from '@fortawesome/free-solid-svg-icons';
import { supabase, supabaseAdmin } from 'supabaseClient';
import { Department } from 'types/user';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import ConfirmationModal from 'components/common/ConfirmationModal';
import PasSibaleLoader from 'components/common/PasSibaleLoader';

interface DepartmentFormInputs {
  name: string;
  code: string;
  description: string;
  head_id: string;
}

interface DepartmentWithHead extends Department {
  head?: {
    full_name: string;
  };
}

const Departments = () => {
  const [departments, setDepartments] = useState<DepartmentWithHead[]>([]);
  const [potentialHeads, setPotentialHeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentWithHead | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DepartmentFormInputs>();

  useEffect(() => {
    fetchDepartments();
    fetchPotentialHeads();
  }, []);

  const fetchPotentialHeads = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      setPotentialHeads(data || []);
    } catch (err) {
      console.error('Error fetching potential heads:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          head:head_id (
            full_name
          )
        `)
        .order('name');
      
      if (error) throw error;
      setDepartments((data as DepartmentWithHead[]) || []);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dept?: DepartmentWithHead) => {
    setEditingDept(dept || null);
    if (dept) {
      setValue('name', dept.name);
      setValue('code', dept.code);
      setValue('description', dept.description || '');
      setValue('head_id', dept.head_id || '');
    } else {
      reset({ name: '', code: '', description: '', head_id: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDept(null);
    reset();
  };

  const onSubmit = async (data: DepartmentFormInputs) => {
    setModalLoading(true);
    try {
      if (!supabaseAdmin) throw new Error('Admin client not initialized');

      if (editingDept) {
        // Update
        const { error } = await supabaseAdmin
          .from('departments')
          .update({
            name: data.name,
            code: data.code,
            description: data.description,
            head_id: data.head_id || null
          })
          .eq('id', editingDept.id);
        
        if (error) throw error;
        toast.success('Department updated successfully');
      } else {
        // Create
        const { error } = await supabaseAdmin
          .from('departments')
          .insert({
            name: data.name,
            code: data.code,
            description: data.description,
            head_id: data.head_id || null
          });
        
        if (error) throw error;
        toast.success('Department created successfully');
      }

      await fetchDepartments();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving department:', err);
      toast.error(err.message || 'Failed to save department');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      if (!supabaseAdmin) throw new Error('Admin client not initialized');

      const { error } = await supabaseAdmin
        .from('departments')
        .delete()
        .eq('id', deleteId);
      
      if (error) throw error;
      setDepartments(departments.filter(d => d.id !== deleteId));
      toast.success('Department deleted successfully');
    } catch (err: any) {
      console.error('Error deleting department:', err);
      toast.error(err.message || 'Failed to delete department');
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  if (loading) return <PasSibaleLoader />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Departments</h2>
        <Button 
          variant="primary" 
          startIcon={<FontAwesomeIcon icon={faPlus} />}
          onClick={() => handleOpenModal()}
        >
          Add Department
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Active Departments</h5>
            </Card.Header>
            <Card.Body>
              {departments.length === 0 ? (
                <p className="text-center text-muted py-3">No departments found.</p>
              ) : (
                <ListGroup variant="flush">
                  {departments.map((dept) => (
                    <ListGroup.Item key={dept.id} className="d-flex justify-content-between align-items-center py-3">
                      <div>
                        <div className="fw-bold text-primary">
                          <FontAwesomeIcon icon={faBuilding} className="me-2" />
                          {dept.name} <span className="text-muted fw-normal">({dept.code})</span>
                        </div>
                        {dept.head?.full_name && (
                          <div className="text-muted ms-4 fs--1">
                            <small><strong>Head:</strong> {dept.head.full_name}</small>
                          </div>
                        )}
                        {dept.description && <small className="text-muted ms-4 d-block">{dept.description}</small>}
                      </div>
                      <div>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleOpenModal(dept)}
                        >
                          <FontAwesomeIcon icon={faEdit} /> Edit
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-danger"
                          onClick={() => handleDeleteClick(dept.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} /> Delete
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingDept ? 'Edit Department' : 'Add New Department'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. Human Resources" 
                {...register('name', { required: 'Department Name is required' })}
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department Code</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. HR" 
                {...register('code', { required: 'Code is required' })}
                isInvalid={!!errors.code}
              />
              <Form.Control.Feedback type="invalid">{errors.code?.message}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department Head (Optional)</Form.Label>
              <Form.Select 
                {...register('head_id')}
              >
                <option value="">Select Department Head</option>
                {potentialHeads.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                placeholder="Brief description of the department..." 
                {...register('description')}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={modalLoading} startIcon={<FontAwesomeIcon icon={faSave} />}>
              {modalLoading ? 'Saving...' : 'Save Department'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        icon="trash"
      />
    </div>
  );
};

export default Departments;
