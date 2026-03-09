import SignUpForm from 'components/modules/auth/SignUpForm';
import AuthCardLayout from 'layouts/AuthCardLayout';

const SignUp = () => {
  return (
    <AuthCardLayout className="card-sign-up">
      <SignUpForm layout="card" />
    </AuthCardLayout>
  );
};

export default SignUp;
