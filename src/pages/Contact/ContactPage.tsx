import React from 'react';
import { Typography, Card, Flex, theme } from 'antd';
import PageHeader from '../../components/ui/PageHeader';

const ContactPage: React.FC = () => {
  const { token } = theme.useToken();
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
      <PageHeader title="Contact" description="Get in touch or find support resources." />
      <Card bordered={false} style={{ flex: 1, boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG, display: 'flex', flexDirection: 'column' }}>
        <Flex vertical align="center" justify="center" style={{ flex: 1, minHeight: 300 }} gap="large">
          <Typography.Title level={3} style={{ color: token.colorTextSecondary, marginTop: 0 }}>
            Under Construction 🚧
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeLG, textAlign: 'center', maxWidth: 500 }}>
            Contact and Support tools are coming soon.
          </Typography.Text>
        </Flex>
      </Card>
    </div>
  );
};

export default ContactPage;
