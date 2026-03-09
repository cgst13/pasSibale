import { useState, useEffect } from 'react';
import { Button, Card, Col, Form, Row, InputGroup, Table } from 'react-bootstrap';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faCalendarAlt, faMapMarkerAlt, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createEvent, getEvent, updateEvent } from 'services/eventsService';
import { Event, AttendanceConfig } from 'types/events';
import { toast } from 'react-hot-toast';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import PasSibaleLoader from 'components/common/PasSibaleLoader';

interface EventFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  attendance_config: AttendanceConfig[];
}

const CreateEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<EventFormData>({
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      attendance_config: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attendance_config"
  });

  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        try {
          const event = await getEvent(id);
          if (event) {
            reset({
              title: event.title,
              description: event.description || '',
              start_date: event.start_date, // Assumes YYYY-MM-DD from DB
              end_date: event.end_date || '',
              location: event.location || '',
              attendance_config: event.attendance_config || []
            });
          }
        } catch (error) {
          console.error(error);
          toast.error('Failed to load event details');
          navigate('/events');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id, navigate, reset]);

  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true);

      // Validate Attendance Config
      if (data.attendance_config && data.attendance_config.length > 0) {
        // 1. Check for valid ranges within each slot
        for (const slot of data.attendance_config) {
            if (slot.time_in_start >= slot.time_in_end) {
                toast.error(`Invalid Time In range for "${slot.label}": Start time must be before End time`);
                setLoading(false);
                return;
            }
            if (slot.time_out_start >= slot.time_out_end) {
                toast.error(`Invalid Time Out range for "${slot.label}": Start time must be before End time`);
                setLoading(false);
                return;
            }
        }

        // 2. Check for overlaps between ALL configured ranges (In and Out)
        type TimeRange = {
            start: string;
            end: string;
            label: string;
            type: 'Time In' | 'Time Out';
        };
        const ranges: TimeRange[] = [];
        
        data.attendance_config.forEach(slot => {
            ranges.push({ start: slot.time_in_start, end: slot.time_in_end, label: slot.label, type: 'Time In' });
            ranges.push({ start: slot.time_out_start, end: slot.time_out_end, label: slot.label, type: 'Time Out' });
        });

        // Sort by start time
        ranges.sort((a, b) => a.start.localeCompare(b.start));

        // Check adjacent ranges
        for (let i = 0; i < ranges.length - 1; i++) {
            const current = ranges[i];
            const next = ranges[i + 1];

            // Since ranges are inclusive in our logic (>= start && <= end),
            // even touching endpoints (end == start) creates an ambiguity at that exact minute.
            // e.g. 08:00-09:00 and 09:00-10:00. At 09:00, both are valid.
            if (next.start <= current.end) {
                toast.error(`Time Conflict: "${current.label}" (${current.type}) overlaps with "${next.label}" (${next.type}) at ${next.start}`);
                setLoading(false);
                return;
            }
        }
      }
      
      const baseData = {
          ...data,
          start_date: data.start_date, // Send YYYY-MM-DD directly
          end_date: data.end_date || undefined,
          attendance_config: data.attendance_config
      };

      if (id) {
        await updateEvent(id, baseData);
        toast.success('Event updated successfully');
      } else {
        await createEvent({
            ...baseData,
            status: 'Upcoming'
        });
        toast.success('Event created successfully');
      }
      navigate('/events');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    append({
      id: crypto.randomUUID(),
      label: '',
      time_in_start: '',
      time_in_end: '',
      time_out_start: '',
      time_out_end: ''
    });
  };

  const breadcrumbItems = [
    { label: 'Dashboard', url: '/' },
    { label: 'Events', url: '/events' },
    { label: id ? 'Edit Event' : 'Create Event', active: true }
  ];

  if (initialLoading) return <PasSibaleLoader />;

  return (
    <div>
      <PageBreadcrumb items={breadcrumbItems} />
      <div className="mb-9">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">{id ? 'Edit Event' : 'Create New Event'}</h2>
          <Button as={Link} to="/events" variant="outline-secondary" size="sm">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Button>
        </div>

        <Row className="justify-content-center">
          <Col xs={12} lg={10} xl={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row className="g-3">
                    <Col xs={12}>
                      <Form.Group controlId="title">
                        <Form.Label>Event Title <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter event title"
                          {...register('title', { required: 'Title is required' })}
                          isInvalid={!!errors.title}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.title?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          placeholder="Enter event description"
                          {...register('description')}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group controlId="start_date">
                        <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                            <InputGroup.Text><FontAwesomeIcon icon={faCalendarAlt} /></InputGroup.Text>
                            <Form.Control
                            type="date"
                            {...register('start_date', { required: 'Start date is required' })}
                            isInvalid={!!errors.start_date}
                            />
                        </InputGroup>
                        <Form.Control.Feedback type="invalid">
                          {errors.start_date?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group controlId="end_date">
                        <Form.Label>End Date</Form.Label>
                         <InputGroup>
                            <InputGroup.Text><FontAwesomeIcon icon={faCalendarAlt} /></InputGroup.Text>
                            <Form.Control
                            type="date"
                            {...register('end_date')}
                            />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group controlId="location">
                        <Form.Label>Location</Form.Label>
                        <InputGroup>
                            <InputGroup.Text><FontAwesomeIcon icon={faMapMarkerAlt} /></InputGroup.Text>
                            <Form.Control
                            type="text"
                            placeholder="Enter event location"
                            {...register('location')}
                            />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    
                    {/* Attendance Configuration Section */}
                    <Col xs={12}>
                        <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                            <h5 className="mb-0">Attendance Schedule</h5>
                            <Button variant="outline-primary" size="sm" onClick={handleAddSlot}>
                                <FontAwesomeIcon icon={faPlus} className="me-2" />
                                Add Slot
                            </Button>
                        </div>
                        {fields.length === 0 ? (
                            <div className="text-center p-3 border rounded bg-light text-muted">
                                No attendance slots configured. Click "Add Slot" to define check-in/out times.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table bordered hover size="sm">
                                    <thead className="bg-light">
                                        <tr>
                                            <th style={{width: '25%'}}>Label</th>
                                            <th>Time In Range</th>
                                            <th>Time Out Range</th>
                                            <th style={{width: '50px'}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.map((field, index) => (
                                            <tr key={field.id}>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="e.g. Morning"
                                                        size="sm"
                                                        {...register(`attendance_config.${index}.label` as const, { required: true })}
                                                        isInvalid={!!errors.attendance_config?.[index]?.label}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2 align-items-center">
                                                        <Form.Control
                                                            type="time"
                                                            size="sm"
                                                            {...register(`attendance_config.${index}.time_in_start` as const, { required: true })}
                                                            isInvalid={!!errors.attendance_config?.[index]?.time_in_start}
                                                        />
                                                        <span>-</span>
                                                        <Form.Control
                                                            type="time"
                                                            size="sm"
                                                            {...register(`attendance_config.${index}.time_in_end` as const, { required: true })}
                                                            isInvalid={!!errors.attendance_config?.[index]?.time_in_end}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2 align-items-center">
                                                        <Form.Control
                                                            type="time"
                                                            size="sm"
                                                            {...register(`attendance_config.${index}.time_out_start` as const, { required: true })}
                                                            isInvalid={!!errors.attendance_config?.[index]?.time_out_start}
                                                        />
                                                        <span>-</span>
                                                        <Form.Control
                                                            type="time"
                                                            size="sm"
                                                            {...register(`attendance_config.${index}.time_out_end` as const, { required: true })}
                                                            isInvalid={!!errors.attendance_config?.[index]?.time_out_end}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <Button variant="link" className="text-danger p-0" onClick={() => remove(index)}>
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                         <Form.Text className="text-muted">
                            Define non-overlapping time windows (at least 1 minute apart) for Time In and Time Out.
                        </Form.Text>
                    </Col>

                    <Col xs={12} className="text-end mt-4">
                      <Button variant="secondary" as={Link} to="/events" className="me-2">
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" disabled={loading}>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        {loading ? 'Saving...' : 'Save Event'}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CreateEvent;
