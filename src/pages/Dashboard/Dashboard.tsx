import React from 'react';
import { Typography, Card, Flex, theme } from 'antd';
import { useAuth } from '../../features/auth';


const { Text } = Typography;

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { token } = theme.useToken();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Card bordered={false} style={{ flex: 1, boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG, display: 'flex', flexDirection: 'column' }}>
        <Text type="secondary" style={{ fontSize: 16, marginBottom: 24, display: 'block' }}>Welcome back, {user?.email || 'User'}</Text>
        <Flex vertical align="center" justify="center" style={{ flex: 1, minHeight: 300 }} gap="large">
          <Typography.Title level={3} style={{ color: token.colorTextSecondary, marginTop: 0 }}>
            Under Construction 🚧
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeLG, textAlign: 'center', maxWidth: 500 }}>
            Our engineers are currently wiring up the cost analytics engine. Check back soon for your live cloud spend dashboard.
          </Typography.Text>
        </Flex>
      </Card>
    </div>
  );
};

export default Dashboard;
