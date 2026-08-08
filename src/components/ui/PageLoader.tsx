import React from 'react';
import { Spin, Flex } from 'antd';

interface PageLoaderProps {
  text?: string;
  height?: string | number;
}

const PageLoader: React.FC<PageLoaderProps> = ({ text, height = '50vh' }) => {
  return (
    <Flex justify="center" align="center" style={{ height }} vertical gap="middle">
      <Spin size="large" />
      {text && <span style={{ color: '#8c8c8c' }}>{text}</span>}
    </Flex>
  );
};

export default PageLoader;
