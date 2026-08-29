import React from 'react';
import {
  Typography, Card, Table, Button, Tooltip, Progress, Empty,
  Flex, theme, Badge, Statistic,
} from 'antd';
import {
  DownloadOutlined, FileExcelOutlined, ClockCircleOutlined,
  CheckCircleOutlined, WarningOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useExportFiles } from '@/hooks/useDashboardQueries';
import { useClientMe } from '@/hooks/useClientQueries';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import { formatFileSize as fmtSize, formatDateTime as fmtDate } from '../../utils/format';

const { Text } = Typography;

const ExportPage: React.FC = () => {
  const { token } = theme.useToken();

  const { data: profile } = useClientMe();
  const isConnected = profile?.connectionStatus === 'VERIFIED';

  const { data: files = [], isLoading, refetch, isFetching } = useExportFiles(isConnected);

  const now = Date.now();

  // For each file compute days remaining + pct of 7-day window consumed
  const enriched = files.map((f) => {
    const created = new Date(f.createdAt).getTime();
    const expires = new Date(f.expiresAt).getTime();
    const totalMs = expires - created;
    const elapsedMs = now - created;
    const remainingMs = expires - now;
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    const pctConsumed = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
    const isExpiringSoon = remainingDays <= 1;
    return { ...f, remainingDays, pctConsumed, isExpiringSoon };
  });

  const columns = [
    {
      title: 'File',
      key: 'file',
      render: (_: any, row: any) => (
        <Flex align="center" gap={10}>
          <FileExcelOutlined style={{ fontSize: 22, color: '#52c41a' }} />
          <div>
            <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
              {row.queryId.substring(0, 8)}…{row.queryId.slice(-4)}.csv
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {fmtSize(row.sizeBytes)} · Query ID: <code style={{ fontSize: 10 }}>{row.queryId}</code>
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => (
        <Flex vertical gap={2}>
          <Text style={{ fontSize: 13 }}>{fmtDate(v)}</Text>
        </Flex>
      ),
    },
    {
      title: 'Expires In',
      key: 'expires',
      width: 210,
      render: (_: any, row: any) => {
        const color = row.remainingDays <= 1 ? '#ff4d4f' : row.remainingDays <= 3 ? '#faad14' : '#52c41a';
        const status = row.remainingDays <= 1 ? 'exception' : row.remainingDays <= 3 ? 'active' : 'normal';
        return (
          <Flex vertical gap={4}>
            <Flex align="center" gap={6}>
              {row.isExpiringSoon
                ? <WarningOutlined style={{ color: '#ff4d4f' }} />
                : <ClockCircleOutlined style={{ color }} />}
              <Text style={{ color, fontSize: 13, fontWeight: 600 }}>
                {row.remainingDays === 0 ? 'Expiring today' : `${row.remainingDays}d remaining`}
              </Text>
            </Flex>
            <Tooltip title={`Expires: ${fmtDate(row.expiresAt)}`}>
              <Progress
                percent={row.pctConsumed}
                size="small"
                showInfo={false}
                status={status as any}
                strokeColor={color}
              />
            </Tooltip>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Expires {fmtDate(row.expiresAt)}
            </Text>
          </Flex>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_: any, row: any) => (
        row.remainingDays === 0
          ? <Badge status="error" text="Expiring" />
          : <Badge status="success" text="Available" />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      render: (_: any, row: any) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          href={row.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          disabled={row.remainingDays === 0}
        >
          Download
        </Button>
      ),
    },
  ];

  const expiringSoon = enriched.filter((f) => f.remainingDays <= 2).length;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Data Exports"
        description="Athena query results saved as CSV · Auto-deleted after 7 days"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        }
      />

      {/* Summary KPIs */}
      {files.length > 0 && (
        <Flex gap={16} wrap="wrap">
          <Card size="small" style={{ minWidth: 160 }}>
            <Statistic
              title="Total Files"
              value={files.length}
              prefix={<FileExcelOutlined />}
            />
          </Card>
          <Card size="small" style={{ minWidth: 160 }}>
            <Statistic
              title="Expiring Soon"
              value={expiringSoon}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: expiringSoon > 0 ? token.colorWarning : token.colorSuccess }}
            />
          </Card>
          <Card size="small" style={{ minWidth: 160 }}>
            <Statistic
              title="Retention Policy"
              value="7 days"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Flex>
      )}

      {!isConnected && (
        <Card
          size="small"
          style={{ borderColor: token.colorWarning, backgroundColor: token.colorWarningBg }}
        >
          <Text type="warning">
            Connect your AWS account to view export files.
          </Text>
        </Card>
      )}

      {/* File Table */}
      <Card
        bordered={false}
        style={{ borderRadius: token.borderRadiusLG, boxShadow: token.boxShadowTertiary }}
        styles={{ body: { padding: 0 } }}
      >
        {isLoading ? (
          <PageLoader height={200} />
        ) : enriched.length === 0 ? (
          <Empty
            style={{ padding: 60 }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                No export files found.{' '}
                <Text type="secondary">
                  Files appear here after your AWS data is processed through Athena.
                </Text>
              </span>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={enriched}
            rowKey="key"
            pagination={false}
            scroll={{ x: 800 }}
            rowClassName={(row) =>
              row.isExpiringSoon ? 'export-row-warning' : ''
            }
          />
        )}
      </Card>

      <Text type="secondary" style={{ fontSize: 12 }}>
        <ClockCircleOutlined style={{ marginRight: 4 }} />
        Files are automatically removed from S3 after 7 days via S3 Lifecycle Policy.
        Download links are valid for 1 hour.
      </Text>
    </div>
  );
};

export default ExportPage;
