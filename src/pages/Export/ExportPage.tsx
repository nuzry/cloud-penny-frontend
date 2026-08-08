import React from 'react';
import { Typography, Card, Flex, theme } from 'antd';

const ExportPage: React.FC = () => {
  const { token } = theme.useToken();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Card bordered={false} style={{ flex: 1, boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG, display: 'flex', flexDirection: 'column' }}>
        <Flex vertical align="center" justify="center" style={{ flex: 1, minHeight: 300 }} gap="large">
          <Typography.Title level={3} style={{ color: token.colorTextSecondary, marginTop: 0 }}>
            Under Construction 🚧
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeLG, textAlign: 'center', maxWidth: 500 }}>
            Export features are coming soon. Check back for CSV and PDF reports!
          </Typography.Text>
        </Flex>
      </Card>
    </div>
  );
};

export default ExportPage;
