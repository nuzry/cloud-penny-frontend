import React, { useEffect, useState } from 'react';
import { Card, Typography, Alert, Button, theme, Space, Divider, Row, Col, Statistic } from 'antd';
import { CloudServerOutlined, IdcardOutlined, MailOutlined, SafetyCertificateOutlined, CalendarOutlined, CheckCircleOutlined, ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons';
import { userService } from '../../api/userService';
import type { ClientProfile } from '../../api/userService';
import PageLoader from '../../components/ui/PageLoader';

const { Text, Title } = Typography;

const ProfilePage: React.FC = () => {
  const { token } = theme.useToken();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getCurrentUser();
        setProfile(data);
      } catch (err: any) {
        if (err.response && err.response.status === 404) {
          setError('Profile not found. You need to complete onboarding.');
        } else {
          setError('Failed to load profile. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <PageLoader text="Loading profile..." />;
  }

  const isConnected = profile?.connectionStatus === 'VERIFIED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {error && (
        <Alert
          message="Profile Issue"
          description={error}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="primary">
              Complete Onboarding
            </Button>
          }
        />
      )}

      {profile && (
        <Card bordered={false} style={{ flex: 1, boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG }}>
          <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>Account Details</Title>
          
          <Row gutter={[24, 24]}>
            <Col span={24} md={12}>
              <Space align="start">
                <MailOutlined style={{ fontSize: 20, color: token.colorPrimary, marginTop: 4 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Email Address</Text>
                  <Text strong style={{ fontSize: 16 }}>{profile.email}</Text>
                </div>
              </Space>
            </Col>
            
            <Col span={24} md={12}>
              <Space align="start">
                <IdcardOutlined style={{ fontSize: 20, color: token.colorPrimary, marginTop: 4 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Tenant ID</Text>
                  <Text copyable style={{ fontSize: 16 }}>{profile.tenantId}</Text>
                </div>
              </Space>
            </Col>
            
            <Col span={24} md={12}>
              <Space align="start">
                {isConnected ? 
                  <CheckCircleOutlined style={{ fontSize: 20, color: token.colorSuccess, marginTop: 4 }} /> : 
                  <ExclamationCircleOutlined style={{ fontSize: 20, color: token.colorWarning, marginTop: 4 }} />
                }
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Connection Status</Text>
                  <Text type={isConnected ? 'success' : 'warning'} strong style={{ fontSize: 16 }}>
                    {profile.connectionStatus?.toUpperCase() || 'PENDING'}
                  </Text>
                </div>
              </Space>
            </Col>

            <Col span={24} md={12}>
              <Space align="start">
                <SafetyCertificateOutlined style={{ fontSize: 20, color: token.colorPrimary, marginTop: 4 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Plan Tier</Text>
                  <Text strong style={{ fontSize: 16 }}>{profile.planTier?.toUpperCase() || 'FREE'}</Text>
                </div>
              </Space>
            </Col>
          </Row>

          <Divider style={{ margin: '32px 0' }} />
          
          <Title level={5} style={{ marginTop: 0, marginBottom: 24 }}>AWS Integration</Title>

          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Space align="start">
                <CloudServerOutlined style={{ fontSize: 20, color: token.colorInfo, marginTop: 4 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>AWS Account ID</Text>
                  <Text copyable style={{ fontSize: 16 }}>{profile.roleArn ? profile.roleArn.split(':')[4] : 'Not Connected'}</Text>
                </div>
              </Space>
            </Col>

            <Col span={24}>
              <Space align="start">
                <LockOutlined style={{ fontSize: 20, color: token.colorInfo, marginTop: 4 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>IAM Cross-Account Role ARN</Text>
                  <Text copyable style={{ fontSize: 14, fontFamily: 'monospace' }}>{profile.roleArn || 'Not Connected'}</Text>
                </div>
              </Space>
            </Col>
          </Row>

          <Divider style={{ margin: '32px 0' }} />

          <Row gutter={[24, 24]}>
            <Col span={24} md={12}>
              <Space align="start">
                <CalendarOutlined style={{ fontSize: 20, color: token.colorTextDescription, marginTop: 4 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Member Since</Text>
                  <Text style={{ fontSize: 14 }}>
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                  </Text>
                </div>
              </Space>
            </Col>
          </Row>

        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
