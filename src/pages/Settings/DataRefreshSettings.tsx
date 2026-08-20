import React, { useState, useEffect } from 'react';
import { Typography, InputNumber, Button, message, Flex, Spin, Card, Select } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import apiClient from '../../lib/apiClient';

const { Title, Text, Paragraph } = Typography;

const DataRefreshSettings: React.FC = () => {
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

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 300 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <Card bordered={false}>
      <Title level={4}>Data Refresh Settings</Title>
      <Paragraph type="secondary" style={{ maxWidth: 600, marginBottom: 24 }}>
        Configure how often your AWS Cost & Usage data should be processed for anomaly detection. 
        AWS typically delivers data up to 3 times a day. If you set a quota lower than the delivery frequency, 
        subsequent deliveries on the same day will be ignored until the next day.
      </Paragraph>

      <Flex vertical gap="middle" style={{ maxWidth: 400 }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Daily Refresh Quota</Text>
          <Select
            value={quota}
            onChange={(val) => setQuota(val)}
            style={{ width: '100%' }}
            size="large"
          >
            <Select.Option value={1}>1 Refresh per day</Select.Option>
            <Select.Option value={2}>2 Refreshes per day</Select.Option>
            <Select.Option value={3}>3 Refreshes per day</Select.Option>
          </Select>
        </div>
        
        <Button 
          type="primary" 
          onClick={handleSave} 
          loading={saving}
          style={{ width: 'fit-content', marginTop: 16 }}
        >
          Save Changes
        </Button>
      </Flex>
    </Card>
  );
};

export default DataRefreshSettings;
