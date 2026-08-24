import React, { useState } from 'react';
import { Layout, Button, theme, Flex, Typography, Dropdown, Avatar } from 'antd';
import {
  BarChartOutlined,
  CloudOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  CloudDownloadOutlined,
  PhoneOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { useTheme } from '../../app/providers';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();
  const { mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <BarChartOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/export',
      icon: <CloudDownloadOutlined />,
      label: 'Export',
    },
    {
      key: '/alerts',
      icon: <AlertOutlined />,
      label: 'Alerts',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: '/contact',
      icon: <PhoneOutlined />,
      label: 'Contact',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: logout,
    },
  ];

  // Map pathname to Page Title
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/export': return 'Export';
      case '/alerts': return 'Alerts';
      case '/settings': return 'Settings';
      case '/profile': return 'Profile';
      case '/contact': return 'Contact';
      default: return '';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme={mode}
        style={{
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          position: 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Flex 
          align="center" 
          justify="center" 
          gap={token.marginXS}
          style={{ 
            height: 64, 
            padding: token.paddingSM,
            borderBottom: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <CloudOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          {!collapsed && (
            <Text strong style={{ fontSize: 16, whiteSpace: 'nowrap' }}>
              Cloud Penny
            </Text>
          )}
        </Flex>

        <Flex vertical gap={4} style={{ padding: collapsed ? '12px 8px' : '12px 16px' }}>
          {menuItems.map(item => {
            const isSelected = location.pathname.startsWith(item.key);
            return (
              <div
                key={item.key}
                onClick={() => navigate(item.key)}
                style={{
                  position: 'relative',
                  padding: collapsed ? '10px 0' : '10px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
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
                title={collapsed ? item.label : undefined}
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
                  {item.icon}
                </div>

                {/* Label */}
                {!collapsed && (
                  <Typography.Text 
                    style={{ 
                      color: isSelected ? token.colorText : token.colorTextSecondary,
                      fontWeight: 500,
                      fontSize: 14
                    }}
                  >
                    {item.label}
                  </Typography.Text>
                )}
              </div>
            );
          })}
        </Flex>
      </Sider>
      
      <Layout>
        <Header 
          style={{ 
            padding: `0 ${token.paddingLG}px`, 
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Flex align="center" gap={token.marginMD}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                marginLeft: -token.paddingLG, // Align with left edge
              }}
            />
            {/* Dynamic Page Title in the Header */}
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              {getPageTitle(location.pathname)}
            </Typography.Title>
          </Flex>
          
          <Flex align="center" gap={token.marginMD}>
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ fontSize: '16px' }}
            />
            
            <Dropdown 
              menu={{ items: userMenuItems }} 
              placement="bottomRight" 
              trigger={['click']}
            >
              <Flex align="center" gap={token.marginXS} style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                <Text style={{ display: 'none' }} className="user-email-display">
                  {user?.email || 'User'}
                </Text>
              </Flex>
            </Dropdown>
          </Flex>
        </Header>
        
        <Content
          style={{
            margin: token.marginLG,
            padding: 0,
            background: 'transparent',
            borderRadius: 0,
            boxShadow: 'none',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* This is where the nested routes (e.g. Dashboard) will render */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
