import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, Typography, Button, Flex, List, Alert, theme, Spin } from 'antd';
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
      icon: <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />,
      title: 'Real-time Multi-Cloud Visibility',
      description: 'Track spending across AWS, GCP, and Azure from a single interface.',
    },
    {
      icon: <ThunderboltOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />,
      title: 'Automated Cost Optimization',
      description: 'Detect idle resources and receive automated savings recommendations.',
    },
    {
      icon: <SafetyCertificateOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />,
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
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: token.colorBgLayout,
        }}
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
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: token.colorBgLayout,
        padding: token.paddingLG,
      }}
    >
      <Card
        bordered={false}
        style={{
          width: '100%',
          maxWidth: 480,
          boxShadow: token.boxShadowSecondary,
          borderRadius: token.borderRadiusLG * 1.5,
          padding: token.paddingSM,
        }}
      >
        <Flex vertical align="center" gap={token.marginMD} style={{ width: '100%' }}>
          {/* Cloud Penny Header Brand Display */}
          <Flex align="center" gap={token.marginXS}>
            <Flex
              align="center"
              justify="center"
              style={{
                width: 42,
                height: 42,
                borderRadius: token.borderRadiusLG,
                backgroundColor: token.colorPrimary,
                color: '#ffffff',
                fontSize: 22,
              }}
            >
              <CloudOutlined />
            </Flex>
            <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
              Cloud Penny
            </Title>
          </Flex>

          <Flex vertical align="center" style={{ textAlign: 'center' }}>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              Cloud Cost Optimization
            </Title>
            <Paragraph type="secondary" style={{ fontSize: token.fontSizeSM, margin: 0, marginTop: 4 }}>
              Master your cloud spend with every penny accounted for.
            </Paragraph>
          </Flex>

          {/* Errors */}
          {displayError && (
            <Flex vertical gap={token.marginSM} style={{ width: '100%' }}>
              <Alert
                message={`Error: ${displayError.error}`}
                description={
                  <Flex vertical gap={token.marginXXS}>
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM - 1 }}>
                      {displayError.description}
                    </Text>
                  </Flex>
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
          )}

          {/* Default State: 3 Key Features & Login Button */}
          {!isAuthenticated && !displayError && (
            <>
              <List
                itemLayout="horizontal"
                dataSource={features}
                style={{ width: '100%', marginTop: token.marginXS }}
                renderItem={(item) => (
                  <List.Item style={{ padding: `${token.paddingSM}px 0`, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                    <List.Item.Meta
                      avatar={
                        <Flex
                          align="center"
                          justify="center"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: token.borderRadius,
                            backgroundColor: token.colorPrimaryBg,
                          }}
                        >
                          {item.icon}
                        </Flex>
                      }
                      title={<Text style={{ fontWeight: 600, fontSize: token.fontSize }}>{item.title}</Text>}
                      description={
                        <Text type="secondary" style={{ fontSize: token.fontSizeSM - 1 }}>
                          {item.description}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />

              <Button
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                block
                onClick={handleCognitoLogin}
                style={{
                  height: 46,
                  fontWeight: 600,
                  borderRadius: token.borderRadius,
                  marginTop: token.marginSM,
                }}
              >
                Sign In with AWS Cognito
              </Button>
            </>
          )}
        </Flex>
      </Card>
    </Flex>
  );
};

export default LandingPage;
