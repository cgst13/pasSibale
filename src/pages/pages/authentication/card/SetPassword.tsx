import SetPasswordForm from 'components/modules/auth/SetPasswordForm';
import AuthCardLayout from 'layouts/AuthCardLayout';

const SetPassword = () => {
  return (
    <AuthCardLayout className="pb-md-7">
      <SetPasswordForm />
    </AuthCardLayout>
  );
};

export default SetPassword;