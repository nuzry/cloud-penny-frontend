import React, { useEffect, useState } from 'react';
import { Typography, Card, Flex, theme, Spin, Timeline, Tag, Space, Empty, Button, Divider } from 'antd';
import { WarningOutlined, ReloadOutlined, ExperimentOutlined, RiseOutlined } from '@ant-design/icons';
import { alertsService } from '../../api/alertsService';
import type { Alert } from '../../api/alertsService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import './AlertsPage.css';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const AlertsPage: React.FC = () => {
  const { token } = theme.useToken();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertsService.getAlerts();
      setAlerts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const getTimelineItems = () => {
    return alerts.map((alert) => {
      const anomaly = alert.message.anomalies?.[0];
      const impact = anomaly?.impact?.totalImpact ?? 0;
      const expected = anomaly?.impact?.totalExpectedSpend ?? 0;
      const percentage = anomaly?.impact?.totalImpactPercentage ?? 0;
      const service = anomaly?.rootCauses?.[0]?.service ?? 'Unknown Service';

      return {
        color: impact > 100 ? 'red' : 'orange',
        dot: <WarningOutlined style={{ fontSize: '18px' }} />,
        children: (
          <Card 
            className="alert-card"
            bordered={false} 
            style={{ 
              boxShadow: token.boxShadowTertiary, 
              borderRadius: token.borderRadiusLG,
              marginBottom: 24,
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ 
              padding: '16px 24px',
              borderLeft: `4px solid ${impact > 100 ? token.colorError : token.colorWarning}`
            }}>
              <Flex justify="space-between" align="flex-start">
                <Flex vertical gap="small">
                  <Space>
                    <Tag color={impact > 100 ? 'error' : 'warning'}>Cost Anomaly</Tag>
                    <Text type="secondary">{dayjs(alert.createdAt).fromNow()}</Text>
                  </Space>
                  <Title level={4} style={{ margin: 0, marginTop: 8 }}>
                    Spike detected in {service}
                  </Title>
                  <Text type="secondary">
                    AWS Cost Anomaly Detection identified unusual spending behavior in your account (<strong>{alert.awsAccountId}</strong>).
                  </Text>
                </Flex>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Impact</Text>
                  <Title level={3} style={{ color: token.colorError, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RiseOutlined /> {formatCurrency(impact)}
                  </Title>
                  <Tag color="error" bordered={false}>+{percentage.toFixed(1)}%</Tag>
                </div>
              </Flex>
              <Divider style={{ margin: '16px 0' }} />
              <Flex gap="large">
                <Flex vertical>
                  <Text type="secondary" style={{ fontSize: 12 }}>Expected Spend</Text>
                  <Text strong>{formatCurrency(expected)}</Text>
                </Flex>
                <Flex vertical>
                  <Text type="secondary" style={{ fontSize: 12 }}>Actual Spend</Text>
                  <Text strong>{formatCurrency(expected + impact)}</Text>
                </Flex>
              </Flex>
            </div>
          </Card>
        )
      };
    });
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Alerts</Title>
          <Text type="secondary">Monitor anomalous spending and unusual cost spikes.</Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchAlerts}
          loading={loading}
        >
          Refresh
        </Button>
      </Flex>

      {loading && alerts.length === 0 ? (
        <Flex justify="center" align="center" style={{ minHeight: 400 }}>
          <Spin size="large" />
        </Flex>
      ) : alerts.length === 0 ? (
        <Card bordered={false} style={{ boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG }}>
          <Empty
            image={<ExperimentOutlined style={{ fontSize: 64, color: token.colorSuccess }} />}
            description={
              <Flex vertical gap="small" style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: 16 }}>No Anomalies Detected</Text>
                <Text type="secondary">Your AWS costs are trending normally. We'll alert you if anything unusual happens!</Text>
              </Flex>
            }
          />
        </Card>
      ) : (
        <div>
          <Timeline
            mode="left"
            items={getTimelineItems()}
          />
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
