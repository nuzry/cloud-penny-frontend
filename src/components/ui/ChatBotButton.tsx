import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Typography, Avatar, Flex, theme, Space } from 'antd';
import { SendOutlined, CloseOutlined, UserOutlined, ExpandAltOutlined, ShrinkOutlined } from '@ant-design/icons';
import { aiService, ChatMessage } from '../../api/aiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const BotFace: React.FC<{ size?: number }> = ({ size = 28 }) => {
  const scale = size / 60;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#8b5cf6',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div 
        style={{
          position: 'absolute',
          width: 8 * scale,
          height: 14 * scale,
          borderRadius: 4 * scale,
          background: '#fff',
          transform: 'rotate(15deg)',
          right: 24 * scale,
          top: 22 * scale,
        }} 
      />
      <div 
        style={{
          position: 'absolute',
          width: 8 * scale,
          height: 14 * scale,
          borderRadius: 4 * scale,
          background: '#fff',
          transform: 'rotate(15deg)',
          right: 12 * scale,
          top: 22 * scale,
        }} 
      />
    </div>
  );
};

export const ChatBotButton: React.FC = () => {
  const { token } = theme.useToken();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am your Cloud Penny assistant. How can I help you manage your AWS costs today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);

  const bgColor = '#8b5cf6'; 
  const eyeColor = '#ffffff';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date()
    };

    const currentHistory = messages.slice(1).map(m => ({ sender: m.sender, text: m.text } as ChatMessage));
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const replyText = await aiService.sendMessage(userText, currentHistory);
      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "**Error:** I am having trouble connecting to the server. Please try again later.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          bottom: isOpen ? 100 : 24,
          right: 24,
          zIndex: 9998,
          width: isMaximized ? 800 : 350,
          height: isMaximized ? '80vh' : 500,
          maxWidth: 'calc(100vw - 48px)',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transformOrigin: 'bottom right'
        }}
      >
        <Card
          title={
            <Flex align="center" gap="small">
              <Typography.Text strong style={{ fontSize: 16 }}>Penny AI</Typography.Text>
            </Flex>
          }
          extra={
            <Space>
              <Button 
                type="text" 
                icon={isMaximized ? <ShrinkOutlined /> : <ExpandAltOutlined />} 
                onClick={() => setIsMaximized(!isMaximized)} 
              />
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={() => setIsOpen(false)} 
              />
            </Space>
          }
          style={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: token.boxShadowSecondary }}
          bodyStyle={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          headStyle={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
        >
          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: token.colorBgLayout }}>
            <List
              dataSource={messages}
              renderItem={(msg) => {
                const isBot = msg.sender === 'assistant';
                return (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: isBot ? 'flex-start' : 'flex-end',
                    marginBottom: 16 
                  }}>
                    <Flex gap="small" align="flex-end" style={{ maxWidth: '85%', flexDirection: isBot ? 'row' : 'row-reverse' }}>
                      {isBot ? (
                        <BotFace size={24} />
                      ) : (
                        <Avatar 
                          size="small" 
                          icon={<UserOutlined />} 
                          style={{ 
                            backgroundColor: token.colorTextSecondary,
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div style={{
                        background: isBot ? token.colorBgContainer : token.colorPrimary,
                        color: isBot ? token.colorText : '#fff',
                        padding: '10px 14px',
                        borderRadius: 16,
                        borderBottomLeftRadius: isBot ? 4 : 16,
                        borderBottomRightRadius: !isBot ? 4 : 16,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}>
                        {msg.text}
                      </div>
                    </Flex>
                  </div>
                );
              }}
            />
            {isTyping && (
              <div style={{ display: 'flex', marginBottom: 16 }}>
                <Flex gap="small" align="flex-end">
                  <BotFace size={24} />
                  <div style={{
                    background: token.colorBgContainer,
                    padding: '10px 14px',
                    borderRadius: 16,
                    borderBottomLeftRadius: 4,
                  }}>
                    <Typography.Text type="secondary" className="typing-indicator">typing...</Typography.Text>
                  </div>
                </Flex>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}>
            <Flex gap="small">
              <Input 
                placeholder="Ask about your costs..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={handleSend}
                disabled={isTyping}
                style={{ borderRadius: 20 }}
              />
              <Button 
                type="primary" 
                shape="circle" 
                icon={<SendOutlined />} 
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
              />
            </Flex>
          </div>
        </Card>
      </div>

      {/* Floating Action Button */}
      <div
        className="chatbot-button-container"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: bgColor,
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
          transform: isOpen ? 'scale(0)' : 'scale(1)',
        }}
        onClick={() => setIsOpen(true)}
      >
        <div className="chatbot-eye left" style={{ background: eyeColor }} />
        <div className="chatbot-eye right" style={{ background: eyeColor }} />

        <style>
          {`
            .chatbot-button-container {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              cursor: pointer;
              position: relative;
              animation: bounce 2.5s infinite ease-in-out;
              transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              filter: drop-shadow(0 6px 10px rgba(0,0,0,0.2));
            }
            
            .chatbot-button-container:hover {
              transform: scale(1.15) !important;
              animation-play-state: paused;
              filter: drop-shadow(0 8px 15px rgba(0,0,0,0.3));
            }

            .chatbot-eye {
              position: absolute;
              width: 8px;
              height: 14px;
              border-radius: 4px;
              transform: rotate(15deg);
              animation: look-around 10s infinite;
            }

            .chatbot-button-container:hover .chatbot-eye {
              animation: none;
              height: 4px;
              transform: rotate(15deg) translateY(5px);
              transition: all 0.2s ease;
            }

            .chatbot-eye.left {
              right: 24px;
              top: 22px;
            }

            .chatbot-eye.right {
              right: 12px;
              top: 22px;
            }

            .typing-indicator {
              animation: pulse 1.5s infinite ease-in-out;
            }

            @keyframes pulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }

            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-12px); }
            }

            @keyframes look-around {
              0%, 15%, 25%, 35%, 60%, 85%, 100% {
                transform: rotate(15deg) translate(0, 0);
                height: 14px;
              }
              18% {
                transform: rotate(15deg) translateY(5px);
                height: 4px;
              }
              21% {
                transform: rotate(15deg) translate(0, 0);
                height: 14px;
              }
              40%, 45% {
                transform: rotate(15deg) translateX(-4px);
                height: 14px;
              }
              65%, 75% {
                transform: rotate(15deg) translateX(4px);
                height: 14px;
              }
              90% {
                transform: rotate(15deg) translateY(5px);
                height: 4px;
              }
              92% {
                transform: rotate(15deg) translate(0, 0);
                height: 14px;
              }
              94% {
                transform: rotate(15deg) translateY(5px);
                height: 4px;
              }
              96% {
                transform: rotate(15deg) translate(0, 0);
                height: 14px;
              }
            }
          `}
        </style>
      </div>
    </>
  );
};
