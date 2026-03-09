import { useState, useEffect, useRef } from 'react';
import { Button, Col, Form, Row, Card, Nav, Tab } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import { Citizen } from 'types/citizen';
import dayjs from 'dayjs';
import { createCitizen, getCitizen, updateCitizen, uploadCitizenPhoto } from 'services/citizenService';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'react-hot-toast';
import PhilAddress from 'phil-reg-prov-mun-brgy';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import Webcam from 'react-webcam';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { 
  UilUser, 
  UilMapMarker, 
  UilPhone, 
  UilQrcodeScan,
  UilSave,
  UilTimes
} from '@iconscout/react-unicons';

interface LocationEntity {
  name: string;
  reg_code?: string;
  prov_code?: string;
  mun_code?: string;
  brgy_code?: string;
}

const AddCitizen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<Citizen>({
    defaultValues: {
      nationality: 'Filipino',
      residencyStatus: 'Permanent',
      houseNumberStreet: '',
      purokSitio: '',
      zipCode: '5516',
      nfcCardId: '',
      qrCode: '',
      fingerprintTemplate: ''
    }
  });

  const [regions, setRegions] = useState<LocationEntity[]>([]);
  const [provinces, setProvinces] = useState<LocationEntity[]>([]);
  const [cities, setCities] = useState<LocationEntity[]>([]);
  const [barangays, setBarangays] = useState<LocationEntity[]>([]);

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [generatedQRCode, setGeneratedQRCode] = useState<string>('');
  
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    setRegions(PhilAddress.regions);

    if (!id) {
      // Generate QR Code for new citizen
      const newQRCode = uuidv4();
      setGeneratedQRCode(newQRCode);
      setValue('qrCode', newQRCode);
      
      // Set Defaults: Concepcion, Romblon, Region IV-B
      const defaultRegionCode = '17'; // REGION IV-B (MIMAROPA)
      const defaultProvinceCode = '1759'; // ROMBLON
      const defaultCityCode = '175905'; // CONCEPCION

      setSelectedRegion(defaultRegionCode);

      const filteredProvinces = PhilAddress.getProvincesByRegion(defaultRegionCode);
      setProvinces(filteredProvinces);

      setSelectedProvince(defaultProvinceCode);
      const province = filteredProvinces.find((p: LocationEntity) => p.prov_code === defaultProvinceCode);
      if (province) {
        setValue('province', province.name, { shouldValidate: true });
      }

      const filteredCities = PhilAddress.getCityMunByProvince(defaultProvinceCode);
      setCities(filteredCities);

      setSelectedCity(defaultCityCode);
      const city = filteredCities.find((c: LocationEntity) => c.mun_code === defaultCityCode);
      if (city) {
        setValue('cityMunicipality', city.name, { shouldValidate: true });
      }

      const filteredBarangays = PhilAddress.getBarangayByMun(defaultCityCode);
      setBarangays(filteredBarangays);

      setValue('zipCode', '5516', { shouldValidate: true });
    }
  }, [id, setValue]);

  useEffect(() => {
    if (id) {
      const fetchCitizen = async () => {
        try {
          const data = await getCitizen(id);
          reset(data);

          if (data.photoUrl) {
            setPhotoPreview(data.photoUrl);
          }

          if (data.qrCode) {
            setGeneratedQRCode(data.qrCode);
          } else {
             // Generate if missing (legacy records)
             const newQr = uuidv4();
             setGeneratedQRCode(newQr);
             setValue('qrCode', newQr);
          }

          // Reverse lookup for address dropdowns
          if (data.province) {
            const province = PhilAddress.provinces.find((p: LocationEntity) => p.name === data.province);
            if (province) {
              setSelectedProvince(province.prov_code);
              const filteredCities = PhilAddress.getCityMunByProvince(province.prov_code);
              setCities(filteredCities);
              
              // Set Region
              setSelectedRegion(province.reg_code);
              const filteredProvinces = PhilAddress.getProvincesByRegion(province.reg_code);
              setProvinces(filteredProvinces);

              if (data.cityMunicipality) {
                const city = filteredCities.find((c: LocationEntity) => c.name === data.cityMunicipality);
                if (city) {
                  setSelectedCity(city.mun_code);
                  const filteredBarangays = PhilAddress.getBarangayByMun(city.mun_code);
                  setBarangays(filteredBarangays);
                }
              }
            }
          }
        } catch (error) {
          console.error(error);
          toast.error('Failed to load citizen data');
          navigate('/citizens/list');
        }
      };
      fetchCitizen();
    }
  }, [id, reset, navigate, setValue]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionCode = e.target.value;
    setSelectedRegion(regionCode);
    setSelectedProvince('');
    setSelectedCity('');
    setCities([]);
    setBarangays([]);
    setValue('province', '', { shouldValidate: true });
    setValue('cityMunicipality', '', { shouldValidate: true });
    setValue('barangay', '', { shouldValidate: true });

    if (regionCode) {
      const filteredProvinces = PhilAddress.getProvincesByRegion(regionCode);
      setProvinces(filteredProvinces);
    } else {
      setProvinces([]);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = e.target.value;
    setSelectedProvince(provinceCode);
    setSelectedCity('');
    setBarangays([]);
    setValue('cityMunicipality', '', { shouldValidate: true });
    setValue('barangay', '', { shouldValidate: true });

    const province = provinces.find(p => p.prov_code === provinceCode);
    if (province) {
      setValue('province', province.name, { shouldValidate: true });
    }

    if (provinceCode) {
      const filteredCities = PhilAddress.getCityMunByProvince(provinceCode);
      setCities(filteredCities);
    } else {
      setCities([]);
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityCode = e.target.value;
    setSelectedCity(cityCode);
    setValue('barangay', '', { shouldValidate: true });

    const city = cities.find(c => c.mun_code === cityCode);
    if (city) {
      setValue('cityMunicipality', city.name, { shouldValidate: true });
    }

    if (cityCode) {
      const filteredBarangays = PhilAddress.getBarangayByMun(cityCode);
      setBarangays(filteredBarangays);
    } else {
      setBarangays([]);
    }
  };


  const dateOfBirth = watch('dateOfBirth');

  useEffect(() => {
    if (dateOfBirth) {
      const dob = dayjs(dateOfBirth);
      const today = dayjs();
      const age = today.diff(dob, 'year');
      setValue('age', age);
    }
  }, [dateOfBirth, setValue]);

  useEffect(() => {
    if (!id) {
      // Keep QR code persistent if already generated
      if (!generatedQRCode) {
        setGeneratedQRCode(uuidv4());
      }
    }
  }, [id, generatedQRCode]);

  useEffect(() => {
    // Sync generated QR code to form
    if (generatedQRCode) {
      setValue('qrCode', generatedQRCode);
    }
  }, [generatedQRCode, setValue]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setShowWebcam(false);
    }
  };

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPhotoPreview(imageSrc);
        
        // Convert base64 to file
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
            setPhotoFile(file);
          });
          
        setShowWebcam(false);
      }
    }
  };

  const onSubmit = async (data: Citizen) => {
    try {
      let photoUrl = data.photoUrl;

      if (photoFile) {
        photoUrl = await uploadCitizenPhoto(photoFile);
      }

      const citizenDataWithPhoto = {
        ...data,
        photoUrl,
        nfcCardId: data.nfcCardId && data.nfcCardId.trim() !== '' ? data.nfcCardId.trim() : null,
        qrCode: data.qrCode && data.qrCode.trim() !== '' ? data.qrCode.trim() : null,
        fingerprintTemplate: data.fingerprintTemplate && data.fingerprintTemplate.trim() !== '' ? data.fingerprintTemplate.trim() : null
      };

      if (isEditMode && id) {
        await updateCitizen(id, citizenDataWithPhoto);
        toast.success('Citizen updated successfully!');
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...citizenData } = citizenDataWithPhoto;
        await createCitizen(citizenData);
        toast.success('Citizen added successfully!');
      }
      navigate('/citizens/list');
    } catch (error) {
      console.error(error);
      toast.error(isEditMode ? 'Failed to update citizen' : 'Failed to add citizen');
    }
  };

  const breadcrumbItems = [
    { label: 'Citizens', url: '/citizens/list' },
    { label: isEditMode ? 'Edit Citizen' : 'Add Citizen', active: true }
  ];

  return (
    <div>
      <PageBreadcrumb items={breadcrumbItems} />
      
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row className="g-5">
          {/* Left Sidebar: Profile & Actions */}
          <Col xl={4}>
            {/* Profile Picture Card */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-body-tertiary border-0 pb-0">
                <h5 className="mb-0">Profile Picture</h5>
              </Card.Header>
              <Card.Body className="text-center">
                <div className="mb-3">
                  {showWebcam ? (
                    <div className="text-center mb-2">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width="100%"
                        videoConstraints={{ facingMode: "user" }}
                        className="img-thumbnail mb-2 rounded"
                      />
                      <Button variant="primary" size="sm" onClick={handleCapture} className="w-100">Capture Photo</Button>
                    </div>
                  ) : (
                    <div className="position-relative d-inline-block mb-3">
                       <img 
                          src={photoPreview || '/assets/img/team/avatar.webp'} 
                          alt="Profile Preview" 
                          style={{ width: '200px', height: '200px', objectFit: 'cover' }} 
                          className="img-thumbnail rounded-circle shadow-sm" 
                        />
                    </div>
                  )}
                </div>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant={showWebcam ? "danger" : "outline-primary"} 
                    size="sm" 
                    onClick={() => setShowWebcam(!showWebcam)}
                  >
                    {showWebcam ? "Cancel Camera" : "Use Camera"}
                  </Button>
                  <div className="position-relative">
                    <Button variant="outline-secondary" size="sm" className="w-100">Upload Photo</Button>
                    <Form.Control 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange}
                      className="position-absolute top-0 start-0 opacity-0 w-100 h-100"
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Identification Card */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-body-tertiary border-0">
                <h5 className="mb-0">Identification</h5>
              </Card.Header>
              <Card.Body className="text-center">
                <div className="mb-3">
                   {generatedQRCode && (
                    <div className="p-3 bg-white d-inline-block border rounded">
                      <QRCodeSVG value={generatedQRCode} size={150} />
                      <p className="mt-2 text-muted small font-monospace">{generatedQRCode}</p>
                    </div>
                  )}
                  <Form.Control type="hidden" {...register('qrCode')} />
                </div>
                <Form.Group className="mb-3 text-start">
                  <Form.Label className="small text-muted">Citizen ID (System Generated)</Form.Label>
                  <Form.Control type="text" {...register('id')} readOnly disabled className="bg-body-secondary font-monospace" />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Actions Card */}
            <Card className="shadow-sm border-0 sticky-top" style={{ top: '100px', zIndex: 1020 }}>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={isSubmitting} size="lg">
                    <UilSave size={20} className="me-2" />
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Citizen' : 'Save Citizen')}
                  </Button>
                  <Button variant="outline-secondary" type="button" onClick={() => navigate('/citizens/list')}>
                    <UilTimes size={20} className="me-2" /> Cancel
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Right Content: Tabs */}
          <Col xl={8}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-0">
                <Tab.Container defaultActiveKey="personal">
                  <div className="border-bottom border-translucent px-4 pt-3">
                    <Nav variant="underline" className="mb-0 border-0 flex-nowrap overflow-auto">
                      <Nav.Item>
                        <Nav.Link eventKey="personal" className="py-3 px-3 d-flex align-items-center">
                          <UilUser size={18} className="me-2" /> Personal Info
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="address" className="py-3 px-3 d-flex align-items-center">
                          <UilMapMarker size={18} className="me-2" /> Address
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="contact" className="py-3 px-3 d-flex align-items-center">
                          <UilPhone size={18} className="me-2" /> Contact
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                <Nav.Link eventKey="system" className="py-3 px-3 d-flex align-items-center">
                  <UilQrcodeScan size={18} className="me-2" /> Biometrics & System
                </Nav.Link>
              </Nav.Item>
                    </Nav>
                  </div>

                  <Tab.Content className="p-4">
                    {/* Personal Info Tab */}
                    <Tab.Pane eventKey="personal">
                      <h5 className="mb-4 text-body-highlight">Basic Personal Information</h5>
                      <Row className="g-3 mb-3">
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>First Name</Form.Label>
                            <Form.Control 
                              type="text" 
                              {...register('firstName', { required: 'First Name is required' })} 
                              isInvalid={!!errors.firstName}
                            />
                            <Form.Control.Feedback type="invalid">{errors.firstName?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Middle Name</Form.Label>
                            <Form.Control type="text" {...register('middleName')} />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control 
                              type="text" 
                              {...register('lastName', { required: 'Last Name is required' })} 
                              isInvalid={!!errors.lastName}
                            />
                            <Form.Control.Feedback type="invalid">{errors.lastName?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-3 mb-3">
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Suffix</Form.Label>
                            <Form.Select {...register('suffix')}>
                              <option value="">None</option>
                              <option value="Jr.">Jr.</option>
                              <option value="Sr.">Sr.</option>
                              <option value="II">II</option>
                              <option value="III">III</option>
                              <option value="IV">IV</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Sex / Gender</Form.Label>
                            <Form.Select {...register('sex', { required: 'Sex is required' })} isInvalid={!!errors.sex}>
                              <option value="">Select...</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.sex?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Date of Birth</Form.Label>
                            <Form.Control 
                              type="date" 
                              {...register('dateOfBirth', { required: 'Date of Birth is required' })} 
                              isInvalid={!!errors.dateOfBirth}
                            />
                            <Form.Control.Feedback type="invalid">{errors.dateOfBirth?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Age</Form.Label>
                            <Form.Control type="number" {...register('age')} readOnly className="bg-body-secondary" />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-3 mb-3">
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Civil Status</Form.Label>
                            <Form.Select {...register('civilStatus', { required: 'Civil Status is required' })} isInvalid={!!errors.civilStatus}>
                              <option value="">Select...</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Widowed">Widowed</option>
                              <option value="Separated">Separated</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.civilStatus?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Nationality</Form.Label>
                            <Form.Control type="text" {...register('nationality')} />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Religion</Form.Label>
                            <Form.Control type="text" {...register('religion')} />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Blood Type</Form.Label>
                            <Form.Select {...register('bloodType')}>
                              <option value="">Select...</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Tab.Pane>

                    {/* Address Tab */}
                    <Tab.Pane eventKey="address">
                      <h5 className="mb-4 text-body-highlight">Residential Address</h5>
                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Region</Form.Label>
                            <Form.Select 
                              value={selectedRegion} 
                              onChange={handleRegionChange}
                            >
                              <option value="">Select Region...</option>
                              {regions.map((region: LocationEntity, index: number) => (
                                <option key={`${region.reg_code}-${index}`} value={region.reg_code}>
                                  {region.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Province</Form.Label>
                            <Form.Select 
                              value={selectedProvince} 
                              onChange={handleProvinceChange}
                              disabled={!selectedRegion}
                              isInvalid={!!errors.province}
                            >
                              <option value="">Select Province...</option>
                              {provinces.map((province: LocationEntity, index: number) => (
                                <option key={`${province.prov_code}-${index}`} value={province.prov_code}>
                                  {province.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.province?.message}</Form.Control.Feedback>
                            <input type="hidden" {...register('province', { required: 'Province is required' })} />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>City / Municipality</Form.Label>
                            <Form.Select 
                              value={selectedCity} 
                              onChange={handleCityChange}
                              disabled={!selectedProvince}
                              isInvalid={!!errors.cityMunicipality}
                            >
                              <option value="">Select City/Municipality...</option>
                              {cities.map((city: LocationEntity, index: number) => (
                                <option key={`${city.mun_code}-${index}`} value={city.mun_code}>
                                  {city.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.cityMunicipality?.message}</Form.Control.Feedback>
                            <input type="hidden" {...register('cityMunicipality', { required: 'City/Municipality is required' })} />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Barangay</Form.Label>
                            <Form.Select 
                              {...register('barangay', { required: 'Barangay is required' })}
                              disabled={!selectedCity}
                              isInvalid={!!errors.barangay}
                            >
                              <option value="">Select Barangay...</option>
                              {barangays.map((barangay: LocationEntity, index: number) => (
                                <option key={`${barangay.brgy_code}-${index}`} value={barangay.name}>
                                  {barangay.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.barangay?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>House Number / Street</Form.Label>
                            <Form.Control 
                              type="text" 
                              {...register('houseNumberStreet')}
                              isInvalid={!!errors.houseNumberStreet}
                            />
                            <Form.Control.Feedback type="invalid">{errors.houseNumberStreet?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Purok / Sitio</Form.Label>
                            <Form.Control 
                              type="text" 
                              {...register('purokSitio')}
                              isInvalid={!!errors.purokSitio}
                            />
                            <Form.Control.Feedback type="invalid">{errors.purokSitio?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Zip Code</Form.Label>
                            <Form.Control 
                              type="text" 
                              {...register('zipCode', { required: 'Zip Code is required' })}
                              isInvalid={!!errors.zipCode}
                            />
                            <Form.Control.Feedback type="invalid">{errors.zipCode?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Residency Status</Form.Label>
                            <Form.Select {...register('residencyStatus')}>
                              <option value="Permanent">Permanent</option>
                              <option value="Temporary">Temporary</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Tab.Pane>

                    {/* Contact Tab */}
                    <Tab.Pane eventKey="contact">
                      <h5 className="mb-4 text-body-highlight">Contact Information</h5>
                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Mobile Number</Form.Label>
                            <Form.Control 
                              type="tel" 
                              {...register('mobileNumber', { required: 'Mobile Number is required' })} 
                              isInvalid={!!errors.mobileNumber}
                            />
                            <Form.Control.Feedback type="invalid">{errors.mobileNumber?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control 
                              type="email" 
                              {...register('email', { required: 'Email is required' })} 
                              isInvalid={!!errors.email}
                            />
                            <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <hr className="my-4 opacity-25" />
                      
                      <h5 className="mb-4 text-body-highlight">Emergency Contact</h5>
                      <div className="bg-danger-subtle p-3 rounded-2 border border-danger-subtle">
                        <Row className="g-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Emergency Contact Person</Form.Label>
                              <Form.Control 
                                type="text" 
                                {...register('emergencyContactPerson', { required: 'Emergency Contact Person is required' })}
                                isInvalid={!!errors.emergencyContactPerson}
                              />
                              <Form.Control.Feedback type="invalid">{errors.emergencyContactPerson?.message}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Emergency Contact Number</Form.Label>
                              <Form.Control 
                                type="tel" 
                                {...register('emergencyContactNumber', { required: 'Emergency Contact Number is required' })}
                                isInvalid={!!errors.emergencyContactNumber}
                              />
                              <Form.Control.Feedback type="invalid">{errors.emergencyContactNumber?.message}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                    </Tab.Pane>

                    {/* Biometrics & System Tab */}
                    <Tab.Pane eventKey="system">
                      <h5 className="mb-4 text-body-highlight">Biometrics, Identifiers & Access</h5>
                      <Row className="g-3">
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label>NFC Card ID (Optional)</Form.Label>
                            <Form.Control 
                              type="text" 
                              placeholder="Scan or enter NFC Card ID"
                              {...register('nfcCardId')} 
                            />
                            <Form.Text className="text-muted">
                              You can link an NFC card now or edit this citizen later to add it.
                            </Form.Text>
                          </Form.Group>
                        </Col>

                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="d-flex align-items-center gap-2">
                                <FontAwesomeIcon icon={faFingerprint} /> Fingerprint Template (Optional)
                            </Form.Label>
                            <Form.Control 
                              as="textarea"
                              rows={3}
                              {...register('fingerprintTemplate')}
                              placeholder="Fingerprint template data..."
                            />
                            <Form.Text className="text-muted">
                              Scan fingerprint to populate this field (requires scanner integration).
                            </Form.Text>
                          </Form.Group>
                        </Col>

                        <Col md={12}>
                          <Form.Group>
                            <Form.Label>QR Code (Auto-generated)</Form.Label>
                            <div className="d-flex align-items-center gap-3 p-3 border rounded-2 bg-body-highlight">
                              <div className="bg-white p-2 rounded">
                                <QRCodeSVG value={generatedQRCode || 'placeholder'} size={100} />
                              </div>
                              <div>
                                <h6 className="mb-1 text-body-secondary font-monospace">{generatedQRCode}</h6>
                                <p className="mb-0 text-body-tertiary small">Unique identifier for this citizen</p>
                                <input type="hidden" {...register('qrCode')} />
                              </div>
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddCitizen;