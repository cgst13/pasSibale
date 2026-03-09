import SignOutForm from 'components/modules/auth/SignOutForm';
import AuthCardLayout from 'layouts/AuthCardLayout';

const SignOut = () => {
  return (
    <AuthCardLayout logo={false}>
      <SignOutForm layout="card" />
    </AuthCardLayout>
  );
};

export default SignOut;
