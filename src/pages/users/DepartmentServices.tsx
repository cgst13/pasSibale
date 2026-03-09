
import { useState, useEffect } from 'react';
import { Button, Card, Col, Form, Modal, Row, Table, Badge, OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faClock, faInfoCircle, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { getDepartmentServices, createDepartmentService, updateDepartmentService, deleteDepartmentService } from 'services/departmentService';
import { supabase } from 'services/supabaseClient';
import { Department, DepartmentService } from 'types/department';
import { toast } from 'react-hot-toast';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import ConfirmationModal from 'components/common/ConfirmationModal';

interface ServiceFormData {
  department_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  requirements: string; // Comma separated for form input
  status: 'Active' | 'Inactive';
}

const DepartmentServices = () => {
  const [services, setServices] = useState<DepartmentService[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<DepartmentService | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ServiceFormData>({
    defaultValues: {
      status: 'Active',
      duration_minutes: 15
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesData, { data: deptsData }] = await Promise.all([
        getDepartmentServices(selectedDeptFilter || undefined),
        supabase.from('departments').select('*').order('name')
      ]);
      
      setServices(servicesData || []);
      setDepartments((deptsData as Department[]) || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDeptFilter]);

  const handleOpenModal = (service?: DepartmentService) => {
    setEditingService(service || null);
    if (service) {
      setValue('department_id', service.department_id);
      setValue('name', service.name);
      setValue('description', service.description || '');
      setValue('duration_minutes', service.duration_minutes);
      setValue('requirements', service.requirements?.join(', ') || '');
      setValue('status', service.status);
    } else {
      reset({
        department_id: '',
        name: '',
        description: '',
        duration_minutes: 15,
        requirements: '',
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const requirementsArray = data.requirements
        .split(',')
        .map(r => r.trim())
        .filter(Boolean);

      const serviceData = {
        department_id: data.department_id,
        name: data.name,
        description: data.description,
        duration_minutes: Number(data.duration_minutes),
        requirements: requirementsArray,
        status: data.status
      };

      if (editingService) {
        await updateDepartmentService(editingService.id, serviceData);
        toast.success('Service updated successfully');
      } else {
        await createDepartmentService(serviceData);
        toast.success('Service created successfully');
      }
      
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save service');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDepartmentService(deleteId);
      setServices(services.filter(s => s.id !== deleteId));
      toast.success('Service deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete service');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', url: '/' },
    { label: 'Departments', active: true },
    { label: 'Services', active: true }
  ];

  if (loading && services.length === 0 && departments.length === 0) return <PasSibaleLoader />;

  return (
    <div>
      <div className="mb-9">
        {/* Header Section */}
        <div className="d-flex align-items-center justify-content-between mb-5">
          <div>
            <h2 className="mb-0 fw-bold">Department Services</h2>
            <p className="text-body-tertiary mb-0 fs-9">Manage services and requirements for each department</p>
          </div>
          <div className="d-flex gap-3">
            <Form.Select 
              value={selectedDeptFilter} 
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="shadow-sm border-0 bg-body-highlight"
              style={{ minWidth: '250px' }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Form.Select>
            <Button variant="primary" onClick={() => handleOpenModal()} className="shadow-sm">
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Service
            </Button>
          </div>
        </div>

        <div className="border-top border-translucent">
          {services.length === 0 ? (
            <div className="text-center p-5 border-bottom border-translucent bg-body-highlight">
              <FontAwesomeIcon icon={faBuilding} className="text-body-quaternary mb-3" size="3x" />
              <h5 className="text-body-secondary">No services found</h5>
              <p className="text-body-tertiary mb-0 fs-9">Select a different department or add a new service to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 border-bottom border-translucent">
                <thead>
                  <tr className="bg-body-highlight">
                    <th className="py-3 ps-4" style={{ width: '25%' }}>Service Name</th>
                    <th className="py-3" style={{ width: '20%' }}>Department</th>
                    <th className="py-3" style={{ width: '30%' }}>Description</th>
                    <th className="py-3" style={{ width: '10%' }}>Duration</th>
                    <th className="py-3" style={{ width: '10%' }}>Status</th>
                    <th className="py-3 pe-4 text-end" style={{ width: '5%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service.id} className="align-middle">
                      <td className="ps-4">
                        <div className="fw-semibold text-body-highlight">{service.name}</div>
                      </td>
                      <td>
                        <span className="text-body-secondary">
                          {service.departments?.name || departments.find(d => d.id === service.department_id)?.name || 'Unknown'}
                        </span>
                      </td>
                      <td>
                         <p className="text-body-secondary mb-0 text-truncate" style={{ maxWidth: '350px' }}>
                           {service.description || '-'}
                         </p>
                      </td>
                      <td>
                        <span className="text-body-secondary fs-9">
                          {service.duration_minutes} mins
                        </span>
                      </td>
                      <td>
                        <Badge 
                          bg={service.status === 'Active' ? 'success-subtle' : 'secondary-subtle'} 
                          className={`rounded-pill px-2 py-1 fs-10 fw-bold ${service.status === 'Active' ? 'text-success' : 'text-secondary'}`}
                        >
                          {service.status}
                        </Badge>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          <Button variant="link" size="sm" className="p-0 text-body-secondary hover-text-primary" onClick={() => handleOpenModal(service)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button variant="link" size="sm" className="p-0 text-body-secondary hover-text-danger" onClick={() => handleDeleteClick(service.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingService ? 'Edit Service' : 'Add New Service'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Select 
                    {...register('department_id', { required: 'Department is required' })}
                    isInvalid={!!errors.department_id}
                  >
                    <option value="">Select Department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.department_id?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={8}>
                <Form.Group>
                  <Form.Label>Service Name</Form.Label>
                  <Form.Control 
                    {...register('name', { required: 'Service name is required' })}
                    placeholder="e.g., Water Bill Payment"
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Allotted Time (Minutes)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><FontAwesomeIcon icon={faClock} /></InputGroup.Text>
                    <Form.Control 
                      type="number"
                      {...register('duration_minutes', { required: true, min: 1 })}
                      isInvalid={!!errors.duration_minutes}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={3}
                    {...register('description')}
                    placeholder="Describe the service process..."
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Requirements <small className="text-muted">(Comma separated)</small></Form.Label>
                  <Form.Control 
                    {...register('requirements')}
                    placeholder="e.g., Valid ID, Proof of Billing, Application Form"
                  />
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Check 
                  type="switch"
                  id="status-switch"
                  label="Active Service"
                  defaultChecked={true}
                  {...register('status')}
                  onChange={(e) => setValue('status', e.target.checked ? 'Active' : 'Inactive')}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Service</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        icon="trash"
      />
    </div>
  );
};

export default DepartmentServices;
