import React, { useState } from 'react';
import { Card, Tabs, Flex, theme } from 'antd';
import { SettingOutlined, AmazonOutlined, UserOutlined } from '@ant-design/icons';
import ConnectAWS from './ConnectAWS';
import AccountSettings from './AccountSettings';
import DataRefreshSettings from './DataRefreshSettings';
import PageHeader from '../../components/ui/PageHeader';

const SettingsPage: React.FC = () => {
  const { token } = theme.useToken();
  const [activeTab, setActiveTab] = useState('data');

  const tabs = [
    {
      key: 'data',
      label: 'Data Settings',
      icon: <SettingOutlined />,
      children: (
        <Flex vertical style={{ padding: `${token.padding}px 0` }}>
          <DataRefreshSettings />
        </Flex>
      ),
    },
    {
      key: 'aws',
      label: 'Connect AWS',
      icon: <AmazonOutlined />,
      children: <ConnectAWS />,
    },
    {
      key: 'account',
      label: 'Account',
      icon: <UserOutlined />,
      children: (
        <Flex vertical style={{ padding: `${token.padding}px 0` }}>
          <AccountSettings />
        </Flex>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
      <PageHeader title="Settings" description="Manage your data refresh, AWS connection, and account." />
      <Card bordered={false} style={{ flex: 1, boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
      </Card>
    </div>
  );
};

export default SettingsPage;
