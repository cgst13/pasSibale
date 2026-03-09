import Avatar from 'components/base/Avatar';
import { useState, useEffect } from 'react';
import { Card, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCog, faQuestionCircle, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import classNames from 'classnames';
import { supabase } from 'supabaseClient';
import defaultAvatar from 'assets/img/team/avatar.webp'; 

const ProfileDropdownMenu = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch profile details if available (e.g., from a profiles table)
        if (user) {
           const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
           
           setUser({ ...user, ...profile });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/authentication/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/authentication/sign-in');
    }
  };

  const avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url || defaultAvatar;
  const fullName = user?.full_name || user?.user_metadata?.full_name || 'User';
  const email = user?.email || '';

  return (
    <Dropdown.Menu
      align="end"
      className={classNames(
        className,
        'navbar-top-dropdown-menu navbar-dropdown-caret py-0 dropdown-profile shadow border-0 rounded-3 mt-2'
      )}
      style={{ minWidth: '18rem' }}
    >
      <Card className="position-relative border-0 rounded-3">
        <Card.Body className="p-3">
          <div className="d-flex flex-column align-items-center justify-content-center gap-2 pt-2 pb-3">
            <Avatar 
              src={avatarUrl} 
              size="xl" 
              className="rounded-circle shadow-sm border border-light"
            />
            <div className="text-center">
              <h6 className="text-body-emphasis fw-bold mb-0">{fullName}</h6>
              <span className="text-body-tertiary fs-10">{email}</span>
            </div>
          </div>
          
          <div className="border-top border-translucent my-2"></div>

          <div className="d-flex flex-column gap-1">
             <Dropdown.Item as={Link} to="/users/profile" className="px-3 py-2 rounded-2 d-flex align-items-center gap-2 text-body-highlight">
                <FontAwesomeIcon icon={faUser} className="text-body-tertiary" fixedWidth />
                <span className="fw-semibold fs-9">My Profile</span>
             </Dropdown.Item>
             <Dropdown.Item as={Link} to="/settings" className="px-3 py-2 rounded-2 d-flex align-items-center gap-2 text-body-highlight">
                <FontAwesomeIcon icon={faCog} className="text-body-tertiary" fixedWidth />
                <span className="fw-semibold fs-9">Account Settings</span>
             </Dropdown.Item>
             <Dropdown.Item as={Link} to="/help" className="px-3 py-2 rounded-2 d-flex align-items-center gap-2 text-body-highlight">
                <FontAwesomeIcon icon={faQuestionCircle} className="text-body-tertiary" fixedWidth />
                <span className="fw-semibold fs-9">Help Center</span>
             </Dropdown.Item>
          </div>

        </Card.Body>
        <Card.Footer className="p-3 border-top border-translucent bg-body-tertiary rounded-bottom-3">
            <button
              type="button"
              className="btn btn-phoenix-secondary w-100 d-flex align-items-center justify-content-center gap-2 fw-bold"
              onClick={handleSignOut}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              Sign out
            </button>
        </Card.Footer>
      </Card>
    </Dropdown.Menu>
  );
};

export default ProfileDropdownMenu;
