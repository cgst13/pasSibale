import SignInForm from 'components/modules/auth/SignInForm';
import AuthCardLayout from 'layouts/AuthCardLayout';

const SignIn = () => {
  return (
    <AuthCardLayout className="pb-md-7">
      <SignInForm layout="card" />
    </AuthCardLayout>
  );
};

export default SignIn;
