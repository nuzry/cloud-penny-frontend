import React from 'react';
import { Card, Typography, Alert, Button, theme, Space, Divider, Row, Col } from 'antd';
import { CloudServerOutlined, IdcardOutlined, MailOutlined, SafetyCertificateOutlined, CalendarOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useClientMe } from '@/hooks/useClientQueries';
import PageLoader from '../../components/ui/PageLoader';
import PageHeader from '../../components/ui/PageHeader';
import { formatDate } from '../../utils/format';

const { Text, Title } = Typography;

interface LabeledFieldProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

// Value styling (bold/copyable/color) differs per field, so this only
// standardizes the icon + uppercase-label wrapper — the value is passed in
// already styled by the caller.
const LabeledField: React.FC<LabeledFieldProps> = ({ icon, label, children }) => (
  <Space align="start">
    {icon}
    <div>
      <Text type="secondary" style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Text>
      {children}
    </div>
  </Space>
);

const ProfilePage: React.FC = () => {
  const { token } = theme.useToken();
  const { data: profile, isLoading, error } = useClientMe();

  if (isLoading) {
    return <PageLoader text="Loading profile..." />;
  }

  const is404 = (error as any)?.response?.status === 404;
  const errorMessage = error
    ? is404
      ? 'Profile not found. You need to complete onboarding.'
      : 'Failed to load profile. Please try again.'
    : null;

  const isConnected = profile?.connectionStatus === 'VERIFIED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader title="Profile" description="Your account and AWS integration details." />

      {errorMessage && (
        <Alert
          message="Profile Issue"
          description={errorMessage}
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
              <LabeledField icon={<MailOutlined style={{ fontSize: 20, color: token.colorPrimary, marginTop: 4 }} />} label="Email Address">
                <Text strong style={{ fontSize: 16 }}>{profile.email}</Text>
              </LabeledField>
            </Col>

            <Col span={24} md={12}>
              <LabeledField icon={<IdcardOutlined style={{ fontSize: 20, color: token.colorPrimary, marginTop: 4 }} />} label="Tenant ID">
                <Text copyable style={{ fontSize: 16 }}>{profile.tenantId}</Text>
              </LabeledField>
            </Col>

            <Col span={24} md={12}>
              <LabeledField
                icon={isConnected
                  ? <CheckCircleOutlined style={{ fontSize: 20, color: token.colorSuccess, marginTop: 4 }} />
                  : <ExclamationCircleOutlined style={{ fontSize: 20, color: token.colorWarning, marginTop: 4 }} />}
                label="Connection Status"
              >
                <Text type={isConnected ? 'success' : 'warning'} strong style={{ fontSize: 16 }}>
                  {profile.connectionStatus?.toUpperCase() || 'PENDING'}
                </Text>
              </LabeledField>
            </Col>

            <Col span={24} md={12}>
              <LabeledField icon={<SafetyCertificateOutlined style={{ fontSize: 20, color: token.colorPrimary, marginTop: 4 }} />} label="Plan Tier">
                <Text strong style={{ fontSize: 16 }}>{profile.planTier?.toUpperCase() || 'FREE'}</Text>
              </LabeledField>
            </Col>
          </Row>

          <Divider style={{ margin: '32px 0' }} />

          <Title level={5} style={{ marginTop: 0, marginBottom: 24 }}>AWS Integration</Title>

          <Row gutter={[24, 24]}>
            <Col span={24}>
              <LabeledField icon={<CloudServerOutlined style={{ fontSize: 20, color: token.colorInfo, marginTop: 4 }} />} label="AWS Account ID">
                <Text copyable style={{ fontSize: 16 }}>{profile.awsAccountId || 'Not Connected'}</Text>
              </LabeledField>
            </Col>
          </Row>

          <Divider style={{ margin: '32px 0' }} />

          <Row gutter={[24, 24]}>
            <Col span={24} md={12}>
              <LabeledField icon={<CalendarOutlined style={{ fontSize: 20, color: token.colorTextDescription, marginTop: 4 }} />} label="Member Since">
                <Text style={{ fontSize: 14 }}>
                  {profile.createdAt ? formatDate(profile.createdAt) : 'Unknown'}
                </Text>
              </LabeledField>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
