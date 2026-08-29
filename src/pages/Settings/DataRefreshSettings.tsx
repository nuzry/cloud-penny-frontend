import React, { useState, useEffect } from 'react';
import { Typography, Button, message, Flex, Spin, Card, Select, theme } from 'antd';
import { useClientMe, useUpdateClientMe } from '@/hooks/useClientQueries';

const { Title, Text } = Typography;

const DataRefreshSettings: React.FC = () => {
  const { token } = theme.useToken();
  const [quota, setQuota] = useState<number>(1);
  
  const { data: profile, isLoading } = useClientMe();
  const updateClientMe = useUpdateClientMe();

  useEffect(() => {
    if (profile?.dailyRefreshQuota !== undefined) {
      setQuota(profile.dailyRefreshQuota);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateClientMe.mutateAsync({ dailyRefreshQuota: quota });
      message.success('Data refresh settings saved successfully!');
    } catch (err) {
      console.error('Failed to update quota:', err);
      message.error('Failed to save settings.');
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 300 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <Card 
      title="Data Refresh Settings" 
      bordered={false} 
      style={{ 
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <Title level={5} style={{ marginTop: 0, marginBottom: '8px' }}>Daily Data Refresh Quota</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Choose how many times per day your cloud cost data should be synchronized with AWS. 
            Higher refresh rates give you more up-to-date numbers but consume more quota.
          </Text>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Select
              value={quota}
              onChange={(val) => setQuota(val)}
              style={{ width: 120 }}
              options={[
                { value: 1, label: '1 per day' },
                { value: 2, label: '2 per day' },
                { value: 3, label: '3 per day' },
              ]}
            />
            <Button 
              type="primary" 
              onClick={handleSave} 
              loading={updateClientMe.isPending}
              size="middle"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DataRefreshSettings;
