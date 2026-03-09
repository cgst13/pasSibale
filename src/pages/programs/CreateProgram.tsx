
import { useState, useEffect } from 'react';
import { Button, Card, Col, Form, Row, InputGroup } from 'react-bootstrap';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { createProgram, getProgram, updateProgram, uploadProgramLogo } from 'services/programService';
import { ProgramDefinition, ProgramField } from 'types/program';
import { toast } from 'react-hot-toast';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import { getProgramIcon, getProgramColor } from 'utils/programUtils';

interface ProgramFormData {
  name: string;
  description: string;
  status: 'Active' | 'Inactive' | 'Archived' | 'Pending';
  fields: ProgramField[];
}

const CreateProgram = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ProgramFormData>({
    defaultValues: {
      name: '',
      description: '',
      status: 'Active',
      fields: []
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'fields'
  });

  const watchedFields = useWatch({
    control,
    name: 'fields'
  });

  const watchedName = useWatch({ control, name: 'name' });
  const watchedDescription = useWatch({ control, name: 'description' });

  const previewIcon = getProgramIcon(watchedName || '', watchedDescription || '');
  const previewColor = getProgramColor(watchedName || '', watchedDescription || '');

  useEffect(() => {
    if (id) {
      const fetchProgram = async () => {
        try {
          const program = await getProgram(id);
          if (program) {
            // Transform options array back to comma-separated string for editing if needed
            // Or ensure the form handles array directly.
            // The current form logic for select expects string input for comma separated values?
            // Let's check how we process onSubmit.
            // onSubmit splits string. So here we should join.
            
            const transformedFields = program.fields.map(f => ({
              ...f,
              options: Array.isArray(f.options) ? f.options.join(', ') : f.options
            }));

            reset({
              name: program.name,
              description: program.description || '',
              status: program.status || 'Active',
              // @ts-ignore
              fields: transformedFields
            });

            if (program.logo_url) {
              setLogoPreview(program.logo_url);
            }
          }
        } catch (error) {
          console.error(error);
          toast.error('Failed to load program details');
          navigate('/programs');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchProgram();
    }
  }, [id, navigate, reset]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProgramFormData) => {
    try {
      setLoading(true);
      
      let logoUrl = logoPreview;

      if (logoFile) {
        logoUrl = await uploadProgramLogo(logoFile);
      }
      
      // Process fields to ensure correct types (e.g. convert comma-separated options string to array)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedFields = data.fields.map((field: any) => ({
        ...field,
        options: field.type === 'select' && typeof field.options === 'string' 
          ? field.options.split(',').map((o: string) => o.trim()).filter(Boolean)
          : field.options,
        defaultValue: field.type === 'checkbox' 
          ? (field.defaultValue === 'true' || field.defaultValue === true)
          : field.type === 'number' && field.defaultValue
            ? Number(field.defaultValue)
            : field.defaultValue
      }));

      if (id) {
        // Only include fields that have changed or are necessary
        const updates: Partial<ProgramDefinition> = {
          name: data.name,
          description: data.description,
          status: data.status,
          fields: processedFields,
        };
        
        if (logoUrl !== undefined) {
          updates.logo_url = logoUrl;
        }

        await updateProgram(id, updates);
        toast.success('Program updated successfully');
        navigate(`/programs/dashboard/${id}`);
      } else {
        await createProgram({
          name: data.name,
          description: data.description,
          logo_url: logoUrl || undefined,
          status: data.status,
          fields: processedFields
        });
        toast.success('Program created successfully');
        navigate('/programs');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save program');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', url: '/' },
    { label: 'Programs', url: '/programs' },
    { label: id ? 'Edit Program' : 'Create Program', active: true }
  ];

  if (initialLoading) return <PasSibaleLoader />;

  return (
    <div>
      <div className="mb-9">
        <div className="d-flex align-items-center mb-4">
          <Button variant="link" onClick={() => navigate(-1)} className="p-0 me-3 text-body">
            <FontAwesomeIcon icon={faArrowLeft} />
          </Button>
          <div>
            <PageBreadcrumb items={breadcrumbItems} className="mb-1" />
            <h2 className="mb-0">{id ? 'Edit Custom Program' : 'Create Custom Program Database'}</h2>
          </div>
        </div>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row className="g-5">
            <Col xl={4}>
              <Card className="shadow-sm">
                <Card.Header className="bg-body-tertiary">
                  <h5 className="mb-0">Program Details</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-center mb-4">
                     <div className="text-center">
                        {logoPreview ? (
                          <div className="mb-2 position-relative d-inline-block">
                             <img 
                                src={logoPreview} 
                                alt="Program Logo" 
                                className="rounded-circle object-fit-cover border shadow-sm"
                                style={{ width: '100px', height: '100px' }}
                             />
                             <Button 
                                variant="light" 
                                size="sm" 
                                className="position-absolute top-0 start-100 translate-middle border shadow-sm rounded-circle p-0"
                                onClick={() => {
                                  setLogoFile(null);
                                  setLogoPreview(null);
                                }}
                                style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                             >
                               <FontAwesomeIcon icon={faTrash} size="xs" className="text-danger" />
                             </Button>
                          </div>
                        ) : (
                          <div className={`d-inline-flex align-items-center justify-content-center bg-${previewColor}-subtle rounded-circle mb-2`} style={{ width: '100px', height: '100px' }}>
                             <FontAwesomeIcon icon={previewIcon} className={`text-${previewColor} fs-1`} />
                          </div>
                        )}
                        <p className="mb-2 fs-9 text-body-tertiary">{logoPreview ? 'Custom Logo' : 'Auto-generated Icon'}</p>
                        
                        <div className="position-relative d-inline-block">
                          <Button variant="outline-primary" size="sm">Upload Logo</Button>
                          <Form.Control 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoChange}
                            className="position-absolute top-0 start-0 opacity-0 w-100 h-100"
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                     </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Program Name</Form.Label>
                    <Form.Control 
                      {...register('name', { required: 'Program name is required' })}
                      placeholder="e.g., 4Ps, Scholarship Program"
                      isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control 
                      {...register('description')}
                      as="textarea" 
                      rows={3} 
                      placeholder="Brief description of this program..."
                    />
                  </Form.Group>
                  
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select {...register('status')}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Archived">Archived</option>
                          <option value="Pending">Pending</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={8}>
              {id ? (
              <Card className="shadow-sm">
                <Card.Header className="bg-body-tertiary d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Form Field Builder</h5>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => append({ id: Date.now().toString(), label: '', type: 'text', required: false, defaultValue: '' })}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add Field
                  </Button>
                </Card.Header>
                <Card.Body>
                  <p className="text-body-secondary fs-9 mb-4">
                    Define the fields that will be required when enrolling a citizen into this program.
                  </p>

                  {fields.length === 0 && (
                    <div className="text-center py-5 text-body-tertiary">
                      <p>No custom fields added yet.</p>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => append({ id: Date.now().toString(), label: '', type: 'text', required: false, defaultValue: '' })}
                      >
                        Add your first field
                      </Button>
                    </div>
                  )}

                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 mb-3 border rounded bg-body-highlight position-relative">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-bold fs-9 text-uppercase text-body-tertiary">Field #{index + 1}</span>
                        <Button 
                          variant="link" 
                          className="text-danger p-0" 
                          onClick={() => remove(index)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                      
                      <Row className="g-3">
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="fs-9">Field Label</Form.Label>
                            <Form.Control
                              {...register(`fields.${index}.label`, { required: true })}
                              placeholder="e.g., ID Number, Amount"
                              size="sm"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="fs-9">Data Type</Form.Label>
                            <Form.Select
                              {...register(`fields.${index}.type`)}
                              size="sm"
                              className="mb-2"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="select">Select Dropdown</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="textarea">Text Area</option>
                            </Form.Select>
                            
                            {/* Conditional Options Input for Select Type */}
                            {watchedFields?.[index]?.type === 'select' && (
                              <Form.Control
                                {...register(`fields.${index}.options`)}
                                size="sm"
                                placeholder="Options (comma-separated)"
                                className="mt-2"
                              />
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label className="fs-9">Default Value</Form.Label>
                             {watchedFields?.[index]?.type === 'checkbox' ? (
                               <Form.Select 
                                 {...register(`fields.${index}.defaultValue`)} 
                                 size="sm"
                               >
                                 <option value="false">Unchecked</option>
                                 <option value="true">Checked</option>
                               </Form.Select>
                             ) : (
                               <Form.Control
                                 type={watchedFields?.[index]?.type === 'number' ? 'number' : watchedFields?.[index]?.type === 'date' ? 'date' : 'text'}
                                 {...register(`fields.${index}.defaultValue`)}
                                 placeholder="Optional"
                                 size="sm"
                               />
                             )}
                          </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                          <Form.Check
                            type="switch"
                            label="Required"
                            {...register(`fields.${index}.required`)}
                            className="fs-9 mb-2"
                          />
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Card.Body>
              </Card>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5 border rounded-3 bg-body-tertiary border-dashed">
                  <div className="text-center" style={{ maxWidth: '400px' }}>
                    <div className="mb-3 text-body-tertiary">
                      <FontAwesomeIcon icon={faPlus} size="3x" className="opacity-50" />
                    </div>
                    <h5>Form Field Builder</h5>
                    <p className="text-body-secondary mb-0">
                      You can add custom fields and configure the enrollment form after creating the program. 
                      Once created, go to the program dashboard and click Settings to access the Form Builder.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => navigate('/programs')}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update Program' : 'Create Program Database')}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default CreateProgram;
