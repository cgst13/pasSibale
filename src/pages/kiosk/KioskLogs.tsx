import React, { useEffect, useState, useMemo } from 'react';
import { Card, Container, Table, Badge, Form, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faSearch, faBuilding, faUser, faClock, faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { getDepartments, getKioskLogs } from 'services/departmentService';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import { toast } from 'react-hot-toast';

const KioskLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getKioskLogs(200);
      setLogs(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load kiosk logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const name = `${log.citizens?.firstName} ${log.citizens?.lastName}`.toLowerCase();
      const matchesSearch = searchTerm === '' || name.includes(searchTerm.toLowerCase());
      const matchesDept = filterDept === '' || log.department_id === filterDept;
      return matchesSearch && matchesDept;
    });
  }, [logs, searchTerm, filterDept]);

  const breadcrumbItems = [
    { label: 'Kiosks', active: false },
    { label: 'Building Logs', active: true }
  ];

  if (loading) return <PasSibaleLoader />;

  return (
    <Container fluid className="px-0">
      <PageBreadcrumb items={breadcrumbItems} />
      
      <div className="mb-4">
        <h2 className="mb-2">Building Activity Logs</h2>
        <p className="text-body-secondary">Track all citizen movements and transactions within the Municipal Hall.</p>
      </div>

      <Card className="shadow-none border border-translucent overflow-hidden">
        <Card.Header className="bg-body-tertiary p-3">
          <Row className="g-3">
            <Col xs={12} md={6}>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search by citizen name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-5"
                />
                <FontAwesomeIcon icon={faSearch} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-body-quaternary" />
              </div>
            </Col>
            <Col xs={12} md={6}>
              <Form.Select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive scrollbar">
            <Table className="phoenix-table fs-9 mb-0 border-top border-translucent">
              <thead>
                <tr className="bg-body-highlight">
                  <th className="ps-3" style={{ width: '20%' }}>CITIZEN</th>
                  <th style={{ width: '20%' }}>OFFICE</th>
                  <th style={{ width: '20%' }}>SERVICE</th>
                  <th style={{ width: '15%' }}>TIME IN</th>
                  <th style={{ width: '15%' }}>TIME OUT</th>
                  <th style={{ width: '10%' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="align-middle">
                      <td className="ps-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-m me-2">
                            {log.citizens?.photoUrl ? (
                              <img src={log.citizens.photoUrl} alt="" className="rounded-circle object-fit-cover" />
                            ) : (
                              <div className="avatar-name rounded-circle bg-primary-subtle text-primary">
                                {log.citizens?.firstName.charAt(0)}{log.citizens?.lastName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="fw-bold text-body-highlight">{log.citizens?.firstName} {log.citizens?.lastName}</div>
                            <div className="fs-10 text-body-tertiary">{log.citizens?.barangay}</div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold text-body-highlight">
                        <FontAwesomeIcon icon={faBuilding} className="me-2 text-body-quaternary" />
                        {log.departments?.name}
                      </td>
                      <td className="text-body-highlight">
                        {log.department_services?.name || <span className="text-body-quaternary italic">General Inquiry</span>}
                      </td>
                      <td>
                        <div className="text-success fw-bold">
                          <FontAwesomeIcon icon={faSignInAlt} className="me-1" />
                          {new Date(log.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="fs-10 text-body-tertiary">{new Date(log.time_in).toLocaleDateString()}</div>
                      </td>
                      <td>
                        {log.time_out ? (
                          <>
                            <div className="text-warning fw-bold">
                              <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                              {new Date(log.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="fs-10 text-body-tertiary">{new Date(log.time_out).toLocaleDateString()}</div>
                          </>
                        ) : (
                          <span className="text-body-quaternary">-</span>
                        )}
                      </td>
                      <td>
                        <Badge 
                          bg={log.status === 'IN_PROGRESS' ? 'info-subtle' : 'success-subtle'} 
                          className={`rounded-pill ${log.status === 'IN_PROGRESS' ? 'text-info' : 'text-success'}`}
                        >
                          {log.status === 'IN_PROGRESS' ? 'Active' : 'Completed'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <FontAwesomeIcon icon={faHistory} size="3x" className="mb-3 text-body-quaternary opacity-25" />
                      <h5>No activity logs found</h5>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default KioskLogs;
