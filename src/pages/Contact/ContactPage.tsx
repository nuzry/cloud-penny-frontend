import React, { useEffect, useRef, useState } from 'react';
import {
  Typography, Card, Flex, theme, Button, Modal, Input, Form, Tag, Empty,
  Popconfirm, Avatar,
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, SendOutlined, CheckCircleOutlined,
  UserOutlined, CustomerServiceOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import { formatRelativeTime, formatDateTime } from '../../utils/format';
import {
  useSupportConversations, useConversationMessages, useCreateConversation,
  useSendSupportMessage, useResolveConversation,
  type SupportConversationSummary,
} from '@/hooks/useSupportChatQueries';

const { Text } = Typography;

const statusTag = (status: 'OPEN' | 'RESOLVED') =>
  status === 'OPEN'
    ? <Tag color="processing">Open</Tag>
    : <Tag color="default">Resolved</Tag>;

// --- Conversation list ------------------------------------------------------

const ConversationList: React.FC<{
  conversations: SupportConversationSummary[];
  onSelect: (id: string) => void;
}> = ({ conversations, onSelect }) => {
  const { token } = theme.useToken();

  if (conversations.length === 0) {
    return (
      <Card bordered={false} style={{ boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG }}>
        <Empty description="No conversations yet — start one below if you need help." style={{ padding: 40 }} />
      </Card>
    );
  }

  return (
    <Flex vertical gap={10}>
      {conversations.map((c) => (
        <Card
          key={c.conversationId}
          hoverable
          size="small"
          onClick={() => onSelect(c.conversationId)}
          bordered={false}
          style={{ boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG, cursor: 'pointer' }}
        >
          <Flex justify="space-between" align="flex-start" gap={12}>
            <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
              <Flex align="center" gap={8}>
                <Text strong>{c.subject}</Text>
                {statusTag(c.status)}
              </Flex>
              <Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                {c.lastMessagePreview}
              </Text>
            </Flex>
            <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {formatRelativeTime(c.lastMessageAt)}
            </Text>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
};

// --- New conversation modal --------------------------------------------------

const NewConversationModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const createConversation = useCreateConversation();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const result = await createConversation.mutateAsync(values);
    form.resetFields();
    onCreated(result.conversationId);
  };

  return (
    <Modal
      title="Start a new conversation"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Send"
      confirmLoading={createConversation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="subject"
          label="Subject"
          rules={[{ required: true, message: 'Please give your conversation a subject' }, { max: 200 }]}
        >
          <Input placeholder="e.g. Question about my AWS connection" />
        </Form.Item>
        <Form.Item
          name="message"
          label="Message"
          rules={[{ required: true, message: 'Please describe what you need help with' }, { max: 3500 }]}
        >
          <Input.TextArea rows={4} placeholder="Describe your question or issue..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- Conversation thread ------------------------------------------------------

const ConversationThread: React.FC<{
  conversationId: string;
  onBack: () => void;
}> = ({ conversationId, onBack }) => {
  const { token } = theme.useToken();
  const { data, isLoading } = useConversationMessages(conversationId);
  const sendMessage = useSendSupportMessage(conversationId);
  const resolveConversation = useResolveConversation();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages.length]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    await sendMessage.mutateAsync(text);
  };

  const handleResolve = async () => {
    await resolveConversation.mutateAsync(conversationId);
  };

  if (isLoading || !data) {
    return <PageLoader height={400} />;
  }

  const isOpen = data.status === 'OPEN';

  return (
    <Card
      bordered={false}
      // flex: 1 + minHeight: 0 fills whatever space is actually left in the
      // (now properly viewport-bounded, see AppLayout) parent column, instead
      // of guessing a fixed viewport offset — this is what makes the card
      // stop at the real available height rather than pushing its own input
      // bar off-screen.
      style={{ boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: 0, overflow: 'hidden' } }}
    >
      {/* Thread header */}
      <Flex
        align="center"
        justify="space-between"
        gap={12}
        style={{ padding: '14px 20px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}
      >
        <Flex align="center" gap={10} style={{ minWidth: 0 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
          <Flex vertical style={{ minWidth: 0 }}>
            <Text strong ellipsis>{data.subject}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Started {formatDateTime(data.createdAt)}</Text>
          </Flex>
        </Flex>
        <Flex align="center" gap={10}>
          {statusTag(data.status)}
          {isOpen && (
            <Popconfirm
              title="Mark as resolved?"
              description="Once resolved this conversation becomes read-only history and can't be reopened."
              okText="Resolve"
              cancelText="Cancel"
              onConfirm={handleResolve}
            >
              <Button size="small" icon={<CheckCircleOutlined />} loading={resolveConversation.isPending}>
                Mark Resolved
              </Button>
            </Popconfirm>
          )}
        </Flex>
      </Flex>

      {/* Messages — minHeight: 0 overrides the flex default of min-height: auto,
          which otherwise keeps a flex:1 child at its full content height
          instead of shrinking to the parent's bound and scrolling internally. */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 20, background: token.colorBgLayout }}>
        {data.messages.map((msg) => {
          const isClient = msg.sender === 'CLIENT';
          return (
            <div key={msg.messageId} style={{ display: 'flex', justifyContent: isClient ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
              <Flex gap={8} align="flex-end" style={{ maxWidth: '75%', flexDirection: isClient ? 'row-reverse' : 'row' }}>
                <Avatar
                  size="small"
                  icon={isClient ? <UserOutlined /> : <CustomerServiceOutlined />}
                  style={{ backgroundColor: isClient ? token.colorTextSecondary : token.colorPrimary, flexShrink: 0 }}
                />
                <div>
                  <div style={{
                    background: isClient ? token.colorPrimary : token.colorBgContainer,
                    color: isClient ? '#fff' : token.colorText,
                    padding: '9px 13px',
                    borderRadius: 14,
                    borderBottomRightRadius: isClient ? 4 : 14,
                    borderBottomLeftRadius: !isClient ? 4 : 14,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 3, textAlign: isClient ? 'right' : 'left' }}>
                    {isClient ? 'You' : 'Support'} · {formatRelativeTime(msg.createdAt)}
                  </Text>
                </div>
              </Flex>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isOpen ? (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}>
          <Flex gap={8}>
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={handleSend}
              disabled={sendMessage.isPending}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={sendMessage.isPending}
              disabled={!inputValue.trim()}
            />
          </Flex>
        </div>
      ) : (
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${token.colorBorderSecondary}`, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            <CheckCircleOutlined style={{ marginRight: 6 }} />
            This conversation is resolved and is now read-only.
          </Text>
        </div>
      )}
    </Card>
  );
};

// --- Page ---------------------------------------------------------------------

const ContactPage: React.FC = () => {
  const { data: conversations, isLoading } = useSupportConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    // minHeight: 0 lets this shrink to AppLayout's Content bound instead of
    // pushing it taller — the same flex gotcha as the chat card below, one
    // level up.
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1, minHeight: 0 }}>
      <PageHeader
        title="Contact & Support"
        description="Start a conversation with our team — replies usually land within a business day."
        extra={
          !selectedId && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              New Conversation
            </Button>
          )
        }
      />

      {selectedId ? (
        <ConversationThread conversationId={selectedId} onBack={() => setSelectedId(null)} />
      ) : isLoading ? (
        <PageLoader height={300} />
      ) : (
        <ConversationList conversations={conversations || []} onSelect={setSelectedId} />
      )}

      <NewConversationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(conversationId) => {
          setModalOpen(false);
          setSelectedId(conversationId);
        }}
      />
    </div>
  );
};

export default ContactPage;
