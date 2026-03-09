
import { useState, useEffect } from 'react';
import { Button, Card, Col, Form, Modal, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { getPrograms, getEnrollmentsByCitizen, createEnrollment } from 'services/programService';
import { ProgramDefinition, ProgramEnrollment } from 'types/program';
import { toast } from 'react-hot-toast';
import PasSibaleLoader from 'components/common/PasSibaleLoader';

interface CitizenProgramsTabProps {
  citizenId: string;
  readOnly?: boolean;
}

const CitizenProgramsTab = ({ citizenId, readOnly = false }: CitizenProgramsTabProps) => {
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [programs, setPrograms] = useState<ProgramDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  
  // Form handling
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, programsData] = await Promise.all([
        getEnrollmentsByCitizen(citizenId),
        getPrograms()
      ]);
      setEnrollments(enrollmentsData || []);
      setPrograms(programsData || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load program data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [citizenId]);

  const handleEnrollClick = () => {
    setSelectedProgramId('');
    reset();
    setShowEnrollModal(true);
  };

  const onSubmit = async (data: any) => {
    if (!selectedProgramId) {
      toast.error('Please select a program');
      return;
    }

    try {
      // Separate program selection from dynamic data
      const dynamicData = { ...data };
      
      await createEnrollment({
        program_id: selectedProgramId,
        citizen_id: citizenId,
        data: dynamicData,
        status: 'Active',
        enrollment_date: new Date().toISOString()
      });
      
      toast.success('Citizen enrolled successfully');
      setShowEnrollModal(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error('Failed to enroll citizen');
    }
  };

  const availablePrograms = programs.filter(
    p => !enrollments.some(e => e.program_id === p.id)
  );

  if (loading) return <PasSibaleLoader />;

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h6 className="text-body-highlight fw-bold mb-0 text-uppercase ls-1">Program Enrollments</h6>
        {!readOnly && (
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleEnrollClick}
          disabled={availablePrograms.length === 0}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Enroll New Program
        </Button>
        )}
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center p-5 border border-dashed rounded-3 bg-body-tertiary">
          <p className="text-body-tertiary mb-0 fs-9">No active program enrollments found.</p>
        </div>
      ) : (
        <Row className="g-3">
          {enrollments.map(enrollment => (
            <Col xs={12} key={enrollment.id}>
              <Card className="h-100 border shadow-none bg-body-highlight-hover transition-base">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-0 fw-bold text-primary">{enrollment.program?.name}</h6>
                      <p className="fs-10 text-body-tertiary mb-0">
                        Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="fs-10">
                    {enrollment.program?.fields?.map(field => (
                      <div key={field.id} className="d-flex align-items-baseline mb-1">
                        <span className="fw-semibold text-body-secondary me-2" style={{ minWidth: '120px' }}>{field.label}:</span>
                        <span className="text-body-highlight">
                          {enrollment.data?.[field.label]?.toString() || 'N/A'}
                        </span>
                      </div>
                    ))}
                    {(!enrollment.program?.fields || enrollment.program.fields.length === 0) && (
                       <span className="text-body-quaternary fst-italic">No specific data recorded.</span>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Enroll Modal */}
      <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Enroll Citizen in Program</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-4">
              <Form.Label>Select Program</Form.Label>
              <Form.Select 
                value={selectedProgramId} 
                onChange={(e) => {
                  setSelectedProgramId(e.target.value);
                  reset(); // Reset form fields when program changes
                }}
              >
                <option value="">-- Select a Program --</option>
                {availablePrograms.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
              {availablePrograms.length === 0 && (
                 <Form.Text className="text-muted">
                   This citizen is already enrolled in all available programs.
                 </Form.Text>
              )}
            </Form.Group>

            {selectedProgram && (
              <div className="border-top pt-4">
                <h6 className="mb-3">Program Details</h6>
                {selectedProgram.fields.length === 0 ? (
                  <p className="text-muted fst-italic">This program has no specific fields defined.</p>
                ) : (
                  <Row className="g-3">
                    {selectedProgram.fields.map(field => (
                      <Col md={field.type === 'textarea' ? 12 : 6} key={field.id}>
                        <Form.Group>
                          <Form.Label>
                            {field.label} {field.required && <span className="text-danger">*</span>}
                          </Form.Label>
                          
                          {field.type === 'textarea' ? (
                            <Form.Control
                              as="textarea"
                              rows={3}
                              {...register(field.label, { required: field.required })}
                              isInvalid={!!errors[field.label]}
                            />
                          ) : field.type === 'select' ? (
                            <Form.Select
                              {...register(field.label, { required: field.required })}
                              isInvalid={!!errors[field.label]}
                            >
                              <option value="">Select...</option>
                              {field.options?.map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </Form.Select>
                          ) : (
                            <Form.Control
                              type={field.type}
                              {...register(field.label, { required: field.required })}
                              isInvalid={!!errors[field.label]}
                            />
                          )}
                          
                          {errors[field.label] && (
                            <Form.Control.Feedback type="invalid">
                              This field is required
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>
                )}
                
                <div className="d-flex justify-content-end mt-4">
                  <Button variant="secondary" className="me-2" onClick={() => setShowEnrollModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Confirm Enrollment
                  </Button>
                </div>
              </div>
            )}
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CitizenProgramsTab;
