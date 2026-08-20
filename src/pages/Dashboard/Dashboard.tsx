import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Card, Row, Col, Spin, theme } from 'antd';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import apiClient from '../../lib/apiClient';

const { Title, Text } = Typography;

interface DashboardData {
  dailySpend: Record<string, { N: string }>;
  services: Record<string, { N: string }>;
  totalCost: number;
  currency: string;
  updatedAt: string;
  message?: string;
}

const COLORS = ['#4f46e5', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const { token } = theme.useToken();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/v1/dashboard');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const chartData = useMemo(() => {
    if (!data?.dailySpend) return [];
    
    // Sort dates
    const dates = Object.keys(data.dailySpend).sort();
    return dates.map(date => {
      // Cost is negative in CUR typically, we want to show positive spend
      const rawCost = parseFloat(data.dailySpend[date].N);
      const cost = Math.abs(rawCost);
      return {
        date: date.substring(5), // e.g. "08-01"
        fullDate: date,
        cost: Number(cost.toFixed(2))
      };
    });
  }, [data]);

  const serviceData = useMemo(() => {
    if (!data?.services) return [];
    
    const services = Object.keys(data.services);
    return services.map(service => {
      const rawCost = parseFloat(data.services[service].N);
      return {
        name: service.replace('Amazon', '').replace('AWS', ''), // Clean up names
        value: Number(Math.abs(rawCost).toFixed(2))
      };
    }).filter(s => s.value > 0) // Only show services with > $0 spend
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const topService = serviceData.length > 0 ? serviceData[0].name : 'N/A';
  const totalCost = data ? Math.abs(data.totalCost).toFixed(2) : '0.00';
  
  // Forecast: extrapolate based on days passed
  const forecast = useMemo(() => {
    if (!chartData.length || !data) return '0.00';
    const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysPassed = chartData.length;
    if (daysPassed === 0) return '0.00';
    const averageDaily = Math.abs(data.totalCost) / daysPassed;
    return (averageDaily * totalDaysInMonth).toFixed(2);
  }, [chartData, data]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (data?.message) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Title level={3} style={{ color: token.colorTextSecondary }}>{data.message}</Title>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Title level={2} style={{ marginTop: 0, marginBottom: 0 }}>AWS Cost Overview</Title>

      {/* Summary Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: token.borderRadiusLG, 
              boxShadow: token.boxShadowTertiary,
              background: `linear-gradient(135deg, ${token.colorBgContainer}, ${token.colorPrimaryBg})`
            }}
          >
            <Text type="secondary" style={{ fontSize: 16 }}>Month-to-Date Spend</Text>
            <Title level={1} style={{ marginTop: 8, marginBottom: 0, color: token.colorPrimary }}>
              ${totalCost}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: token.borderRadiusLG, 
              boxShadow: token.boxShadowTertiary,
              background: token.colorBgContainer
            }}
          >
            <Text type="secondary" style={{ fontSize: 16 }}>Forecasted Month Spend</Text>
            <Title level={1} style={{ marginTop: 8, marginBottom: 0 }}>
              ${forecast}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: token.borderRadiusLG, 
              boxShadow: token.boxShadowTertiary,
              background: token.colorBgContainer
            }}
          >
            <Text type="secondary" style={{ fontSize: 16 }}>Top Spending Service</Text>
            <Title level={1} style={{ marginTop: 8, marginBottom: 0, color: '#ec4899' }}>
              {topService}
            </Title>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Line Chart */}
        <Col xs={24} lg={16}>
          <Card 
            title="Daily Spend Trend" 
            bordered={false}
            style={{ 
              borderRadius: token.borderRadiusLG,
              boxShadow: token.boxShadowTertiary,
              height: '100%'
            }}
            bodyStyle={{ padding: '24px 0 0 0' }}
          >
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={token.colorPrimary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={token.colorPrimary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke={token.colorTextSecondary} />
                  <YAxis stroke={token.colorTextSecondary} tickFormatter={(val) => `$${val}`} />
                  <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} vertical={false} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: token.colorBgElevated, 
                      borderColor: token.colorBorder,
                      borderRadius: token.borderRadiusLG,
                      color: token.colorText
                    }}
                    itemStyle={{ color: token.colorPrimary }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    stroke={token.colorPrimary} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCost)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Pie Chart */}
        <Col xs={24} lg={8}>
          <Card 
            title="Cost by Service" 
            bordered={false}
            style={{ 
              borderRadius: token.borderRadiusLG,
              boxShadow: token.boxShadowTertiary,
              height: '100%'
            }}
          >
            {serviceData.length > 0 ? (
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="45%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {serviceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                      contentStyle={{ 
                        backgroundColor: token.colorBgElevated, 
                        borderColor: token.colorBorder,
                        borderRadius: token.borderRadiusLG,
                        color: token.colorText
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      formatter={(value) => <span style={{ color: token.colorText }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                <Text type="secondary">No service cost data available.</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
