import React from 'react';
import { Typography, Card, Flex, theme } from 'antd';
import { useAuth } from '../../features/auth';


const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { token } = theme.useToken();

  return (
    <Flex vertical gap={token.marginLG}>
      <Flex vertical>
        <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">Welcome back, {user?.email || 'User'}</Text>
      </Flex>

      <Card bordered={false} style={{ minHeight: '60vh', boxShadow: token.boxShadowTertiary }}>
        <Flex vertical align="center" justify="center" style={{ height: '100%', minHeight: 400 }} gap="large">
          <Typography.Title level={3} style={{ color: token.colorTextSecondary }}>
            Under Construction 🚧
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeLG, textAlign: 'center', maxWidth: 500 }}>
            Our engineers are currently wiring up the cost analytics engine. Check back soon for your live cloud spend dashboard.
          </Typography.Text>
        </Flex>
      </Card>
    </Flex>
  );
};

export default Dashboard;
