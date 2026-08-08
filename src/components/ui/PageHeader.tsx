import React from 'react';
import { Typography, Flex } from 'antd';

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, icon, description, extra }) => {
  return (
    <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
      <Flex vertical>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
          {title}
        </Typography.Title>
        {description && <Typography.Text type="secondary">{description}</Typography.Text>}
      </Flex>
      {extra && <div>{extra}</div>}
    </Flex>
  );
};

export default PageHeader;
