import TwoFAForm from 'components/modules/auth/TwoFAForm';
import AuthCardLayout from 'layouts/AuthCardLayout';

const TwoFA = () => {
  return (
    <AuthCardLayout>
      <TwoFAForm />
    </AuthCardLayout>
  );
};

export default TwoFA;
