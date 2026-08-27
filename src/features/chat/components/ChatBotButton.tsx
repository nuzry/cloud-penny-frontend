import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Typography, Avatar, Flex, theme, Space } from 'antd';
import { SendOutlined, CloseOutlined, UserOutlined, ExpandAltOutlined, ShrinkOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { aiService, type ChatMessage } from '../api/aiService';

// Penny's replies are plain Markdown text (per the system prompt: bold for
// numbers/names, bullet lists for breakdowns) — this used to render as a raw
// `**text**` string with literal asterisks since nothing parsed it. Margins
// on p/ul/li are collapsed to fit a compact chat bubble instead of full-page
// prose spacing.
const MarkdownMessage: React.FC<{ text: string }> = ({ text }) => (
  <ReactMarkdown
    components={{
      p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
      ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>,
      ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ol>,
      li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
      a: ({ children, href }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
          {children}
        </a>
      ),
    }}
  >
    {text}
  </ReactMarkdown>
);

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const CLOUD_COLOR = '#4f46e5'; // matches the app's colorPrimary — the same cloud mark used in the sidebar logo and landing page

// Penny's mascot: a cloud silhouette (built from overlapping same-color
// circles + a base pill, same technique as the sidebar/landing brand mark)
// with two eyes. `animated` drives the idle blink + look-around loop and is
// only turned on for the single prominent floating button — the small
// per-message avatar stays static so a scrolling message list of them isn't
// distracting.
const CloudFace: React.FC<{ size?: number; animated?: boolean }> = ({ size = 28, animated = false }) => {
  const s = size / 60; // design is authored at 60px, scaled proportionally for the small avatar
  const puff = (width: number, top: number, left: number) => ({
    position: 'absolute' as const,
    width: width * s,
    height: width * s,
    left: left * s,
    top: top * s,
    borderRadius: '50%',
    background: CLOUD_COLOR,
  });

  return (
    <div
      className={animated ? 'cloud-face cloud-face-animated' : 'cloud-face'}
      style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}
    >
      {/* Cloud silhouette */}
      <div style={puff(26, 14, 2)} />
      <div style={puff(34, 4, 16)} />
      <div style={puff(24, 15, 34)} />
      <div style={{ position: 'absolute', width: 44 * s, height: 22 * s, left: 8 * s, top: 26 * s, borderRadius: 11 * s, background: CLOUD_COLOR }} />

      {/* Eyes */}
      <div className="cloud-eye" style={{ width: 10 * s, height: 10 * s, left: 20 * s, top: 32 * s }}>
        <div className="cloud-pupil" />
      </div>
      <div className="cloud-eye" style={{ width: 10 * s, height: 10 * s, left: 32 * s, top: 32 * s }}>
        <div className="cloud-pupil" />
      </div>
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (textOverride?: string | React.MouseEvent | React.KeyboardEvent) => {
    // If called from an event (like Enter key), textOverride is an event object
    const text = typeof textOverride === 'string' ? textOverride : inputValue.trim();
    if (!text) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    const currentHistory = messages.slice(1).map(m => ({ sender: m.sender, text: m.text } as ChatMessage));
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const replyText = await aiService.sendMessage(text, currentHistory);
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
                        <CloudFace size={28} />
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
                        {isBot ? <MarkdownMessage text={msg.text} /> : msg.text}
                      </div>
                    </Flex>
                  </div>
                );
              }}
            />
            {isTyping && (
              <div style={{ display: 'flex', marginBottom: 16 }}>
                <Flex gap="small" align="flex-end">
                  <CloudFace size={28} />
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
            {messages.length === 1 && !isTyping && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Suggested questions:</Typography.Text>
                <Flex wrap="wrap" gap="small">
                  <Button size="small" style={{ borderRadius: 16 }} onClick={() => handleSend('What was my total AWS spend last month?')}>Total spend last month?</Button>
                  <Button size="small" style={{ borderRadius: 16 }} onClick={() => handleSend('Can you break down my costs by service?')}>Cost by service?</Button>
                  <Button size="small" style={{ borderRadius: 16 }} onClick={() => handleSend('What were my top cost drivers recently?')}>Top cost drivers?</Button>
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
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
          transform: isOpen ? 'scale(0)' : 'scale(1)',
        }}
        onClick={() => setIsOpen(true)}
      >
        <CloudFace size={60} animated />

        <style>
          {`
            .chatbot-button-container {
              width: 60px;
              height: 60px;
              cursor: pointer;
              position: relative;
              animation: bounce 2.5s infinite ease-in-out;
              transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              filter: drop-shadow(0 6px 10px rgba(0,0,0,0.25));
            }

            .chatbot-button-container:hover {
              transform: scale(1.15) !important;
              animation-play-state: paused;
              filter: drop-shadow(0 8px 15px rgba(0,0,0,0.35));
            }

            .cloud-eye {
              position: absolute;
              background: #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.2s ease;
            }

            .cloud-pupil {
              width: 46%;
              height: 46%;
              border-radius: 50%;
              background: #312e81;
            }

            .cloud-face-animated .cloud-eye {
              animation: blink 4.5s infinite;
            }

            .cloud-face-animated .cloud-pupil {
              animation: look-around 9s infinite;
            }

            .chatbot-button-container:hover .cloud-eye {
              animation: none;
              transform: scaleY(0.25);
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

            @keyframes blink {
              0%, 92%, 100% { transform: scaleY(1); }
              95% { transform: scaleY(0.1); }
            }

            @keyframes look-around {
              0%, 15%, 40%, 65%, 100% { transform: translate(0, 0); }
              22% { transform: translate(-1.5px, 0.5px); }
              48% { transform: translate(1.5px, 0.5px); }
              72% { transform: translate(0, -1.5px); }
            }
          `}
        </style>
      </div>
    </>
  );
};
