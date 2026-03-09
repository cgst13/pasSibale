import { UilCheckCircle, UilLockAccess, UilShieldCheck, UilChartLine } from '@iconscout/react-unicons';
import Unicon from 'components/base/Unicon';
import { Card, Col, Container, Row } from 'react-bootstrap';
import bg37 from 'assets/img/bg/37.png';
import bg38 from 'assets/img/bg/38.png';
import authIllustrations from 'assets/img/spot-illustrations/auth.png';
import authIllustrationsDark from 'assets/img/spot-illustrations/auth-dark.png';
import { PropsWithChildren } from 'react';
import { Link } from 'react-router';
import Logo from 'components/common/Logo';
import classNames from 'classnames';

interface AuthCardLayoutProps {
  logo?: boolean;
  className?: string;
}

const AuthCardLayout = ({
  logo = true,
  className,
  children
}: PropsWithChildren<AuthCardLayoutProps>) => {
  return (
    <Container fluid className="bg-body-tertiary dark__bg-gray-1200 overflow-hidden">
      <div
        className="bg-holder bg-auth-card-overlay opacity-50"
        style={{ backgroundImage: `url(${bg37})`, filter: 'blur(100px)' }}
      />

      <Row className="flex-center position-relative min-vh-100 g-0 py-5">
        <Col xs={11} sm={10} md={9} lg={8} xl={7}>
          <Card className="border-0 auth-card shadow-lg overflow-hidden rounded-4">
            <Card.Body className="p-0">
              <Row className="gx-0 h-100">
                <Col
                  md={5}
                  className="bg-primary dark__bg-primary-900 d-none d-md-flex flex-column justify-content-between p-5 p-lg-6 text-white position-relative"
                >
                  <div
                    className="bg-holder opacity-20"
                    style={{ backgroundImage: `url(${bg38})` }}
                  />
                  
                  <div className="position-relative z-index-1">
                    <div className="mb-5">
                      <Logo text={false} width={45} className="mb-3 filter-white" />
                      <h2 className="text-white fw-bolder mb-2 display-6">PasSibale</h2>
                      <p className="opacity-75 fs-9 fw-medium ls-1 text-uppercase">Digital Governance Suite</p>
                    </div>

                    <div className="d-flex flex-column gap-4 mt-6">
                      <div className="d-flex align-items-start gap-3">
                        <div className="bg-white-10 p-2 rounded-3">
                          <Unicon icon={UilShieldCheck} size={24} className="text-white" />
                        </div>
                        <div>
                          <h6 className="text-white mb-1">Secure Access</h6>
                          <p className="fs-10 opacity-75 mb-0">Enterprise-grade security for municipal data and services.</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-start gap-3">
                        <div className="bg-white-10 p-2 rounded-3">
                          <Unicon icon={UilChartLine} size={24} className="text-white" />
                        </div>
                        <div>
                          <h6 className="text-white mb-1">Real-time Analytics</h6>
                          <p className="fs-10 opacity-75 mb-0">Live tracking of activities and department performance.</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-start gap-3">
                        <div className="bg-white-10 p-2 rounded-3">
                          <Unicon icon={UilLockAccess} size={24} className="text-white" />
                        </div>
                        <div>
                          <h6 className="text-white mb-1">EODB Compliance</h6>
                          <p className="fs-10 opacity-75 mb-0">Fully compliant with Ease of Doing Business standards.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="position-relative z-index-1 mt-auto pt-5 border-top border-white-10">
                    <p className="fs-11 mb-0 opacity-50">&copy; 2026 PasSibale. All rights reserved.</p>
                  </div>
                </Col>
                
                <Col md={7} className="bg-white dark__bg-gray-1100 p-5 p-lg-6 d-flex flex-column justify-content-center">
                  <div className="auth-form-box mx-auto w-100" style={{ maxWidth: '400px' }}>
                    {logo && (
                      <div className="text-center d-md-none mb-5">
                        <Link to="/" className="d-inline-block text-decoration-none">
                          <Logo text={false} width={50} />
                          <h4 className="mt-2 fw-bolder">PasSibale</h4>
                        </Link>
                      </div>
                    )}
                    {children}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .bg-white-10 { background: rgba(255, 255, 255, 0.1); }
        .border-white-10 { border-color: rgba(255, 255, 255, 0.1) !important; }
        .filter-white { filter: brightness(0) invert(1); }
        .z-index-1 { z-index: 1; }
        .ls-1 { letter-spacing: 0.1em; }
        .auth-card { min-height: 600px; }
      `}</style>
    </Container>
  );
};

export default AuthCardLayout;
