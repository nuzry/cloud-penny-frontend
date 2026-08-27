import React, { useState, useMemo } from 'react';
import {
  Typography, Card, Row, Col, Statistic, Select, Segmented, Table, Tag, Empty, Flex, theme, Button, DatePicker,
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, DollarOutlined,
  CloudServerOutlined, FilterOutlined, BarChartOutlined, LineChartOutlined,
} from '@ant-design/icons';
import { Column, Bar, Pie, Line } from '@ant-design/plots';
import { useTheme } from '../../app/providers';
import { useNavigate } from 'react-router-dom';
import { useDashboardData, useClientMe } from '../../hooks/useQueries';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import { formatCurrency, formatCompactCurrency } from '../../utils/format';

const { Title, Text } = Typography;

// Dashboard costs can be fractions of a cent (e.g. per-request charges), so
// this needs more precision than the default 2dp currency formatting.
const fmt = (val: number) => formatCurrency(val, 6);
const fmtCompact = formatCompactCurrency;

export const Dashboard: React.FC = () => {
  const { data: profile, isLoading: isProfileLoading } = useClientMe();
  const isConnected = profile?.connectionStatus === 'VERIFIED';
  
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData(isConnected);

  const loading = isProfileLoading || isDashboardLoading;
  const data: any[] = dashboardData?.dailyItems || [];

  const { token } = theme.useToken();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState<number | 'custom'>(30);
  const [customDateRange, setCustomDateRange] = useState<[string, string] | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedLineItemTypes, setSelectedLineItemTypes] = useState<string[]>(['Usage']);
  const [dailyChartType, setDailyChartType] = useState<'column' | 'line'>('column');

  // ── Derive filter options from data ─────────────────────────────────────
  const allServices = useMemo(() => [...new Set(data.map(r => r.service).filter(s => s !== 'Aggregate'))].sort(), [data]);
  const allRegions = useMemo(() => [...new Set(data.map(r => r.region).filter(Boolean))].sort(), [data]);
  const allLineItemTypes = useMemo(() => [...new Set(data.map(r => r.lineItemType))].sort(), [data]);

  // ── Filtered data ───────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return data.filter(r => {
      if (dateRange === 'custom') {
        if (customDateRange) {
          if (r.date < customDateRange[0] || r.date > customDateRange[1]) return false;
        }
      } else {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (dateRange as number));
        const cutoffStr = cutoff.toISOString().split('T')[0];
        if (r.date < cutoffStr) return false;
      }
      
      if (selectedServices.length > 0 && !selectedServices.includes(r.service)) return false;
      if (selectedRegions.length > 0 && !selectedRegions.includes(r.region)) return false;
      if (selectedLineItemTypes.length > 0 && !selectedLineItemTypes.includes(r.lineItemType)) return false;
      if (r.service === 'Aggregate') return false;
      return true;
    });
  }, [data, dateRange, customDateRange, selectedServices, selectedRegions, selectedLineItemTypes]);

  // ── KPIs ────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const usageRows = filteredData.filter(r => r.lineItemType === 'Usage');
    const totalSpend = usageRows.reduce((s, r) => s + r.cost, 0);
    const creditRows = data.filter(r => r.lineItemType === 'Credit');
    const totalCredits = creditRows.reduce((s, r) => s + r.cost, 0); // negative
    const spRows = data.filter(r => r.lineItemType === 'SavingsPlanCoveredUsage');
    const spSavings = spRows.reduce((s, r) => s + r.cost, 0); // Need SP specific fields later if relevant

    const dates = [...new Set(usageRows.map(r => r.date))];
    const daysPassed = dates.length || 1;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const forecast = (totalSpend / daysPassed) * daysInMonth;

    // Top service
    const byService: Record<string, number> = {};
    usageRows.forEach(r => { byService[r.service] = (byService[r.service] || 0) + r.cost; });
    const topService = Object.entries(byService).sort((a, b) => b[1] - a[1])[0];

    return { totalSpend, forecast, totalCredits, spSavings, topService, daysPassed };
  }, [filteredData]);

  // ── Daily Spend (stacked column) ────────────────────────────────────────
  const dailySpendData = useMemo(() => {
    const usageRows = filteredData.filter(r => r.lineItemType === 'Usage');
    const grouped: Record<string, Record<string, number>> = {};
    usageRows.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = {};
      grouped[r.date][r.service] = (grouped[r.date][r.service] || 0) + r.cost;
    });

    const result: { date: string; service: string; cost: number }[] = [];
    Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0])).forEach(([date, services]) => {
      Object.entries(services).forEach(([service, cost]) => {
        result.push({ date: date.substring(5), service, cost: Number(cost.toFixed(4)) });
      });
    });
    return result;
  }, [filteredData]);

  // ── Cost by Service (horizontal bar) ────────────────────────────────────
  const serviceData = useMemo(() => {
    const usageRows = filteredData.filter(r => r.lineItemType === 'Usage');
    const grouped: Record<string, number> = {};
    usageRows.forEach(r => { grouped[r.service] = (grouped[r.service] || 0) + r.cost; });
    return Object.entries(grouped)
      .filter(([, c]) => c !== 0)
      .sort((a, b) => a[1] - b[1]) // ascending for horizontal bar
      .map(([service, cost]) => ({ service, cost: Number(cost.toFixed(6)) }));
  }, [filteredData]);

  // ── Cost by Region ──────────────────────────────────────────────────────
  const regionData = useMemo(() => {
    const usageRows = filteredData.filter(r => r.lineItemType === 'Usage' && r.region);
    const grouped: Record<string, number> = {};
    usageRows.forEach(r => { grouped[r.region] = (grouped[r.region] || 0) + r.cost; });
    return Object.entries(grouped)
      .filter(([, c]) => c !== 0)
      .sort((a, b) => a[1] - b[1])
      .map(([region, cost]) => ({ region, cost: Number(cost.toFixed(6)) }));
  }, [filteredData]);


  // ── Cost Type Breakdown (donut) ─────────────────────────────────────────
  const costTypeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach(r => {
      grouped[r.lineItemType] = (grouped[r.lineItemType] || 0) + Math.abs(r.cost);
    });
    return Object.entries(grouped)
      .filter(([, v]) => v !== 0)
      .map(([type, value]) => ({ type, value: Number(value.toFixed(6)) }));
  }, [filteredData]);

  // ── Top Operations Table ────────────────────────────────────────────────
  const operationsTableData = useMemo(() => {
    const usageRows = filteredData.filter(r => r.lineItemType === 'Usage');
    const grouped: Record<string, { service: string; operation: string; region: string; usageAmount: number; cost: number }> = {};
    usageRows.forEach(r => {
      const key = `${r.service}|${r.operation}|${r.region}`;
      if (!grouped[key]) grouped[key] = { service: r.service, operation: r.operation, region: r.region || '—', usageAmount: 0, cost: 0 };
      grouped[key].usageAmount += r.usageAmount;
      grouped[key].cost += r.cost;
    });
    return Object.values(grouped)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 15)
      .map((row, i) => ({ ...row, key: i, cost: Number(row.cost.toFixed(4)) }));
  }, [filteredData]);

  // ── Has data checks for graceful degradation ───────────────────────────
  const hasRegionData = regionData.length > 0;

  // ── Chart click interaction ─────────────────────────────────────────────


  if (loading) return <PageLoader height="60vh" />;

  // ── Dark-mode aware chart theme ─────────────────────────────────────────
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)';
  const textColorSecondary = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const chartTheme = {
    theme: isDark ? 'classicDark' : 'classic',
  };

  // ── Chart configs ───────────────────────────────────────────────────────
  const stackedColumnConfig = {
    ...chartTheme,
    data: dailySpendData,
    xField: 'date',
    yField: 'cost',
    colorField: 'service',
    stack: true,
    axis: {
      y: { labelFormatter: (v: number) => `$${v}`, label: { style: { fill: textColor } }, grid: { line: { style: { stroke: gridColor } } } },
      x: { label: { style: { fill: textColor } } },
    },
    tooltip: { items: [{ channel: 'y', valueFormatter: (v: number) => fmt(v) }] },
    interaction: { elementHighlight: true },
  };

  const lineConfig = {
    ...chartTheme,
    data: dailySpendData,
    xField: 'date',
    yField: 'cost',
    colorField: 'service',
    axis: {
      y: { labelFormatter: (v: number) => `$${v}`, label: { style: { fill: textColor } }, grid: { line: { style: { stroke: gridColor } } } },
      x: { label: { style: { fill: textColor } } },
    },
    tooltip: { items: [{ channel: 'y', valueFormatter: (v: number) => fmt(v) }] },
    point: { shapeField: 'circle', sizeField: 3 },
    interaction: { elementHighlight: true },
  };

  const serviceBarConfig = {
    ...chartTheme,
    data: serviceData,
    xField: 'service',
    yField: 'cost',
    colorField: 'service',
    axis: {
      x: { title: false, label: { style: { fill: textColor, fontSize: 12 } } },
      y: { labelFormatter: (v: number) => fmtCompact(v), label: { style: { fill: textColorSecondary } }, grid: { line: { style: { stroke: gridColor } } } },
    },
    tooltip: { items: [{ channel: 'y', valueFormatter: (v: number) => fmt(v) }] },
    label: { 
      text: (d: any) => fmt(d.cost), 
      position: 'right',
      dx: 5,
      style: { fill: textColor, fontSize: 11, textAlign: 'left' } 
    },
    marginRight: 60,
  };

  const regionBarConfig = {
    ...chartTheme,
    data: regionData,
    xField: 'region',
    yField: 'cost',
    colorField: 'region',
    axis: {
      x: { title: false, label: { style: { fill: textColor } } },
      y: { labelFormatter: (v: number) => fmtCompact(v), label: { style: { fill: textColorSecondary } }, grid: { line: { style: { stroke: gridColor } } } },
    },
    tooltip: { items: [{ channel: 'y', valueFormatter: (v: number) => fmt(v) }] },
    label: { 
      text: (d: any) => fmt(d.cost), 
      position: 'right',
      dx: 5,
      style: { fill: textColor, fontSize: 11, textAlign: 'left' } 
    },
    marginRight: 60,
  };


  const costTypeDonutConfig = {
    ...chartTheme,
    data: costTypeData,
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.6,
    tooltip: { items: [{ channel: 'y', valueFormatter: (v: number) => fmt(v) }] },
    legend: { color: { position: 'bottom' as const, itemLabelFill: textColor } },
    label: { text: 'type', position: 'outside' as const, style: { fill: textColor } },
  };

  const tableColumns = [
    { title: 'Service', dataIndex: 'service', key: 'service', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Operation', dataIndex: 'operation', key: 'operation' },
    { title: 'Region', dataIndex: 'region', key: 'region' },
    { title: 'Usage Qty', dataIndex: 'usageAmount', key: 'usageAmount', align: 'right' as const, render: (v: number) => v.toLocaleString(), sorter: (a: any, b: any) => a.usageAmount - b.usageAmount },
    { title: 'Unblended Cost', dataIndex: 'cost', key: 'cost', align: 'right' as const, render: (v: number) => <Text strong>{fmt(v)}</Text>, sorter: (a: any, b: any) => a.cost - b.cost, defaultSortOrder: 'descend' as const },
  ];

  if (!isConnected && !loading) {
    return (
      <Card style={{ textAlign: 'center', marginTop: 40, padding: 60, borderRadius: 12 }}>
        <CloudServerOutlined style={{ fontSize: 64, color: token.colorTextSecondary, marginBottom: 24 }} />
        <Title level={3}>AWS Account Not Connected</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Please connect your AWS account to view your cost and usage analytics.
        </Text>
        <br/><br/>
        <Button type="primary" size="large" onClick={() => navigate('/settings')}>
          Connect AWS Account
        </Button>
      </Card>
    );
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Cost & Usage Dashboard"
        description={`AWS Cloud Cost Analytics • ${kpis.daysPassed}-day view`}
        extra={<Tag color="green">Live Data Connected</Tag>}
      />

      {/* Filters */}
      <Card size="small">
        <Flex wrap="wrap" gap={16} align="center">
          <Flex align="center" gap={8}>
            <FilterOutlined />
            <Segmented
              options={[
                { label: 'Today', value: 1 },
                { label: 'Last 7d', value: 7 },
                { label: 'Last 14d', value: 14 },
                { label: 'Last 30d', value: 30 },
                { label: 'Custom', value: 'custom' },
              ]}
              value={dateRange}
              onChange={(v) => setDateRange(v as number | 'custom')}
            />
            {dateRange === 'custom' && (
              <DatePicker.RangePicker 
                onChange={(_, dateStrings) => {
                  if (dateStrings && dateStrings[0] && dateStrings[1]) {
                    setCustomDateRange([dateStrings[0], dateStrings[1]]);
                  } else {
                    setCustomDateRange(null);
                  }
                }}
              />
            )}
          </Flex>
          <Select
            mode="multiple"
            allowClear
            placeholder="All Services"
            style={{ minWidth: 200 }}
            value={selectedServices}
            onChange={setSelectedServices}
            options={allServices.map(s => ({ label: s, value: s }))}
            maxTagCount={2}
          />
          {allRegions.length > 0 && (
            <Select
              mode="multiple"
              allowClear
              placeholder="All Regions"
              style={{ minWidth: 180 }}
              value={selectedRegions}
              onChange={setSelectedRegions}
              options={allRegions.map(r => ({ label: r, value: r }))}
              maxTagCount={2}
            />
          )}

          <Select
            mode="multiple"
            allowClear
            placeholder="Line Item Type"
            style={{ minWidth: 180 }}
            value={selectedLineItemTypes}
            onChange={setSelectedLineItemTypes}
            options={allLineItemTypes.map(t => ({ label: t, value: t }))}
            maxTagCount={2}
          />
        </Flex>
      </Card>

      {/* KPI Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Spend"
              value={kpis.totalSpend}
              precision={2}
              prefix={<DollarOutlined />}
              formatter={(v) => fmt(v as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Forecasted Month"
              value={kpis.forecast}
              precision={2}
              prefix={<ArrowUpOutlined />}
              formatter={(v) => fmt(v as number)}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Credits & Savings"
              value={Math.abs(kpis.totalCredits) + kpis.spSavings}
              precision={2}
              prefix={<ArrowDownOutlined />}
              formatter={(v) => fmt(v as number)}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Top Service"
              value={kpis.topService ? kpis.topService[0] : '—'}
              prefix={<CloudServerOutlined />}
              suffix={kpis.topService ? <Text type="secondary" style={{ fontSize: 14 }}>{fmt(kpis.topService[1])}</Text> : undefined}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 2: Daily Trend + Service Breakdown */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="Daily Spend by Service"
            extra={
              <Segmented
                size="small"
                value={dailyChartType}
                onChange={(v) => setDailyChartType(v as 'column' | 'line')}
                options={[
                  { value: 'column', icon: <BarChartOutlined /> },
                  { value: 'line',   icon: <LineChartOutlined /> },
                ]}
              />
            }
          >
            {dailySpendData.length > 0 ? (
              <div style={{ height: 340 }}>
                {dailyChartType === 'column'
                  ? <Column {...stackedColumnConfig} />
                  : <Line   {...lineConfig} />}
              </div>
            ) : <Empty description="No usage data in selected range" />}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Cost by Service">
            {serviceData.length > 0 ? (
              <div style={{ height: 380 }}>
                <Bar {...serviceBarConfig} />
              </div>
            ) : <Empty description="No service data available" />}
          </Card>
        </Col>
      </Row>

      {/* Row 3: Region */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Cost by Region">
            {hasRegionData ? (
              <div style={{ height: 280 }}>
                <Bar {...regionBarConfig} />
              </div>
            ) : <Empty description="Region data not available for this client" />}
          </Card>
        </Col>
      </Row>

      {/* Row 4: Cost Type + Operations Table */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Spend by Category">
            {costTypeData.length > 0 ? (
              <div style={{ height: 320 }}>
                <Pie {...costTypeDonutConfig} />
              </div>
            ) : <Empty description="No data" />}
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Top Operations">
            <Table
              dataSource={operationsTableData}
              columns={tableColumns}
              pagination={false}
              size="small"
              scroll={{ y: 280 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
