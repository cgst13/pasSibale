import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { ProgramDefinition } from 'types/program';
import { updateProgram } from 'services/programService';
import { toast } from 'react-hot-toast';

interface TableConfigModalProps {
  show: boolean;
  onHide: () => void;
  program: ProgramDefinition;
  onSave: (updatedProgram: ProgramDefinition) => void;
}

const CITIZEN_FIELDS = [
  { key: 'id', label: 'Citizen ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'middleName', label: 'Middle Name' },
  { key: 'suffix', label: 'Suffix' },
  { key: 'sex', label: 'Sex' },
  { key: 'dateOfBirth', label: 'Birthdate' },
  { key: 'age', label: 'Age' },
  { key: 'civilStatus', label: 'Civil Status' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'religion', label: 'Religion' },
  { key: 'bloodType', label: 'Blood Type' },
  { key: 'mobileNumber', label: 'Mobile Number' },
  { key: 'email', label: 'Email' },
  { key: 'houseNumberStreet', label: 'Street/House No.' },
  { key: 'purokSitio', label: 'Purok/Sitio' },
  { key: 'barangay', label: 'Barangay' },
  { key: 'cityMunicipality', label: 'City/Municipality' },
  { key: 'province', label: 'Province' },
  { key: 'zipCode', label: 'Zip Code' },
  { key: 'residencyStatus', label: 'Residency Status' },
  { key: 'emergencyContactPerson', label: 'Emergency Contact' },
  { key: 'emergencyContactNumber', label: 'Emergency Number' },
  { key: 'status', label: 'Status' },
];

const TableConfigModal: React.FC<TableConfigModalProps> = ({ show, onHide, program, onSave }) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (program.table_config?.columns) {
      setSelectedColumns(program.table_config.columns);
    } else {
      // Default columns if none set
      setSelectedColumns(['id', 'firstName', 'lastName', 'barangay', 'status']);
    }
  }, [program]);

  const handleToggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(c => c !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedProgram = await updateProgram(program.id, {
        table_config: {
          columns: selectedColumns
        }
      });
      
      onSave(updatedProgram);
      toast.success('Table configuration saved');
      onHide();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (key: string) => selectedColumns.includes(key);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Customize Table Columns</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-body-tertiary mb-4">
          Select the columns you want to display in the beneficiary list. 
          You can include citizen details and specific program fields.
        </p>

        <div className="mb-4">
          <h6 className="fw-bold text-body-secondary mb-3">Citizen Details</h6>
          <Row xs={1} md={2} lg={3} className="g-3">
            {CITIZEN_FIELDS.map(field => (
              <Col key={field.key}>
                <Form.Check
                  type="checkbox"
                  id={`col-${field.key}`}
                  label={field.label}
                  checked={isSelected(field.key)}
                  onChange={() => handleToggleColumn(field.key)}
                />
              </Col>
            ))}
          </Row>
        </div>

        {program.fields && program.fields.length > 0 && (
          <div>
            <h6 className="fw-bold text-body-secondary mb-3">Program Fields</h6>
            <Row xs={1} md={2} lg={3} className="g-3">
              {program.fields.map(field => (
                <Col key={field.id}>
                  <Form.Check
                    type="checkbox"
                    id={`col-prog-${field.label}`}
                    label={field.label}
                    checked={isSelected(field.label)} // Use label as key for dynamic fields
                    onChange={() => handleToggleColumn(field.label)}
                  />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="link" onClick={onHide} className="text-decoration-none text-body-secondary">
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TableConfigModal;
