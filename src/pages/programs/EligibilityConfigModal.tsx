import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Card } from 'react-bootstrap';
import { ProgramDefinition } from 'types/program';
import { updateProgram } from 'services/programService';
import { toast } from 'react-hot-toast';
import PhilAddress from 'phil-reg-prov-mun-brgy';

interface EligibilityConfigModalProps {
  show: boolean;
  onHide: () => void;
  program: ProgramDefinition;
  onSave: (updatedProgram: ProgramDefinition) => void;
}

const CONCEPCION_MUN_CODE = '175905'; // Default to Concepcion, Romblon

const EligibilityConfigModal: React.FC<EligibilityConfigModalProps> = ({ show, onHide, program, onSave }) => {
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [sex, setSex] = useState<string>('');
  const [selectedBarangays, setSelectedBarangays] = useState<string[]>([]);
  const [barangayList, setBarangayList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load Barangays
    try {
      const brgys = PhilAddress.getBarangayByMun(CONCEPCION_MUN_CODE);
      setBarangayList(brgys);
    } catch (e) {
      console.error("Failed to load barangays", e);
      // Fallback or empty
      setBarangayList([]);
    }
  }, []);

  useEffect(() => {
    if (show && program.eligibility_criteria) {
      setMinAge(program.eligibility_criteria.minAge?.toString() || '');
      setMaxAge(program.eligibility_criteria.maxAge?.toString() || '');
      setSex(program.eligibility_criteria.sex || '');
      setSelectedBarangays(program.eligibility_criteria.barangay || []);
    } else {
        // Reset if no criteria
        setMinAge('');
        setMaxAge('');
        setSex('');
        setSelectedBarangays([]);
    }
  }, [show, program]);

  const handleToggleBarangay = (brgyName: string) => {
    setSelectedBarangays(prev => {
      if (prev.includes(brgyName)) {
        return prev.filter(b => b !== brgyName);
      } else {
        return [...prev, brgyName];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const criteria = {
        minAge: minAge ? parseInt(minAge) : null,
        maxAge: maxAge ? parseInt(maxAge) : null,
        sex: sex || null,
        barangay: selectedBarangays.length > 0 ? selectedBarangays : null,
        custom: null
      };

      const updatedProgram = await updateProgram(program.id, {
        eligibility_criteria: criteria as any // Type assertion to avoid strict null checks if types aren't perfectly aligned yet
      });
      
      onSave(updatedProgram);
      toast.success('Eligibility rules saved');
      onHide();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save eligibility rules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Program Restrictions & Eligibility</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-body-tertiary mb-4">
          Set restrictions for this program. Only citizens who meet these criteria will be allowed to register.
          Leave fields blank to impose no restriction.
        </p>

        <Form>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Minimum Age</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="e.g. 60" 
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                />
                <Form.Text className="text-muted">Citizens must be at least this age.</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Maximum Age</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="e.g. 100" 
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                />
                <Form.Text className="text-muted">Citizens must be under or equal to this age.</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label>Sex Restriction</Form.Label>
            <div className="d-flex gap-3">
              <Form.Check 
                type="radio"
                name="sex"
                id="sex-any"
                label="Any / No Restriction"
                checked={!sex}
                onChange={() => setSex('')}
              />
              <Form.Check 
                type="radio"
                name="sex"
                id="sex-male"
                label="Male Only"
                checked={sex === 'Male'}
                onChange={() => setSex('Male')}
              />
              <Form.Check 
                type="radio"
                name="sex"
                id="sex-female"
                label="Female Only"
                checked={sex === 'Female'}
                onChange={() => setSex('Female')}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Residency / Barangay Restriction</Form.Label>
            <p className="text-muted small mb-2">Select specific barangays allowed. If none selected, all barangays are allowed.</p>
            <Card className="bg-body-tertiary border-0">
                <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <Row xs={1} md={2} lg={3}>
                        {barangayList.map((brgy: any) => (
                            <Col key={brgy.name}>
                                <Form.Check
                                    type="checkbox"
                                    id={`brgy-${brgy.name}`}
                                    label={brgy.name}
                                    checked={selectedBarangays.includes(brgy.name)}
                                    onChange={() => handleToggleBarangay(brgy.name)}
                                />
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="link" onClick={onHide} className="text-decoration-none text-body-secondary">
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Restrictions'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EligibilityConfigModal;
