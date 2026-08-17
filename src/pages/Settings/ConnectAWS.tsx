import React, { useState, useEffect } from 'react';
import { Steps, Button, Typography, Card, theme, Space, Alert, message, Input } from 'antd';
import { CloudServerOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import apiClient from '../../lib/apiClient';
import { userService } from '../../api/userService';
import PageLoader from '../../components/ui/PageLoader';

const { Title, Text, Paragraph } = Typography;

const ConnectAWS: React.FC = () => {
  const { token } = theme.useToken();
  const [current, setCurrent] = useState(0);
  
  const [awsAccountId, setAwsAccountId] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'UNCONNECTED' | 'PENDING' | 'VERIFIED'>('UNCONNECTED');
  const [cfUrl, setCfUrl] = useState<string>('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>('');

  const centralBucketName = 'cloudpenny-central-curs-dev'; // Should ideally come from env

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const profile = await userService.getCurrentUser();
        setTenantId(profile.tenantId || 'your-tenant-id');
        
        try {
          const connRes = await apiClient.get('/v1/aws-connection');
          const data = connRes.data.data;
          
          if (data?.awsAccountId) {
            setAwsAccountId(data.awsAccountId);
            setConnectionStatus(data.connectionStatus);
            
            if (data.connectionStatus === 'VERIFIED') {
              setIsAlreadyConnected(true);
            } else if (data.connectionStatus === 'PENDING') {
              if (data.cfUrl) setCfUrl(data.cfUrl);
              setCurrent(1); // Skip to instructions if pending
            }
          }
        } catch (err) {
          console.error("No existing connection found.");
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleSaveAccount = async () => {
    if (!awsAccountId || awsAccountId.length !== 12 || !/^\d+$/.test(awsAccountId)) {
      message.error("Please enter a valid 12-digit AWS Account ID.");
      return;
    }
    
    setSavingAccount(true);
    try {
      const res = await apiClient.post('/v1/aws-connection', { awsAccountId });
      const data = res.data.data;
      setConnectionStatus(data.connectionStatus);
      if (data.cfUrl) setCfUrl(data.cfUrl);
      
      message.success('AWS Account ID saved. Proceed to the next step.');
      next();
    } catch (error: any) {
      console.error('Failed to save account:', error);
      message.error(error.response?.data?.error || 'Failed to save account ID.');
    } finally {
      setSavingAccount(false);
    }
  };

  const verifyConnection = async () => {
    setVerifying(true);
    try {
      const verifyResponse = await apiClient.post('/v1/aws-connection/verify');
      
      if (verifyResponse.data?.data?.connectionStatus === 'VERIFIED') {
        setIsAlreadyConnected(true);
        setConnectionStatus('VERIFIED');
        message.success('AWS Account successfully connected and data received!');
      } else {
        message.info(verifyResponse.data.error || 'No data received yet. This can take up to 24 hours. Check back later.');
      }
    } catch (error: any) {
      console.error('Failed to verify connection:', error);
      message.error(error.response?.data?.error || 'Failed to verify connection.');
    } finally {
      setVerifying(false);
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
          setIsAlreadyConnected(false);
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
              <Button onClick={() => prev()} disabled={verifying}>
                Previous
              </Button>
            )}
            {current === 0 && (
              <Button type="primary" onClick={handleSaveAccount} loading={savingAccount} disabled={!awsAccountId}>
                Save & Continue
              </Button>
            )}
            {current > 0 && current < steps.length - 1 && (
              <Button type="primary" onClick={() => next()}>
                Next Step
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" onClick={verifyConnection} loading={verifying}>
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
