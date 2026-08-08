import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Flex, Typography, Dropdown, Avatar } from 'antd';
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
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'My Profile',
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
      case '/settings': return 'Settings';
      case '/profile': return 'My Profile';
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
        <Menu
          theme={mode}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: token.marginSM }}
        />
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
            overflow: 'initial',
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
