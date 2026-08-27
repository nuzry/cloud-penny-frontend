import React from 'react';
import { Card, Flex, theme, Timeline, Tag, Space, Empty, Button, Divider, Typography } from 'antd';
import { WarningOutlined, ReloadOutlined, ExperimentOutlined, RiseOutlined } from '@ant-design/icons';
import { useAlerts } from '../../hooks/useQueries';
import type { Alert } from '../../api/alertsService';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import { formatCurrency, formatRelativeTime } from '../../utils/format';

const { Title, Text } = Typography;

const AlertsPage: React.FC = () => {
  const { token } = theme.useToken();
  const { data: alerts = [], isLoading, isFetching, refetch } = useAlerts();

  const getTimelineItems = () => {
    return alerts.map((alert: Alert) => {
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
                    <Text type="secondary">{formatRelativeTime(alert.createdAt)}</Text>
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
      <PageHeader
        title="Alerts"
        description="Monitor anomalous spending and unusual cost spikes."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <PageLoader height={400} />
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
