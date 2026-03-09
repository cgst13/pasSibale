
import { useState, useEffect } from 'react';
import { Button, Card, Col, Row, Modal, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faDatabase, faRocket, faCheckCircle, faBuilding, faEdit, faUsers } from '@fortawesome/free-solid-svg-icons';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import { getPrograms, deleteProgram } from 'services/programService';
import { ProgramDefinition } from 'types/program';
import { toast } from 'react-hot-toast';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import ConfirmationModal from 'components/common/ConfirmationModal';
import { UilDatabase } from '@iconscout/react-unicons';
import { corePrograms } from 'data/corePrograms';
import { getProgramIcon, getProgramColor } from 'utils/programUtils';

const ProgramList = () => {
  const [programs, setPrograms] = useState<(ProgramDefinition & { enrollment_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramDefinition | null>(null);
  const navigate = useNavigate();

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const data = await getPrograms();
      setPrograms(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleDeleteClick = (program: ProgramDefinition) => {
    setSelectedProgram(program);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProgram) return;
    try {
      await deleteProgram(selectedProgram.id);
      setPrograms(programs.filter(p => p.id !== selectedProgram.id));
      toast.success('Program deleted successfully');
      setShowDeleteModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete program');
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', url: '/' },
    { label: 'Programs', active: true }
  ];

  if (loading) return <PasSibaleLoader />;

  return (
    <div>
      <PageBreadcrumb items={breadcrumbItems} />
      <div className="mb-9">
        <Row className="g-3 mb-4">
          <Col xs="auto">
            <h2 className="mb-0">Programs & Services</h2>
          </Col>
        </Row>
        
        {/* Fixed Programs Section */}
        <div className="mb-6">
          <h4 className="mb-3 text-body-secondary">Core Programs</h4>
          <Row className="g-4">
            {corePrograms.map(program => (
              <Col key={program.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                <Card className="h-100 border-0 shadow-sm hover-actions-trigger bg-body-highlight">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                      <div className={`avatar-m bg-${program.color}-subtle rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm`}>
                        <FontAwesomeIcon icon={program.icon} className={`text-${program.color} fs-6`} />
                      </div>
                      <h5 className="mb-0 text-body-highlight fw-bold lh-sm text-truncate-2">{program.name}</h5>
                    </div>
                    <p className="text-body-secondary fs-9 mb-4 flex-grow-1 line-clamp-2">
                      {program.description}
                    </p>
                    <div className="mt-auto">
                      <Button 
                        variant={`outline-${program.color}`}
                        size="sm" 
                        className="w-100 fw-bold"
                        as={Link}
                        to={`/programs/dashboard/${program.id}`}
                      >
                        <FontAwesomeIcon icon={faRocket} className="me-2" />
                        Launch Program
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <hr className="my-5 border-translucent" />

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0 text-body-secondary">Custom Programs</h4>
          <Button as={Link} to="/programs/create" variant="primary" size="sm">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Create New
          </Button>
        </div>

        <Row className="g-4">
          {programs.length === 0 ? (
             <Col xs={12}>
               <div className="text-center p-5 border-2 border-dashed border-translucent rounded-3">
                 <UilDatabase size={48} className="text-body-quaternary mb-3" />
                 <h4 className="text-body-tertiary">No Programs Found</h4>
                 <p className="text-body-quaternary mb-4">Create a custom database for your programs (e.g., 4Ps, Scholarship, Pension).</p>
                 <Button as={Link} to="/programs/create" variant="primary">
                   Create Your First Program
                 </Button>
               </div>
             </Col>
          ) : (
            programs.map(program => {
              const icon = getProgramIcon(program.name, program.description || '');
              const color = getProgramColor(program.name, program.description || '');
              
              return (
              <Col key={program.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                <Card className="h-100 border-0 shadow-sm hover-actions-trigger bg-body-highlight">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                      {program.logo_url ? (
                        <div className={`avatar-m rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm border`}>
                          <img src={program.logo_url} alt={program.name} className="w-100 h-100 rounded-circle object-fit-cover" />
                        </div>
                      ) : (
                        <div className={`avatar-m bg-${color}-subtle rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm`}>
                          <FontAwesomeIcon icon={icon} className={`text-${color} fs-6`} />
                        </div>
                      )}
                      <h5 className="mb-0 text-body-highlight fw-bold lh-sm text-truncate-2">{program.name}</h5>
                    </div>
                    <p className="text-body-secondary fs-9 mb-4 flex-grow-1 line-clamp-2">
                      {program.description || 'No description provided.'}
                    </p>
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                         <div className="d-flex gap-2">
                           <span className="badge badge-phoenix badge-phoenix-info rounded-pill">
                             {program.fields?.length || 0} Fields
                           </span>
                           {program.enrollment_count !== undefined && (
                              <span className="badge badge-phoenix badge-phoenix-primary rounded-pill">
                                <FontAwesomeIcon icon={faUsers} className="me-1" />
                                {program.enrollment_count}
                              </span>
                           )}
                         </div>
                         
                         <div className="d-flex gap-1">
                           {/* Edit Button - Only allowed if no enrollments */}
                           {(program.enrollment_count === 0 || program.enrollment_count === undefined) ? (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-0 text-secondary me-2"
                                as={Link}
                                to={`/programs/edit/${program.id}`}
                                title="Edit Program"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                           ) : (
                              <span title="Cannot edit program with existing enrollments" className="d-inline-block me-2">
                                <Button variant="link" size="sm" className="p-0 text-secondary opacity-50" disabled>
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              </span>
                           )}

                           <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 text-danger"
                              onClick={() => handleDeleteClick(program)}
                              title="Delete Program"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                         </div>
                      </div>
                      <Button 
                        variant={`outline-${color}`}
                        size="sm" 
                        className="w-100 fw-bold"
                        as={Link}
                        to={`/programs/dashboard/${program.id}`}
                      >
                        <FontAwesomeIcon icon={faRocket} className="me-2" />
                        Launch Program
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )})
          )}
        </Row>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Program"
        message={`Are you sure you want to delete "${selectedProgram?.name}"? This will also delete all enrolled citizen records for this program.`}
        confirmText="Delete Program"
        variant="danger"
        icon="trash"
      />
    </div>
  );
};

export default ProgramList;
