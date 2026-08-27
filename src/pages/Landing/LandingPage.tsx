import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Row, Col, Typography, Button, Flex, Alert, theme, Spin } from 'antd';
import {
  CloudOutlined,
  LoginOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { getCognitoLoginUrl } from '../../features/auth/api/cognito';
import { useAuth } from '../../features/auth';

const { Title, Text, Paragraph } = Typography;

export const LandingPage: React.FC = () => {
  const { token } = theme.useToken();
  const { isAuthenticated, isLoading, loginWithCode, error: authErrorContext } = useAuth();

  // Local error state for URL parsing errors before context takes over
  const [urlError, setUrlError] = React.useState<{ error: string; description: string } | null>(null);

  // Ref to prevent double-firing the code exchange in React StrictMode
  const processedCode = useRef<string | null>(null);

  useEffect(() => {
    // Check URL parameters for OAuth response
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (code) {
      if (processedCode.current !== code) {
        processedCode.current = code;
        // Pass the code to the AuthContext to exchange for tokens
        loginWithCode(code);
      }
    } else if (error) {
      setUrlError({
        error,
        description: errorDescription || 'Authentication request failed.',
      });
      // Clear URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loginWithCode]);

  const handleCognitoLogin = () => {
    setUrlError(null);
    const loginUrl = getCognitoLoginUrl();
    window.location.assign(loginUrl);
  };

  const handleDismissError = () => {
    setUrlError(null);
  };

  const features = [
    {
      icon: <BarChartOutlined style={{ color: '#fff', fontSize: 18 }} />,
      title: 'Real-time Multi-Cloud Visibility',
      description: 'Track spending across AWS, GCP, and Azure from a single interface.',
    },
    {
      icon: <ThunderboltOutlined style={{ color: '#fff', fontSize: 18 }} />,
      title: 'Automated Cost Optimization',
      description: 'Detect idle resources and receive automated savings recommendations.',
    },
    {
      icon: <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 18 }} />,
      title: 'Enterprise Security & SSO',
      description: 'Secured authentication with AWS Cognito Single Sign-On.',
    },
  ];

  const displayError = urlError || (authErrorContext ? { error: 'Login Failed', description: authErrorContext } : null);

  if (isLoading) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{ minHeight: '100vh', width: '100%', backgroundColor: token.colorBgLayout }}
      >
        <Flex vertical align="center" justify="center">
          <Spin size="large" />
          <Text type="secondary" style={{ marginTop: token.marginMD }}>Authenticating...</Text>
        </Flex>
      </Flex>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Row style={{ minHeight: '100vh', width: '100%' }}>
      {/* Brand / marketing panel — always dark, independent of the app's light/dark toggle */}
      <Col
        xs={{ span: 24, order: 2 }}
        md={{ span: 13, order: 1 }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 320,
          background:
            'radial-gradient(circle at 15% 15%, rgba(79,70,229,0.55) 0%, transparent 45%), ' +
            'radial-gradient(circle at 85% 75%, rgba(124,58,237,0.5) 0%, transparent 45%), ' +
            '#0b0b1a',
          padding: '64px 56px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div aria-hidden style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: '#4f46e5', filter: 'blur(140px)', opacity: 0.35, top: -100, left: -100 }} />
        <div aria-hidden style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: '#7c3aed', filter: 'blur(140px)', opacity: 0.3, bottom: -80, right: -60 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 460, margin: '0 auto', width: '100%' }}>
          <Flex align="center" gap={10} style={{ marginBottom: 48 }}>
            <Flex
              align="center"
              justify="center"
              style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.12)' }}
            >
              <CloudOutlined style={{ fontSize: 20, color: '#fff' }} />
            </Flex>
            <Text strong style={{ fontSize: 18, color: '#fff' }}>Cloud Penny</Text>
          </Flex>

          <Title style={{ color: '#fff', fontSize: 40, lineHeight: 1.15, margin: 0, fontWeight: 700, letterSpacing: '-1px' }}>
            Cloud costs,<br />finally under control.
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 16, marginBottom: 48, maxWidth: 400 }}>
            Real-time visibility, automated anomaly detection, and an AI copilot that explains every dollar you spend.
          </Paragraph>

          <Flex vertical gap={28}>
            {features.map((item) => (
              <Flex gap={16} align="flex-start" key={item.title}>
                <Flex
                  align="center"
                  justify="center"
                  style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}
                >
                  {item.icon}
                </Flex>
                <div>
                  <Text strong style={{ color: '#fff', fontSize: 15 }}>{item.title}</Text>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{item.description}</Text>
                  </div>
                </div>
              </Flex>
            ))}
          </Flex>
        </div>
      </Col>

      {/* Auth panel — respects the app's theme tokens like every other page */}
      <Col
        xs={{ span: 24, order: 1 }}
        md={{ span: 11, order: 2 }}
        style={{ background: token.colorBgLayout }}
      >
        <Flex align="center" justify="center" style={{ minHeight: '100%', padding: token.paddingLG }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Welcome back</Title>
            <Text type="secondary">Sign in to view your cost dashboard.</Text>

            <div style={{ marginTop: 32 }}>
              {displayError ? (
                <Flex vertical gap={token.marginSM}>
                  <Alert
                    message={`Error: ${displayError.error}`}
                    description={
                      <Text type="secondary" style={{ fontSize: token.fontSizeSM - 1 }}>
                        {displayError.description}
                      </Text>
                    }
                    type="error"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                  />
                  <Button type="primary" block onClick={handleCognitoLogin}>
                    Retry Login
                  </Button>
                  <Button type="default" block onClick={handleDismissError}>
                    Dismiss
                  </Button>
                </Flex>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<LoginOutlined />}
                  block
                  onClick={handleCognitoLogin}
                  style={{ height: 48, fontWeight: 600, borderRadius: token.borderRadius }}
                >
                  Sign In with AWS Cognito
                </Button>
              )}
            </div>

            <Text type="secondary" style={{ display: 'block', marginTop: 24, fontSize: 12, textAlign: 'center' }}>
              Secured by AWS Cognito Single Sign-On
            </Text>
          </div>
        </Flex>
      </Col>
    </Row>
  );
};

export default LandingPage;
