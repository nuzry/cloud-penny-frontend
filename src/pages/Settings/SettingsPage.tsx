import React from 'react';
import { Typography, Card, Flex, theme, Tabs } from 'antd';
import ConnectAWS from './ConnectAWS';

const SettingsPage: React.FC = () => {
  const { token } = theme.useToken();

  const tabItems = [
    {
      key: 'general',
      label: 'General',
      children: (
        <Flex vertical align="center" justify="center" style={{ minHeight: 300 }} gap="large">
          <Typography.Title level={3} style={{ color: token.colorTextSecondary }}>
            Under Construction 🚧
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeLG, textAlign: 'center', maxWidth: 500 }}>
            General settings are coming soon.
          </Typography.Text>
        </Flex>
      ),
    },
    {
      key: 'aws',
      label: 'Connect AWS',
      children: <ConnectAWS />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Card bordered={false} style={{ flex: 1, boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG }}>
        <Tabs defaultActiveKey="aws" items={tabItems} size="large" />
      </Card>
    </div>
  );
};

export default SettingsPage;
