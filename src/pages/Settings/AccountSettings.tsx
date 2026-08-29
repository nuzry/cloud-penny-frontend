import React, { useState } from 'react';
import { Typography, Flex, Button, Modal, Input, message, theme, Alert } from 'antd';
import { useDeleteClientMe } from '@/hooks/useClientQueries';
import { useAuth } from '../../features/auth/AuthContext';
import { getCognitoLogoutUrl } from '../../features/auth/api/cognito';

const AccountSettings: React.FC = () => {
  const { token } = theme.useToken();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { clearSession, user } = useAuth();
  const deleteClientMe = useDeleteClientMe();
  const isDeleting = deleteClientMe.isPending;

  const confirmText = user?.email || 'delete my account';

  const showModal = () => {
    setIsModalVisible(true);
    setDeleteConfirmation('');
  };

  const handleCancel = () => {
    if (isDeleting) return;
    setIsModalVisible(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== confirmText) {
      message.error(`Please type ${confirmText} to confirm.`);
      return;
    }

    try {
      // Step 1: Fire the DELETE API call FIRST and await it fully.
      // We must NOT call logout() before this — logout() triggers
      // window.location.assign() which navigates the browser away and
      // aborts all in-flight network requests before the API responds.
      await deleteClientMe.mutateAsync();

      // Step 2: API succeeded — now clear the local session state.
      clearSession();

      message.success('Account deleted successfully.');
      setIsModalVisible(false);

      // Step 3: Redirect to Cognito logout after a short delay so the
      // success message is visible.
      setTimeout(() => {
        window.location.assign(getCognitoLogoutUrl());
      }, 1500);

    } catch (error: any) {
      console.error('Failed to delete account:', error);
      message.error(error?.response?.data?.message || 'Failed to delete account. Please try again.');
    }
  };

  return (
    <Flex vertical gap="large" style={{ maxWidth: 800, width: '100%' }}>
      <div>
        <Typography.Title level={4} style={{ marginBottom: token.marginSM }}>
          Danger Zone
        </Typography.Title>
        <div style={{
          border: `1px solid ${token.colorErrorBorder}`,
          borderRadius: token.borderRadiusLG,
          overflow: 'hidden'
        }}>
          <Flex justify="space-between" align="center" style={{ padding: token.padding, borderBottom: `1px solid ${token.colorSplit}` }}>
            <Flex vertical>
              <Typography.Text strong>Delete AWS CloudFormation Stack</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                Remove the AWS resources created by Cloud Penny from your AWS account.
              </Typography.Text>
            </Flex>
            <Button
              type="primary"
              danger
              onClick={() => {
                const shortId = user?.sub?.substring(0, 8) || '';
                const stackName = shortId ? `CloudPenny-Export-${shortId}` : '';
                window.open(`https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks?filteringText=${stackName}`, '_blank');
              }}
            >
              Open AWS Console
            </Button>
          </Flex>

          <Flex justify="space-between" align="center" style={{ padding: token.padding }}>
            <Flex vertical>
              <Typography.Text strong>Delete this account</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                Once you delete an account, there is no going back. Please be certain.
              </Typography.Text>
            </Flex>
            <Button type="primary" danger onClick={showModal}>
              Delete this account
            </Button>
          </Flex>
        </div>
      </div>

      <Modal
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        centered
        closable={!isDeleting}
        maskClosable={!isDeleting}
        width={450}
        styles={{ body: { paddingTop: 24 } }}
      >
        <Flex vertical gap="middle">
          <Typography.Title level={4} style={{ margin: 0 }}>
            Are you absolutely sure?
          </Typography.Title>

          <Alert
            type="warning"
            message="Unexpected bad things will happen if you don't read this!"
            showIcon
          />

          <Typography.Text>
            This action <strong>cannot</strong> be undone. This will permanently delete the <strong>{confirmText}</strong> account,
            along with all configurations, connected data, and access.
          </Typography.Text>

          <Typography.Text>
            Please type <strong>{confirmText}</strong> to confirm.
          </Typography.Text>

          <Input
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            disabled={isDeleting}
          />

          <Button
            block
            danger
            type="primary"
            loading={isDeleting}
            disabled={deleteConfirmation !== confirmText}
            onClick={handleDelete}
            style={{ marginTop: 8 }}
          >
            I understand the consequences, delete this account
          </Button>
        </Flex>
      </Modal>
    </Flex>
  );
};

export default AccountSettings;
