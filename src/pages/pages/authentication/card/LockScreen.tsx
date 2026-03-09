import LockScreenForm from 'components/modules/auth/LockScreenForm';
import AuthCardLayout from 'layouts/AuthCardLayout';

const LockScreen = () => {
  return (
    <AuthCardLayout logo={false}>
      <LockScreenForm />
    </AuthCardLayout>
  );
};

export default LockScreen;
