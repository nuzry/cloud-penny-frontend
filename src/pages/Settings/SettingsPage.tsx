import React from 'react';
import { Typography, Card, Flex, theme } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const SettingsPage: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <Flex vertical gap={token.marginLG}>
      <Flex vertical>
        <Typography.Title level={2} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          Settings
        </Typography.Title>
        <Typography.Text type="secondary">Manage your Cloud Penny account preferences</Typography.Text>
      </Flex>

      <Card bordered={false} style={{ minHeight: '60vh', boxShadow: token.boxShadowTertiary }}>
        <Flex vertical align="center" justify="center" style={{ height: '100%', minHeight: 400 }} gap="large">
          <Typography.Title level={3} style={{ color: token.colorTextSecondary }}>
            Under Construction 🚧
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeLG, textAlign: 'center', maxWidth: 500 }}>
            Our engineers are currently building the settings panel. Soon you will be able to manage your cloud provider integrations, billing alerts, and team access from here.
          </Typography.Text>
        </Flex>
      </Card>
    </Flex>
  );
};

export default SettingsPage;
