import React, { useState, useEffect } from 'react';
import { Steps, Button, Typography, Card, theme, Space, Alert, message, Input } from 'antd';
import { CloudServerOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAwsConnection, useSaveAwsConnection, useVerifyAwsConnection } from '@/hooks/useAwsConnectionQueries';
import PageLoader from '../../components/ui/PageLoader';

const { Title, Text } = Typography;

const ConnectAWS: React.FC = () => {
  const { token } = theme.useToken();
  const [current, setCurrent] = useState(0);
  const [awsAccountId, setAwsAccountId] = useState('');
  const [forceReconfigure, setForceReconfigure] = useState(false);
  
  const { data: connData, isLoading: initialLoading } = useAwsConnection();
  const saveAwsConnection = useSaveAwsConnection();
  const verifyAwsConnection = useVerifyAwsConnection();

  const isAlreadyConnected = connData?.connectionStatus === 'VERIFIED' && !forceReconfigure;
  const connectionStatus = connData?.connectionStatus || 'UNCONNECTED';
  const cfUrl = connData?.cfUrl || '';

  // Synchronize state from fetched data once
  useEffect(() => {
    if (connData) {
      if (connData.awsAccountId && !awsAccountId) {
        setAwsAccountId(connData.awsAccountId);
      }
      if (connData.connectionStatus === 'PENDING' && current === 0) {
        setCurrent(1);
      }
    }
  }, [connData, awsAccountId, current]);

  const handleSaveAccount = async () => {
    if (!awsAccountId || awsAccountId.length !== 12 || !/^\d+$/.test(awsAccountId)) {
      message.error("Please enter a valid 12-digit AWS Account ID.");
      return;
    }
    
    try {
      await saveAwsConnection.mutateAsync(awsAccountId);
      message.success('AWS Account ID saved. Proceed to the next step.');
      next();
    } catch (error) {
      console.error('Failed to save account:', error);
      message.error((error as any).response?.data?.error || 'Failed to save account ID.');
    }
  };

  const verifyConnection = async () => {
    try {
      const verifyResponse = await verifyAwsConnection.mutateAsync();
      
      if (verifyResponse?.data?.connectionStatus === 'VERIFIED') {
        message.success('AWS Account successfully connected and data received!');
      } else {
        message.info(verifyResponse?.error || 'No data received yet. This can take up to 24 hours. Check back later.');
      }
    } catch (error) {
      console.error('Failed to verify connection:', error);
      message.error((error as any).response?.data?.error || 'Failed to verify connection.');
    }
  };

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);

  const steps = [
    {
      title: 'Register AWS Account',
      icon: <LockOutlined />,
      content: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>
            To receive your Cost and Usage Reports (CUR), please provide your 12-digit AWS Account ID.
            This ensures that only your authorized account can deliver data to our secure data lake.
          </Text>
          
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>AWS Account ID</Text>
            <Input 
              placeholder="e.g. 123456789012" 
              size="large"
              value={awsAccountId}
              onChange={(e) => setAwsAccountId(e.target.value.replace(/\D/g, ''))}
              maxLength={12}
              disabled={connectionStatus === 'PENDING' && current > 0}
            />
          </div>
          
          <Alert 
            message="Security Note" 
            description="We will never ask for your AWS Access Keys or Secret Keys."
            type="info" 
            showIcon 
          />
        </Space>
      ),
    },
    {
      title: 'Configure CUR in AWS',
      icon: <CloudServerOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Text>
            Deploy the Cost and Usage Report (CUR) directly into your AWS Account using our 1-click CloudFormation setup. 
            This will automatically configure AWS to deliver your billing data to our secure data lake.
          </Text>

          <Button 
            type="primary" 
            size="large"
            icon={<CloudServerOutlined />}
            onClick={() => {
              if (cfUrl) {
                window.open(cfUrl, '_blank');
              } else {
                message.error("CloudFormation URL not found. Please refresh the page.");
              }
            }}
          >
            Deploy via AWS Quick Create
          </Button>
          
          <Alert message="Ensure you are logged into your AWS account before clicking." type="info" showIcon />
        </Space>
      ),
    },
    {
      title: 'Verify Delivery',
      icon: <CheckCircleOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Text>
            Once you have configured the report in AWS, they will begin delivering data to our secure data lake.
          </Text>
          
          <Alert 
            message="AWS Processing Time" 
            description="AWS can take up to 24 hours to deliver the first Cost and Usage Report. You can safely close this page and check back tomorrow."
            type="info" 
            showIcon 
          />
        </Space>
      ),
    },
  ];

  if (initialLoading) {
    return <PageLoader text="Verifying existing AWS connection..." />;
  }

  if (isAlreadyConnected) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px 20px', maxWidth: 600, margin: '40px auto', boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG }}>
        <CheckCircleOutlined style={{ fontSize: 64, color: token.colorSuccess, marginBottom: 24 }} />
        <Title level={3}>AWS Account is Connected</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 32, fontSize: 16 }}>
          Your AWS environment is successfully delivering data to Cloud Penny.
        </Text>
        <Button size="large" onClick={() => {
          setForceReconfigure(true);
          setCurrent(0);
        }}>
          Reconfigure Connection
        </Button>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 400, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: token.marginXL, padding: `0 ${token.paddingXL}px` }}>
        <Steps
          current={current}
          items={steps.map((item) => ({ title: item.title, icon: item.icon }))}
        />
      </div>

      <div style={{ 
        flex: 1, 
        padding: token.paddingXL, 
        border: `1px solid ${token.colorBorderSecondary}`, 
        borderRadius: token.borderRadiusLG,
        background: token.colorBgElevated 
      }}>
        <Title level={4} style={{ marginTop: 0 }}>{steps[current].title}</Title>
        <div style={{ minHeight: 200, marginTop: token.marginLG }}>
          {steps[current].content}
        </div>
        
        <div style={{ marginTop: token.marginXL, display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${token.colorSplit}`, paddingTop: token.paddingLG }}>
          <Space>
            {current > 0 && (
              <Button onClick={() => prev()} disabled={verifyAwsConnection.isPending}>
                Previous
              </Button>
            )}
            {current === 0 && (
              <Button type="primary" onClick={handleSaveAccount} loading={saveAwsConnection.isPending} disabled={!awsAccountId}>
                Save & Continue
              </Button>
            )}
            {current > 0 && current < steps.length - 1 && (
              <Button type="primary" onClick={() => next()}>
                Next Step
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" onClick={verifyConnection} loading={verifyAwsConnection.isPending}>
                Check Delivery Status
              </Button>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ConnectAWS;
