import React from 'react';
import { Modal, Typography, Space } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string | React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  okText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  loading = false,
  okText = 'Yes, Proceed',
  cancelText = 'Cancel'
}) => {
  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleFilled style={{ color: '#faad14' }} />
          <span>{title}</span>
        </Space>
      }
      open={isOpen}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={okText}
      cancelText={cancelText}
      centered
      maskClosable={!loading}
      closable={!loading}
    >
      <div style={{ marginTop: 16 }}>
        <Typography.Text>{description}</Typography.Text>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
