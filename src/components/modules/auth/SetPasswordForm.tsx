import { faKey } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'components/base/Button';
import { Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { supabase } from 'supabaseClient';
import toast from 'react-hot-toast';

const SetPasswordForm = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If we are on the hash fragment, wait for supabase to process it
        // The onAuthStateChange might handle it, but getSession might be too fast if the token is in URL
        // Usually Supabase client handles the URL token automatically before getSession returns?
        // Let's add a small delay or check URL
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
           // wait a bit
           setTimeout(async () => {
             const { data: { session: delayedSession } } = await supabase.auth.getSession();
             if (!delayedSession) {
               toast.error('Invalid or expired link.');
               navigate('/pages/authentication/card/sign-in');
             }
             setCheckingSession(false);
           }, 1000);
           return;
        }

        toast.error('No active session found. Please use the invite link.');
        navigate('/pages/authentication/card/sign-in');
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired. Please sign in again.');
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success('Password set successfully!');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <div className="text-center mb-7">
        <h3 className="text-body-highlight">Set Your Password</h3>
        <p className="text-body-tertiary">Create a secure password for your account</p>
      </div>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3 text-start">
          <Form.Label htmlFor="password">New Password</Form.Label>
          <div className="form-icon-container">
            <Form.Control
              id="password"
              type="password"
              className="form-icon-input"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <FontAwesomeIcon icon={faKey} className="text-body fs-9 form-icon" />
          </div>
        </Form.Group>

        <Form.Group className="mb-3 text-start">
          <Form.Label htmlFor="confirmPassword">Confirm Password</Form.Label>
          <div className="form-icon-container">
            <Form.Control
              id="confirmPassword"
              type="password"
              className="form-icon-input"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <FontAwesomeIcon icon={faKey} className="text-body fs-9 form-icon" />
          </div>
        </Form.Group>

        <Button variant="primary" className="w-100 mb-3" type="submit" disabled={loading}>
          {loading ? 'Setting Password...' : 'Set Password'}
        </Button>
      </Form>
    </>
  );
};

export default SetPasswordForm;