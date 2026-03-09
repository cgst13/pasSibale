import React, { useEffect, useState, useMemo } from 'react';
import { Card, Container, Table, Badge, Form, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faFilter, faSearch, faUser, faClock, faInfoCircle, faTable } from '@fortawesome/free-solid-svg-icons';
import { getAuditLogs } from 'services/auditService';
import { AuditLog } from 'types/audit';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import { toast } from 'react-hot-toast';

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs(100);
      setLogs(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = filterAction === '' || log.action === filterAction;
      const matchesEntity = filterEntity === '' || log.entity_type === filterEntity;
      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [logs, searchTerm, filterAction, filterEntity]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return <Badge bg="success">CREATE</Badge>;
      case 'UPDATE': return <Badge bg="info">UPDATE</Badge>;
      case 'DELETE': return <Badge bg="danger">DELETE</Badge>;
      case 'LOGIN': return <Badge bg="primary">LOGIN</Badge>;
      case 'SCAN': return <Badge bg="warning">SCAN</Badge>;
      default: return <Badge bg="secondary">{action}</Badge>;
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'CITIZEN': return <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />;
      case 'EVENT': return <FontAwesomeIcon icon={faClock} className="me-2 text-info" />;
      case 'SYSTEM': return <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-secondary" />;
      default: return <FontAwesomeIcon icon={faTable} className="me-2 text-muted" />;
    }
  };

  const breadcrumbItems = [
    { label: 'System', active: false },
    { label: 'Audit Logs', active: true }
  ];

  if (loading) return <PasSibaleLoader />;

  return (
    <Container fluid className="px-0">
      <PageBreadcrumb items={breadcrumbItems} />
      
      <div className="mb-4">
        <h2 className="mb-2">Activity Logs</h2>
        <p className="text-body-secondary">Track all changes and activities across the entire system.</p>
      </div>

      <Card className="shadow-none border border-translucent overflow-hidden">
        <Card.Header className="bg-body-tertiary p-3">
          <Row className="g-3">
            <Col xs={12} md={4}>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search by user or detail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-5"
                />
                <FontAwesomeIcon icon={faSearch} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-body-quaternary" />
              </div>
            </Col>
            <Col xs={6} md={3}>
              <Form.Select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
                <option value="SCAN">SCAN</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={3}>
              <Form.Select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}>
                <option value="">All Entities</option>
                <option value="CITIZEN">CITIZEN</option>
                <option value="EVENT">EVENT</option>
                <option value="PROGRAM">PROGRAM</option>
                <option value="USER">USER</option>
                <option value="ATTENDANCE">ATTENDANCE</option>
                <option value="SYSTEM">SYSTEM</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive scrollbar">
            <Table className="phoenix-table fs-9 mb-0 border-top border-translucent">
              <thead>
                <tr className="bg-body-highlight">
                  <th className="white-space-nowrap ps-3" style={{ width: '15%' }}>TIMESTAMP</th>
                  <th className="white-space-nowrap" style={{ width: '15%' }}>USER</th>
                  <th className="white-space-nowrap" style={{ width: '10%' }}>ACTION</th>
                  <th className="white-space-nowrap" style={{ width: '15%' }}>ENTITY</th>
                  <th className="white-space-nowrap" style={{ width: '45%' }}>DETAILS</th>
                </tr>
              </thead>
              <tbody className="list">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover-actions-trigger btn-reveal-trigger position-static">
                      <td className="ps-3 align-middle white-space-nowrap text-body-tertiary">
                        {new Date(log.created_at || log.timestamp).toLocaleString()}
                      </td>
                      <td className="align-middle white-space-nowrap fw-bold text-body-highlight">
                        {log.user_email || 'System'}
                      </td>
                      <td className="align-middle white-space-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="align-middle white-space-nowrap text-body-highlight fw-semibold">
                        {getEntityIcon(log.entity_type)}
                        {log.entity_type}
                      </td>
                      <td className="align-middle text-body-highlight pe-3">
                        {log.details}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="text-body-quaternary">
                        <FontAwesomeIcon icon={faHistory} size="3x" className="mb-3 opacity-25" />
                        <h5>No activities found</h5>
                        <p className="mb-0">Try adjusting your filters or search terms.</p>
                      </div>
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

export default AuditLogs;
