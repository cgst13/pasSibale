
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { corePrograms } from 'data/corePrograms';
import { Row, Col, Card, Button, Dropdown, Table, Spinner } from 'react-bootstrap';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faMoneyBillWave, faChartLine, faArrowLeft, faUserPlus, faCog, faTable, faEdit, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { getProgram, getProgramEnrollmentCount, getEnrollmentsByProgram } from 'services/programService';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import { ProgramDefinition, ProgramEnrollment } from 'types/program';
import { getProgramIcon, getProgramColor } from 'utils/programUtils';
import TableConfigModal from './TableConfigModal';
import EligibilityConfigModal from './EligibilityConfigModal';
import Avatar from 'components/base/Avatar';

const ProgramDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [showTableConfig, setShowTableConfig] = useState(false);
  const [showEligibilityConfig, setShowEligibilityConfig] = useState(false);
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  useEffect(() => {
    const fetchProgramData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        // Fetch enrollment count for both core and custom programs
        const count = await getProgramEnrollmentCount(id);
        setEnrollmentCount(count);

        // Fetch enrollments
        setLoadingEnrollments(true);
        const enrollmentsData = await getEnrollmentsByProgram(id);
        setEnrollments(enrollmentsData || []);
        setLoadingEnrollments(false);

        // Check if it's a core program first
        const coreProgram = corePrograms.find(p => p.id === id);
        if (coreProgram) {
          setProgram(coreProgram);
          setLoading(false);
          return;
        }

        // If not, try to fetch from DB (custom program)
        const data = await getProgram(id);
        if (data) {
          const icon = getProgramIcon(data.name, data.description || '');
          const color = getProgramColor(data.name, data.description || '');
          
          setProgram({
            ...data,
            icon,
            color
          });
        }
      } catch (error) {
        console.error("Failed to fetch program", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [id]);

  const handleProgramUpdate = (updatedProgram: ProgramDefinition) => {
    const icon = getProgramIcon(updatedProgram.name, updatedProgram.description || '');
    const color = getProgramColor(updatedProgram.name, updatedProgram.description || '');
    setProgram({
      ...updatedProgram,
      icon,
      color
    });
  };

  if (loading) return <PasSibaleLoader />;

  if (!program) {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <h3 className="text-body-secondary mb-4">Program not found</h3>
            <Button as={Link} to="/programs" variant="primary">Back to Programs</Button>
        </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', url: '/' },
    { label: 'Programs', url: '/programs' },
    { label: program.name, active: true }
  ];

  // Table Columns Logic
  const getTableColumns = () => {
    if (program.table_config?.columns) {
      return program.table_config.columns;
    }
    return ['id', 'firstName', 'lastName', 'barangay', 'status'];
  };

  const columns = getTableColumns();

  const getColumnLabel = (key: string) => {
    // Check citizen fields
    const citizenFieldLabels: Record<string, string> = {
      id: 'ID',
      firstName: 'First Name',
      lastName: 'Last Name',
      middleName: 'Middle Name',
      suffix: 'Suffix',
      sex: 'Sex',
      dateOfBirth: 'Birthdate',
      age: 'Age',
      civilStatus: 'Civil Status',
      barangay: 'Barangay',
      mobileNumber: 'Mobile',
      status: 'Status',
      nationality: 'Nationality',
      religion: 'Religion',
      bloodType: 'Blood Type',
      email: 'Email',
      houseNumberStreet: 'Street/House No.',
      purokSitio: 'Purok/Sitio',
      cityMunicipality: 'City/Municipality',
      province: 'Province',
      zipCode: 'Zip Code',
      residencyStatus: 'Residency Status',
      emergencyContactPerson: 'Emergency Contact',
      emergencyContactNumber: 'Emergency Number'
    };

    if (citizenFieldLabels[key]) return citizenFieldLabels[key];

    // Check program fields
    const programField = program.fields?.find((f: any) => f.label === key);
    if (programField) return programField.label;

    return key;
  };

  const renderCellContent = (enrollment: ProgramEnrollment, key: string) => {
    // Check citizen data
    if (enrollment.citizen && key in enrollment.citizen) {
      const val = (enrollment.citizen as any)[key];
      if (key === 'status') {
         return (
             <span className={`badge bg-${val === 'Active' ? 'success' : 'secondary'}-subtle text-${val === 'Active' ? 'success' : 'secondary'}`}>
                 {val}
             </span>
         );
      }
      if (key === 'dateOfBirth' && val) {
        return new Date(val).toLocaleDateString();
      }
      return val;
    }

    // Check enrollment data (program fields)
    if (enrollment.data && key in enrollment.data) {
        return enrollment.data[key]?.toString() || '-';
    }

    return '-';
  };

  return (
    <div>
        <PageBreadcrumb items={breadcrumbItems} />
        <div className="mb-9">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-5 gap-3">
                <div className="d-flex align-items-center">
                    {program.logo_url ? (
                        <div className={`avatar-xl rounded-circle d-flex align-items-center justify-content-center me-4 shadow-sm flex-shrink-0 border bg-white overflow-hidden`}>
                            <img src={program.logo_url} alt={program.name} className="w-100 h-100 object-fit-cover" />
                        </div>
                    ) : (
                        <div className={`avatar-xl bg-${program.color}-subtle rounded-circle d-flex align-items-center justify-content-center me-4 shadow-sm flex-shrink-0`}>
                            <FontAwesomeIcon icon={program.icon} className={`text-${program.color} fs-3`} />
                        </div>
                    )}
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h2 className="mb-0 fw-bold text-body-highlight">{program.name}</h2>
                          {program.status && (
                            <span className={`badge bg-${program.status === 'Active' ? 'success' : program.status === 'Inactive' ? 'secondary' : 'warning'}-subtle text-${program.status === 'Active' ? 'success' : program.status === 'Inactive' ? 'secondary' : 'warning'} rounded-pill fs-9 border border-${program.status === 'Active' ? 'success' : program.status === 'Inactive' ? 'secondary' : 'warning'}-subtle`}>
                              {program.status}
                            </span>
                          )}
                        </div>
                        <p className="text-body-tertiary mb-2 mw-lg-75">{program.description}</p>
                    </div>
                </div>
                <div className="d-flex gap-2 align-self-start align-self-md-center">
                     <Button as={Link} to={`/programs/register/${id}`} variant="primary" size="sm" className="rounded-pill px-3">
                        <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                        Register
                    </Button>
                    {!corePrograms.find(p => p.id === id) && (
                      <Dropdown>
                          <Dropdown.Toggle variant="subtle-secondary" size="sm" className="rounded-pill px-3" id="program-settings-dropdown">
                              <FontAwesomeIcon icon={faCog} className="me-2" /> Settings
                          </Dropdown.Toggle>

                          <Dropdown.Menu align="end" className="shadow border-0 mt-2">
                              <Dropdown.Item as={Link} to={`/programs/edit/${id}`} className="py-2">
                                <FontAwesomeIcon icon={faEdit} className="me-2 fa-fw text-body-tertiary" />
                                Edit Program Details
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => setShowTableConfig(true)} className="py-2">
                                <FontAwesomeIcon icon={faTable} className="me-2 fa-fw text-body-tertiary" />
                                Custom Table
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => setShowEligibilityConfig(true)} className="py-2">
                                <FontAwesomeIcon icon={faUserCheck} className="me-2 fa-fw text-body-tertiary" />
                                Program Restrictions
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    )}
                </div>
            </div>

            {/* Stats Row - Minimal Style */}
            <Row className="g-3 mb-5">
                <Col md={4}>
                    <div className="p-4 rounded-3 border bg-body-highlight h-100">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="text-body-tertiary mb-0">Total Beneficiaries</h6>
                            <div className="text-primary opacity-75">
                                <FontAwesomeIcon icon={faUsers} size="lg" />
                            </div>
                        </div>
                        <h2 className="mb-0 fw-bold text-body-highlight">{enrollmentCount.toLocaleString()}</h2>
                        <small className="text-success fw-bold fs-10 mt-2 d-block"><FontAwesomeIcon icon={faChartLine} className="me-1"/> Active Enrollees</small>
                    </div>
                </Col>
                <Col md={4}>
                    <div className="p-4 rounded-3 border bg-body-highlight h-100">
                         <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="text-body-tertiary mb-0">Total Disbursed</h6>
                            <div className="text-success opacity-75">
                                <FontAwesomeIcon icon={faMoneyBillWave} size="lg" />
                            </div>
                        </div>
                        <h2 className="mb-0 fw-bold text-body-highlight">₱ 0.00</h2>
                        <small className="text-body-quaternary fs-10 mt-2 d-block">Fiscal Year {new Date().getFullYear()}</small>
                    </div>
                </Col>
                <Col md={4}>
                     <div className="p-4 rounded-3 border bg-body-highlight h-100">
                         <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="text-body-tertiary mb-0">Active Cases</h6>
                             <div className="text-info opacity-75">
                                <FontAwesomeIcon icon={faChartLine} size="lg" />
                            </div>
                        </div>
                        <h2 className="mb-0 fw-bold text-body-highlight">0</h2>
                         <small className="text-warning fw-bold fs-10 mt-2 d-block">Requires attention</small>
                    </div>
                </Col>
            </Row>
            
            {/* Beneficiaries Table */}
            <Card className="border-0 shadow-sm bg-body-highlight">
                <Card.Body className="p-0">
                    {loadingEnrollments ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-body-tertiary">Loading beneficiaries...</p>
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="mb-3 text-body-quaternary opacity-50">
                                <FontAwesomeIcon icon={faUsers} size="3x" />
                            </div>
                            <h6 className="text-body-secondary">No beneficiaries enrolled yet</h6>
                            <Button as={Link} to={`/programs/register/${id}`} variant="link" className="text-decoration-none">
                                Register the first beneficiary
                            </Button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle" style={{ minWidth: '800px' }}>
                                <thead className="bg-body-tertiary">
                                    <tr>
                                        {columns.map((col: string) => (
                                            <th key={col} className="text-uppercase text-body-secondary fw-bold fs-9 py-3 px-4 border-bottom-0">
                                                {getColumnLabel(col)}
                                            </th>
                                        ))}
                                        <th className="text-end py-3 px-4 border-bottom-0">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map((enrollment) => (
                                        <tr key={enrollment.id}>
                                            {columns.map((col: string) => (
                                                <td key={`${enrollment.id}-${col}`} className="py-3 px-4">
                                                    {col === 'firstName' || col === 'lastName' ? (
                                                        <div className="fw-semibold text-body-highlight">
                                                            {renderCellContent(enrollment, col)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-body-secondary">
                                                            {renderCellContent(enrollment, col)}
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
                                            <td className="text-end py-3 px-4">
                                                <Button variant="subtle-secondary" size="sm" className="btn-icon rounded-circle">
                                                    <FontAwesomeIcon icon={faCog} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
                <Card.Footer className="border-top-0 py-3 px-4 bg-body-tertiary">
                     <div className="d-flex justify-content-between align-items-center">
                        <small className="text-body-tertiary">Showing {enrollments.length} records</small>
                     </div>
                </Card.Footer>
            </Card>

            {/* Modals */}
            {program && (
                <TableConfigModal 
                    show={showTableConfig} 
                    onHide={() => setShowTableConfig(false)} 
                    program={program}
                    onSave={handleProgramUpdate}
                />
            )}
            {program && (
                <EligibilityConfigModal 
                    show={showEligibilityConfig} 
                    onHide={() => setShowEligibilityConfig(false)} 
                    program={program}
                    onSave={handleProgramUpdate}
                />
            )}
        </div>
    </div>
  );
};

export default ProgramDashboard;
