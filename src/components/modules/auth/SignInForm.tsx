import { faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'components/base/Button';
import AuthSocialButtons from 'components/common/AuthSocialButtons';
import { Col, Form, Row, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { supabase } from 'supabaseClient';
import toast from 'react-hot-toast';
import { useOfflineMode } from 'providers/OfflineModeProvider';
import { db } from 'services/offlineDb';
import bcrypt from 'bcryptjs';

interface SignInFormProps {
  layout?: 'simple' | 'card' | 'split';
}

const SignInForm = ({ layout = 'simple' }: SignInFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isOfflineMode } = useOfflineMode();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isOfflineMode) {
        // Offline Login Logic
        const cachedUser = await db.authCache.where('email').equals(email).first();
        
        if (cachedUser && bcrypt.compareSync(password, cachedUser.passwordHash)) {
          toast.success('Offline Login Successful');
          navigate('/', { replace: true });
        } else {
          toast.error('Invalid credentials in offline mode. Please verify your password or connect to the internet.');
        }
      } else {
        // Online Login Logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message);
        } else if (data.user) {
          toast.success('Logged in successfully');
          navigate('/', { replace: true });
        }
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-5">
        <h3 className="text-body-highlight fw-bolder">Welcome Back</h3>
        <p className="text-body-tertiary fs-9">Please enter your credentials to access the system.</p>
      </div>
      
      <Form onSubmit={handleSignIn}>
        <Form.Group className="mb-4 text-start">
          <Form.Label htmlFor="email" className="fw-bold fs-10 text-uppercase text-body-tertiary">Email Address</Form.Label>
          <div className="form-icon-container">
            <Form.Control
              id="email"
              type="email"
              className="form-icon-input py-3 border-2"
              placeholder="admin@passibale.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FontAwesomeIcon icon={faUser} className="text-body-quaternary fs-9 form-icon" />
          </div>
        </Form.Group>
        <Form.Group className="mb-3 text-start">
          <Form.Label htmlFor="password" title="Password" className="fw-bold fs-10 text-uppercase text-body-tertiary">Password</Form.Label>
          <div className="form-icon-container">
            <Form.Control
              id="password"
              type="password"
              className="form-icon-input py-3 border-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FontAwesomeIcon icon={faKey} className="text-body-quaternary fs-9 form-icon" />
          </div>
        </Form.Group>
        <Row className="flex-between-center mb-5">
          <Col xs="auto">
            <Form.Check type="checkbox" className="mb-0">
              <Form.Check.Input
                type="checkbox"
                name="remember-me"
                id="remember-me"
                defaultChecked
              />
              <Form.Check.Label htmlFor="remember-me" className="mb-0 fs-9 fw-medium">
                Keep me signed in
              </Form.Check.Label>
            </Form.Check>
          </Col>
          <Col xs="auto">
            <Link
              to={`/pages/authentication/${layout}/forgot-password`}
              className="fs-9 fw-bold text-decoration-none"
            >
              Forgot Password?
            </Link>
          </Col>
        </Row>
        <Button 
          variant="primary" 
          className="w-100 mb-3 py-3 fw-bolder fs-9 shadow-sm" 
          type="submit" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Authenticating...
            </>
          ) : (
            'SIGN IN TO SYSTEM'
          )}
        </Button>
      </Form>
      
      <div className="text-center mt-4">
        <span className="fs-10 text-body-tertiary">Don't have an account? </span>
        <Link
          to={`/pages/authentication/${layout}/sign-up`}
          className="fs-10 fw-bolder text-uppercase ls-1"
        >
          Contact Admin
        </Link>
      </div>
    </>
  );
};

export default SignInForm;
