
import React from 'react';
import { Row, Col, Card, ListGroup, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faUserShield, faUserTie, faUser, faMobileAlt } from '@fortawesome/free-solid-svg-icons';

const RolesPermissions = () => {
  return (
    <div>
      <h2 className="mb-4">User Roles & Permissions</h2>
      
      <Row className="g-4">
        <Col md={6} lg={3}>
          <Card className="h-100 border-danger border-top border-3">
            <Card.Body>
              <div className="text-center mb-3">
                <FontAwesomeIcon icon={faUserShield} size="3x" className="text-danger mb-2" />
                <h4>Super Admin</h4>
                <Badge bg="danger">Full System Control</Badge>
              </div>
              <ListGroup variant="flush">
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Manage departments</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Manage database tables</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Manage citizen records</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Monitor compliance</ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-warning border-top border-3">
            <Card.Body>
              <div className="text-center mb-3">
                <FontAwesomeIcon icon={faUserTie} size="3x" className="text-warning mb-2" />
                <h4>Municipal Admin</h4>
                <Badge bg="warning" text="dark">Administrator</Badge>
              </div>
              <ListGroup variant="flush">
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />View system analytics</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Monitor departments</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Compliance monitoring</ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-info border-top border-3">
            <Card.Body>
              <div className="text-center mb-3">
                <FontAwesomeIcon icon={faUser} size="3x" className="text-info mb-2" />
                <h4>Department Users</h4>
                <Badge bg="info">Operational</Badge>
              </div>
              <p className="text-muted small text-center mb-2">Health, Social Welfare, Treasury, Traffic, Agriculture, Civil Registry</p>
              <ListGroup variant="flush">
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Scan citizen ID</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />View citizen profile</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Add department records</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Process transactions</ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-secondary border-top border-3">
            <Card.Body>
              <div className="text-center mb-3">
                <FontAwesomeIcon icon={faMobileAlt} size="3x" className="text-secondary mb-2" />
                <h4>Field Officers</h4>
                <Badge bg="secondary">Field Access</Badge>
              </div>
              <ListGroup variant="flush">
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Mobile scanning</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />QR/NFC verification</ListGroup.Item>
                <ListGroup.Item><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />Record field transactions</ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RolesPermissions;
