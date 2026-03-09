
import { useState, useEffect } from 'react';
import { Button, Card, Col, Form, Row, InputGroup, ListGroup, Badge, Container } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faArrowLeft, 
  faUserCheck, 
  faCheckCircle, 
  faExclamationCircle, 
  faUser, 
  faFileAlt, 
  faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';
import { getProgram, createEnrollment, getEnrollmentsByCitizen } from 'services/programService';
import { searchCitizens } from 'services/citizenService';
import { ProgramDefinition, ProgramField } from 'types/program';
import { corePrograms } from 'data/corePrograms';
import { Citizen } from 'types/citizen';
import { toast } from 'react-hot-toast';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import Avatar from 'components/base/Avatar';
import useDebounce from 'hooks/useDebounce';
import { checkEligibility } from 'utils/programUtils';

const ProgramRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<ProgramDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Citizen[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; reasons: string[] }>({ eligible: true, reasons: [] });
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchProgram = async () => {
      if (!id) return;
      
      setLoading(true);

      // Check if it's a core program first
      const coreProgram = corePrograms.find(p => p.id === id);
      if (coreProgram) {
        // Construct a compatible ProgramDefinition
        // Since core programs don't have fields defined, we'll add some default ones
        const defaultFields: ProgramField[] = [
          { id: 'application_date', label: 'Application Date', type: 'date', required: true },
          { id: 'remarks', label: 'Remarks/Notes', type: 'textarea', required: false }
        ];

        setProgram({
          ...coreProgram,
          fields: defaultFields,
          created_at: new Date().toISOString()
        } as unknown as ProgramDefinition);
        
        setLoading(false);
        return;
      }

      try {
        const data = await getProgram(id);
        setProgram(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load program details');
        navigate('/programs');
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [id, navigate]);

  useEffect(() => {
    const search = async () => {
      if (!debouncedSearchQuery) {
        setSearchResults([]);
        return;
      }
      
      try {
        setIsSearching(true);
        // Only fetch citizens who are NOT enrolled in the current program if possible, 
        // or filter them client-side after search.
        // For now, we search all and check enrollment status on selection.
        const results = await searchCitizens(debouncedSearchQuery);
        
        // Enhance results with enrollment status if needed, 
        // but it's better to do this check when a specific citizen is selected 
        // to avoid N+1 queries during search.
        setSearchResults(results || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    };
    search();
  }, [debouncedSearchQuery]);

  // Check if citizen is already enrolled when selected
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!selectedCitizen || !id) return;
      
      try {
        const enrollments = await getEnrollmentsByCitizen(selectedCitizen.id);
        const alreadyEnrolled = enrollments.some(e => e.program_id === id);
        setIsEnrolled(alreadyEnrolled);
      } catch (error) {
        console.error(error);
      }
    };
    checkEnrollment();
  }, [selectedCitizen, id]);

  const handleCitizenSelect = async (citizen: Citizen) => {
    setSearchQuery('');
    setSearchResults([]);
    
    // Check eligibility
    if (program) {
        const check = checkEligibility(citizen, program);
        setEligibility(check);
    }
    
    // Set default values from program fields
    const defaultValues: Record<string, any> = {};
    if (program?.fields) {
      program.fields.forEach(field => {
        if (field.defaultValue !== undefined && field.defaultValue !== '') {
          defaultValues[field.label] = field.defaultValue;
        }
      });
    }
    
    reset(defaultValues); 
    
    // Check status first
    try {
        const enrollments = await getEnrollmentsByCitizen(citizen.id);
        const alreadyEnrolled = enrollments.some(e => e.program_id === id);
        setIsEnrolled(alreadyEnrolled);
        setSelectedCitizen(citizen);
    } catch (error) {
        console.error(error);
        setSelectedCitizen(citizen); // Fallback
    }
  };

  const onSubmit = async (data: any) => {
    if (!selectedCitizen || !program) return;
    
    try {
      setLoading(true);
      await createEnrollment({
        program_id: program.id,
        citizen_id: selectedCitizen.id,
        data: data,
        status: 'Active',
        enrollment_date: new Date().toISOString()
      });
      
      toast.success('Citizen enrolled successfully');
      
      // Reset state to go back to search
      setTimeout(() => {
        setSelectedCitizen(null);
        setIsEnrolled(false);
        setSearchQuery('');
        setSearchResults([]);
        reset();
      }, 100);
    } catch (error) {
      console.error(error);
      toast.error('Failed to enroll citizen');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', url: '/' },
    { label: 'Programs', url: '/programs' },
    { label: 'Registration', active: true }
  ];

  if (loading && !program) return <PasSibaleLoader />;

  return (
    <div>
      <div className="mb-9">
        {/* Header Section */}
        <div className="d-flex align-items-center justify-content-between mb-5">
          <div className="d-flex align-items-center">
            <Button 
              variant="phoenix-secondary" 
              className="me-3 p-2 rounded-circle shadow-sm"
              onClick={() => navigate('/programs')}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Button>
            <div>
              <PageBreadcrumb items={breadcrumbItems} className="mb-1" />
              <h2 className="mb-0 fw-bold">{program?.name}</h2>
            </div>
          </div>
        </div>

        {!selectedCitizen ? (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <Card className="border-0 shadow-lg w-100" style={{ maxWidth: '600px' }}>
                    <Card.Body className="p-5 text-center">
                        <div className="mb-4">
                            <div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle" style={{ width: '80px', height: '80px' }}>
                                <FontAwesomeIcon icon={faUser} size="2x" />
                            </div>
                        </div>
                        <h3 className="mb-2 fw-bold">Find an Applicant</h3>
                        <p className="text-body-tertiary mb-4">Search for a citizen by name or ID to begin the enrollment process.</p>
                        
                        <div className="position-relative text-start">
                            <InputGroup className="input-group-lg shadow-sm border rounded-3 overflow-hidden">
                                <InputGroup.Text className="bg-white border-0 ps-4">
                                    <FontAwesomeIcon icon={faSearch} className="text-body-quaternary" />
                                </InputGroup.Text>
                                <Form.Control
                                    className="border-0 ps-2 py-3"
                                    placeholder="Type name or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    style={{ fontSize: '1.1rem' }}
                                />
                            </InputGroup>

                            {isSearching && (
                                <div className="d-flex justify-content-center py-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                    <span className="ms-2 fs-9 text-body-tertiary">Searching database...</span>
                                </div>
                            )}

                            {searchResults.length > 0 && (
                                <ListGroup className="position-absolute w-100 shadow-lg border-0 rounded-3 overflow-hidden mt-2" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                                    {searchResults.map(citizen => (
                                        <ListGroup.Item 
                                            key={citizen.id} 
                                            action 
                                            onClick={() => handleCitizenSelect(citizen)}
                                            className="d-flex align-items-center gap-3 py-3 border-bottom border-light px-4"
                                        >
                                            <Avatar src={citizen.photoUrl} size="l" rounded="circle" className="border border-2 border-white shadow-sm" />
                                            <div>
                                                <h6 className="mb-0 fw-bold text-body-highlight">{citizen.firstName} {citizen.lastName}</h6>
                                                <div className="d-flex align-items-center mt-1">
                                                    <Badge bg="secondary" className="fs-10 fw-normal me-2">ID: {citizen.id.slice(0, 8)}</Badge>
                                                    <small className="text-body-tertiary">{citizen.barangay}</small>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </div>
                    </Card.Body>
                    <Card.Footer className="bg-body-tertiary border-top-0 p-3 text-center">
                        <small className="text-body-quaternary">
                            <FontAwesomeIcon icon={faInfoCircle} className="me-1" /> 
                            Program: <span className="fw-semibold text-body-secondary">{program?.name}</span>
                        </small>
                    </Card.Footer>
                </Card>
            </div>
        ) : (
            <Row className="g-4">
                <Col xl={4}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="p-4 text-center">
                            <div className="position-absolute top-0 end-0 p-3">
                                <Button 
                                    variant="subtle-secondary" 
                                    size="sm"
                                    className="rounded-pill"
                                    onClick={() => {
                                        setSelectedCitizen(null);
                                        setIsEnrolled(false);
                                        setSearchQuery('');
                                        reset();
                                    }}
                                >
                                    Change
                                </Button>
                            </div>
                            
                            <Avatar src={selectedCitizen.photoUrl} size="4xl" rounded="circle" className="border border-4 border-white shadow mb-3 mt-2" />
                            <h4 className="mb-1 text-body-highlight">{selectedCitizen.firstName} {selectedCitizen.lastName}</h4>
                            <p className="text-body-tertiary mb-3">{selectedCitizen.barangay}, {selectedCitizen.cityMunicipality}</p>
                            
                            <div className="d-flex justify-content-center gap-2 mb-4">
                                <Badge bg="subtle-secondary" className="text-secondary px-3 py-2 rounded-pill border border-secondary-subtle">
                                    ID: {selectedCitizen.id}
                                </Badge>
                            </div>

                            {isEnrolled ? (
                                <div className="alert alert-warning border-0 rounded-3 text-start d-flex align-items-start p-3 mb-0 bg-warning-subtle text-warning-emphasis">
                                    <FontAwesomeIcon icon={faExclamationCircle} className="mt-1 me-3 fs-5" />
                                    <div>
                                        <strong>Already Enrolled</strong>
                                        <p className="mb-0 fs-9 mt-1 opacity-75">This citizen is currently an active participant in this program.</p>
                                    </div>
                                </div>
                            ) : !eligibility.eligible ? (
                                <div className="alert alert-danger border-0 rounded-3 text-start d-flex align-items-start p-3 mb-0 bg-danger-subtle text-danger-emphasis">
                                    <FontAwesomeIcon icon={faExclamationCircle} className="mt-1 me-3 fs-5" />
                                    <div>
                                        <strong>Not Eligible</strong>
                                        <ul className="mb-0 fs-9 mt-1 opacity-75 ps-3">
                                            {eligibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-success border-0 rounded-3 text-start d-flex align-items-center p-3 mb-0 bg-success-subtle text-success-emphasis">
                                    <FontAwesomeIcon icon={faCheckCircle} className="fs-4 me-3" />
                                    <div>
                                        <strong className="d-block">Eligible</strong>
                                        <span className="fs-9 opacity-75">Ready for enrollment.</span>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm bg-primary-subtle">
                        <Card.Body className="p-4">
                            <h6 className="text-primary-emphasis mb-3 fw-bold text-uppercase ls-1">Program Context</h6>
                            <h5 className="mb-2 text-primary-dark fw-bold">{program?.name}</h5>
                            <p className="text-primary-emphasis opacity-75 fs-9 mb-0">
                                {program?.description || 'No detailed description available.'}
                            </p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={8}>
                    <Card className="border-0 shadow-sm h-100">
                         <div className="card-header border-bottom border-translucent p-4 bg-body-highlight">
                            <h4 className="mb-0">Application Details</h4>
                        </div>
                        <Card.Body className="p-4 p-lg-5">
                            {isEnrolled ? (
                                <div className="text-center py-5">
                                    <div className="mb-3 text-warning">
                                        <FontAwesomeIcon icon={faExclamationCircle} size="3x" />
                                    </div>
                                    <h4 className="text-body-highlight mb-2">Already Enrolled</h4>
                                    <p className="text-body-tertiary mw-md mx-auto">
                                        This citizen is already a beneficiary of this program.
                                    </p>
                                    <Button variant="outline-warning" onClick={() => setSelectedCitizen(null)}>
                                        Select Another Citizen
                                    </Button>
                                </div>
                            ) : !eligibility.eligible ? (
                                <div className="text-center py-5">
                                    <div className="mb-3 text-danger">
                                        <FontAwesomeIcon icon={faExclamationCircle} size="3x" />
                                    </div>
                                    <h4 className="text-body-highlight mb-2">Registration Restricted</h4>
                                    <p className="text-body-tertiary mw-md mx-auto">
                                        This citizen does not meet the eligibility criteria for this program.
                                    </p>
                                    <Button variant="outline-danger" onClick={() => setSelectedCitizen(null)}>
                                        Select Another Citizen
                                    </Button>
                                </div>
                            ) : (
                                <Form onSubmit={handleSubmit(onSubmit)} className="h-100 d-flex flex-column">
                                    <div className="mb-5">
                                        {program?.fields.length === 0 ? (
                                            <div className="text-center py-5 bg-body-highlight rounded-3 border border-dashed">
                                                <p className="text-body-tertiary mb-0 fst-italic">This program requires no additional data collection.</p>
                                                <p className="fs-9 text-body-quaternary">Click submit to confirm enrollment.</p>
                                            </div>
                                        ) : (
                                            <Row className="g-4">
                                                {program?.fields.map(field => (
                                                    <Col md={field.type === 'textarea' ? 12 : 6} key={field.id}>
                                                        <Form.Group>
                                                            {field.type !== 'checkbox' && (
                                                                <Form.Label className="fw-bold fs-9 text-uppercase text-body-secondary mb-2">
                                                                    {field.label} {field.required && <span className="text-danger">*</span>}
                                                                </Form.Label>
                                                            )}
                                                            
                                                            {field.type === 'textarea' ? (
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={4}
                                                                    className="form-control-lg bg-body-highlight border-translucent"
                                                                    placeholder={`Enter ${field.label}...`}
                                                                    {...register(field.label, { required: field.required })}
                                                                    isInvalid={!!errors[field.label]}
                                                                />
                                                            ) : field.type === 'select' ? (
                                                                <Form.Select
                                                                    className="form-select-lg bg-body-highlight border-translucent"
                                                                    {...register(field.label, { required: field.required })}
                                                                    isInvalid={!!errors[field.label]}
                                                                >
                                                                    <option value="">Select Option...</option>
                                                                    {field.options?.map((opt: string) => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </Form.Select>
                                                            ) : field.type === 'checkbox' ? (
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    id={`field-${field.id}`}
                                                                    label={field.label}
                                                                    className="fs-9"
                                                                    {...register(field.label)}
                                                                />
                                                            ) : (
                                                                <Form.Control
                                                                    type={field.type}
                                                                    className="form-control-lg bg-body-highlight border-translucent"
                                                                    placeholder={`Enter ${field.label}`}
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
                                    </div>

                                    <div className="mt-auto pt-4 border-top border-translucent d-flex justify-content-end gap-3">
                                        <Button 
                                            variant="phoenix-secondary" 
                                            size="lg" 
                                            onClick={() => navigate('/programs')}
                                            className="px-4"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            variant="primary" 
                                            size="lg" 
                                            disabled={loading}
                                            className="px-5 shadow-lg"
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                                    Submit Application
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        )}
      </div>
    </div>
  );
};

export default ProgramRegistration;
