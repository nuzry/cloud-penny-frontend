import React, { useState, useEffect } from 'react';
import { Typography, Button, message, Flex, Spin, Card, Select, Divider, theme } from 'antd';
import apiClient from '../../lib/apiClient';

const { Title, Text, Paragraph } = Typography;

const DataRefreshSettings: React.FC = () => {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quota, setQuota] = useState<number>(1);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await apiClient.get('/v1/clients/me');
        if (res.data?.data?.dailyRefreshQuota !== undefined) {
          setQuota(res.data.data.dailyRefreshQuota);
        }
      } catch (err) {
        console.error('Failed to fetch data refresh settings:', err);
        message.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuota();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/v1/clients/me', { dailyRefreshQuota: quota });
      message.success('Data refresh settings saved successfully!');
    } catch (err) {
      console.error('Failed to update quota:', err);
      message.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerSample = async () => {
    try {
      message.loading({ content: 'Injecting sample data...', key: 'sample' });
      await apiClient.post('/v1/dev/trigger-sample-cur');
      message.success({ content: 'Sample data injected! Orchestration triggered.', key: 'sample', duration: 3 });
    } catch (err: any) {
      message.error({ content: err.response?.data?.message || 'Failed to trigger sample data', key: 'sample', duration: 3 });
    }
  };

  if (loading) {
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
              loading={saving}
              size="middle"
            >
              Save Changes
            </Button>
          </div>
        </div>
        
        <Divider style={{ margin: '8px 0' }} />
        
        <div>
          <Title level={5} style={{ marginTop: 0, marginBottom: '8px' }}>Developer Tools</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Inject a dummy CUR file to test the data orchestration pipeline (S3 → SQS → Athena → DynamoDB).
          </Text>
          <Button 
            onClick={handleTriggerSample} 
            size="middle"
          >
            Trigger Sample Data
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DataRefreshSettings;
