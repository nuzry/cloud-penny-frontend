import React, { useState } from 'react';
import { Typography, Card, Flex, theme } from 'antd';
import { SettingOutlined, AmazonOutlined, UserOutlined } from '@ant-design/icons';
import ConnectAWS from './ConnectAWS';
import AccountSettings from './AccountSettings';
import DataRefreshSettings from './DataRefreshSettings';

const SettingsPage: React.FC = () => {
  const { token } = theme.useToken();
  const [activeTab, setActiveTab] = useState('data');

  const tabs = [
    {
      id: 'data',
      label: 'Data Settings',
      icon: <SettingOutlined />
    },
    {
      id: 'aws',
      label: 'Connect AWS',
      icon: <AmazonOutlined />
    },
    {
      id: 'account',
      label: 'Account',
      icon: <UserOutlined />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Card bordered={false} style={{ flex: 1, boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG, display: 'flex', flexDirection: 'column' }}>
        <Flex vertical gap="large" style={{ width: '100%', flex: 1 }}>
          {/* Navigation Bar */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {tabs.map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    position: 'relative',
                    padding: '8px 16px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: isSelected ? token.colorFillSecondary : 'transparent',
                    transition: 'background-color 0.2s',
                    userSelect: 'none',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = token.colorFillTertiary;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Active Indicator Bar */}
                  {isSelected && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        width: 4, 
                        height: '60%', 
                        backgroundColor: token.colorPrimary, 
                        borderRadius: 4 
                      }} 
                    />
                  )}
                  
                  {/* Icon */}
                  <div style={{ 
                    color: isSelected ? token.colorText : token.colorTextSecondary,
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {tab.icon}
                  </div>

                  {/* Label */}
                  <Typography.Text 
                    style={{ 
                      color: isSelected ? token.colorText : token.colorTextSecondary,
                      fontWeight: 500, // Kept constant to prevent shifting
                      fontSize: 14
                    }}
                  >
                    {tab.label}
                  </Typography.Text>
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            {activeTab === 'data' && (
              <Flex vertical style={{ padding: `${token.padding}px 0` }}>
                <DataRefreshSettings />
              </Flex>
            )}
            {activeTab === 'aws' && <ConnectAWS />}
            {activeTab === 'account' && (
              <Flex vertical style={{ padding: `${token.padding}px 0` }}>
                <AccountSettings />
              </Flex>
            )}
          </div>
        </Flex>
      </Card>
    </div>
  );
};

export default SettingsPage;
