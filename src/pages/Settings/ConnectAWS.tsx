import React, { useState, useEffect } from 'react';
import { Steps, Button, Typography, Card, theme, Space, Alert, message, Input } from 'antd';
import { CloudServerOutlined, LockOutlined, CheckCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import apiClient from '../../lib/apiClient';
import { userService } from '../../api/userService';
import ConfirmModal from '../../components/ui/ConfirmModal';
import PageLoader from '../../components/ui/PageLoader';

const { Title, Text, Paragraph } = Typography;

const ConnectAWS: React.FC = () => {
  const { token } = theme.useToken();
  const [current, setCurrent] = useState(0);
  const [externalId, setExternalId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [roleArn, setRoleArn] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check connection status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const profile = await userService.getCurrentUser();
        if (profile.connectionStatus === 'VERIFIED') {
          setIsAlreadyConnected(true);
        } else {
          setIsAlreadyConnected(false);
        }
      } catch (error) {
        setIsAlreadyConnected(false);
      } finally {
        setInitialLoading(false);
      }
    };
    checkStatus();
  }, []);
  const generateExternalId = async () => {
    setLoadingId(true);
    try {
      const response = await apiClient.get('/v1/aws-connection');
      setExternalId(response.data.externalId || response.data.data?.externalId || 'error-fetching-id');
      message.success('External ID generated successfully!');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to fetch external ID:', error);
      message.error('Failed to generate External ID. Make sure your API is connected.');
      setExternalId('sample-external-id-12345'); // Fallback for UI testing
      setIsModalOpen(false);
    } finally {
      setLoadingId(false);
    }
  };

  const verifyConnection = async () => {
    if (!roleArn.startsWith('arn:aws:iam::')) {
      message.error("Please enter a valid IAM Role ARN starting with 'arn:aws:iam::'");
      return;
    }
    
    setVerifying(true);
    try {
      // 1. Verify the connection by hitting the STS assume role logic
      await apiClient.post('/v1/aws-connection/verify', { roleArn });
      
      // 2. If verification succeeds, save the ARN to the backend
      await apiClient.post('/v1/aws-connection', { roleArn });
      
      message.success('AWS Account successfully connected! We are now syncing your CUR data.');
      // Optional: Redirect or change component state to show a massive success screen
    } catch (error) {
      console.error('Failed to verify connection:', error);
      message.error('Failed to verify connection. Please check the ARN and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);

  const steps = [
    {
      title: 'Generate External ID',
      icon: <LockOutlined />,
      content: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>
            To securely connect your AWS account to Cloud Penny, we use AWS Cross-Account IAM Roles. 
            This is the most secure method recommended by AWS because it does not require sharing access keys.
          </Text>
          
          {!externalId ? (
            <>
              <Button type="primary" onClick={() => setIsModalOpen(true)}>
                Generate External ID
              </Button>
              <ConfirmModal
                isOpen={isModalOpen}
                title="Generate New External ID?"
                description="This will invalidate your existing AWS connection. Do you want to proceed?"
                okText="Yes, Generate"
                onConfirm={generateExternalId}
                onCancel={() => setIsModalOpen(false)}
                loading={loadingId}
              />
            </>
          ) : (
            <Card size="small" style={{ background: token.colorFillAlter, border: `1px solid ${token.colorPrimaryBorder}` }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" strong>Your Unique External ID</Text>
                <Paragraph copyable style={{ margin: 0, fontFamily: 'monospace', fontSize: token.fontSizeLG, color: token.colorPrimary }}>
                  {externalId}
                </Paragraph>
              </Space>
            </Card>
          )}

          {externalId && (
            <Alert 
              message="Keep this tab open!" 
              description="You will need to copy and paste this External ID into your AWS Console during the next step."
              type="info" 
              showIcon 
            />
          )}
        </Space>
      ),
    },
    {
      title: 'Create IAM Role',
      icon: <CloudServerOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Text>
            To securely grant Cloud Penny access to your AWS Cost and Usage Reports (CUR), you need to deploy a secure IAM Role in your AWS account. 
            We provide a pre-configured CloudFormation template to automate this.
          </Text>

          <Card size="small" style={{ background: token.colorFillAlter, border: `1px solid ${token.colorPrimaryBorder}` }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary" strong>CloudFormation Template URL</Text>
              <Paragraph copyable style={{ margin: 0, fontFamily: 'monospace', fontSize: token.fontSizeSM, color: token.colorPrimary, wordBreak: 'break-all' }}>
                https://cloud-penny-bucket.s3.ap-southeast-1.amazonaws.com/cloud-formation/cloud-penny-role.yml
              </Paragraph>
            </Space>
          </Card>

          <div>
            <Title level={5}>Deployment Instructions:</Title>
            <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                <Text>Log into your AWS Console and open the <a href="https://console.aws.amazon.com/cloudformation/home" target="_blank" rel="noreferrer">CloudFormation dashboard</a>.</Text>
              </li>
              <li>
                <Text>Click <strong>Create stack</strong> {'>'} <strong>With new resources (standard)</strong>.</Text>
              </li>
              <li>
                <Text>Select <strong>Amazon S3 URL</strong> and paste the template URL provided above.</Text>
              </li>
              <li>
                <Text>Enter a Stack Name (e.g., <code>CloudPenny-Role</code>).</Text>
              </li>
              <li>
                <Text>In the Parameters section:</Text>
                <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                  <li><Text>For <strong>TrustedAccountId</strong>, enter <code>696223520485</code></Text></li>
                  <li><Text>For <strong>ExternalId</strong>, paste your External ID exactly as generated in Step 1</Text></li>
                </ul>
              </li>
              <li>
                <Text>Check the IAM acknowledgment box at the bottom and click <strong>Submit</strong>.</Text>
              </li>
            </ol>
          </div>

          <Button 
            type="primary" 
            icon={<CloudServerOutlined />}
            href={`https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?templateURL=https://cloud-penny-bucket.s3.ap-southeast-1.amazonaws.com/cloud-formation/cloud-penny-role.yml&stackName=CloudPenny-Integration&param_TrustedAccountId=696223520485${externalId ? `&param_ExternalId=${externalId}` : ''}`}
            target="_blank"
            disabled={!externalId}
          >
            Deploy via AWS Quick Create
          </Button>

          {!externalId && (
            <Alert message="Please generate an External ID in Step 1 before deploying the CloudFormation stack." type="warning" showIcon />
          )}
        </Space>
      ),
    },
    {
      title: 'Verify Connection',
      icon: <CheckCircleOutlined />,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Text>
            Almost done! Once your CloudFormation stack says <strong>CREATE_COMPLETE</strong>, navigate to the <strong>Outputs</strong> tab in AWS.
            Copy the <code>RoleARN</code> value and paste it below to establish the connection.
          </Text>
          
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>IAM Role ARN</Text>
            <Input 
              placeholder="arn:aws:iam::123456789012:role/CloudPennyAccessRole" 
              size="large"
              value={roleArn}
              onChange={(e) => setRoleArn(e.target.value)}
              disabled={verifying}
            />
          </div>
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
          Your AWS environment is securely connected via IAM Cross-Account Role. 
          Cloud Penny is actively monitoring your Cost and Usage data.
        </Text>
        <Button size="large" onClick={() => setIsAlreadyConnected(false)}>
          Reconfigure Connection
        </Button>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 400, maxWidth: 900, margin: '0 auto' }}>
      {/* Top side: Horizontal Steps */}
      <div style={{ marginBottom: token.marginXL, padding: `0 ${token.paddingXL}px` }}>
        <Steps
          current={current}
          items={steps.map((item) => ({ title: item.title, icon: item.icon }))}
        />
      </div>

      {/* Bottom side: Step Content */}
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
            {current < steps.length - 1 && (
              <Button type="primary" onClick={() => next()} disabled={loadingId && current === 0}>
                Next Step
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" onClick={verifyConnection} loading={verifying} disabled={!roleArn}>
                Verify & Connect
              </Button>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ConnectAWS;
