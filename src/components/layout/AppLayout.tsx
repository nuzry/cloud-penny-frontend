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
  CloudDownloadOutlined,
  PhoneOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { useTheme } from '../../app/providers';
import { ChatBotButton } from '../../features/chat';

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

  // Reuses menuItems (rather than a second hardcoded path→label map) so the
  // sidebar and the header title can never drift out of sync with each other.
  const selectedKey = menuItems.find(item => location.pathname.startsWith(item.key))?.key;
  const pageTitle = menuItems.find(item => item.key === selectedKey)?.label ?? '';

  return (
    // Bounded to exactly the viewport (not just "at least") so Content's own
    // overflow:auto below is what scrolls a tall page, instead of the whole
    // shell growing past 100vh and letting the browser window scroll it —
    // that's what let ContactPage's chat card push its input off-screen,
    // since nothing above it was actually capping available height.
    <Layout style={{ height: '100vh' }}>
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

        <Menu
          mode="inline"
          theme={mode}
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none' }}
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
              {pageTitle}
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
      <ChatBotButton />
    </Layout>
  );
};

export default AppLayout;
