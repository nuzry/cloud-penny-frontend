import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Spin, Typography, Alert, Button, Flex } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { userService } from '../../api/userService';
import type { ClientProfile } from '../../api/userService';


const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getCurrentUser();
        setProfile(data);
      } catch (err: any) {
        // We know a 404 is expected for new users until the form is built
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
    return (
      <Flex justify="center" align="center" style={{ height: '50vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <div>
      <Title level={2}>
        <UserOutlined style={{ marginRight: 8 }} />
        My Profile
      </Title>
      
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
        <Card bordered={false}>
          <Descriptions title="Account Details" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
            <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
            <Descriptions.Item label="Tenant ID">
              <Text copyable>{profile.tenantId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Onboarding Status">
              <Text type={profile.onboardingStatus === 'connected' ? 'success' : 'warning'} strong>
                {profile.onboardingStatus.toUpperCase()}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Plan Tier">
              <Text strong>{profile.planTier.toUpperCase()}</Text>
            </Descriptions.Item>
            
            {profile.awsAccountId && (
              <Descriptions.Item label="AWS Account ID">
                <Text copyable>{profile.awsAccountId}</Text>
              </Descriptions.Item>
            )}
            
            {profile.crossAccountRoleArn && (
              <Descriptions.Item label="IAM Role ARN">
                <Text copyable>{profile.crossAccountRoleArn}</Text>
              </Descriptions.Item>
            )}
            
            <Descriptions.Item label="Created At">
              {new Date(profile.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {new Date(profile.updatedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
