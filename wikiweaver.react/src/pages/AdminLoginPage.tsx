import React, { useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Typography, message } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminLogin, adminRegister, getAuthStatus } from '../services/authService';
import { setStoredAdminToken } from '../services/authTokenStorage';

const { Title } = Typography;

type FormValues = {
  email: string;
  password: string;
  inviteToken?: string;
};

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const statusQuery = useQuery({ queryKey: ['auth-status'], queryFn: getAuthStatus });

  const loginMutation = useMutation({
    mutationFn: adminLogin,
    onSuccess: (result) => {
      setStoredAdminToken(result.accessToken);
      messageApi.success('Admin session started');
      navigate('/admin');
    },
    onError: (error) => messageApi.error((error as Error).message),
  });

  const registerMutation = useMutation({
    mutationFn: adminRegister,
    onSuccess: (result) => {
      setStoredAdminToken(result.accessToken);
      messageApi.success('Admin account created');
      navigate('/admin');
    },
    onError: (error) => messageApi.error((error as Error).message),
  });

  const requiresInvite = !statusQuery.data?.requiresBootstrapAdmin;

  const onFinish = (values: FormValues) => {
    if (isRegisterMode) {
      registerMutation.mutate(values);
      return;
    }

    loginMutation.mutate({ email: values.email, password: values.password });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {contextHolder}
      <Title level={2}>{isRegisterMode ? 'Регистрация администратора' : 'Вход администратора'}</Title>
      <Card style={{ maxWidth: 480 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Email" name="email" rules={[{ required: true }]}>
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item label="Пароль" name="password" rules={[{ required: true }]}>
            <Input.Password autoComplete={isRegisterMode ? 'new-password' : 'current-password'} />
          </Form.Item>

          {isRegisterMode && requiresInvite && (
            <Form.Item label="Invite token" name="inviteToken" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}

          {isRegisterMode && !requiresInvite && (
            <Alert
              type="info"
              showIcon
              message="Первый зарегистрировавшийся станет админом без invite token"
              style={{ marginBottom: 16 }}
            />
          )}

          <Space>
            <Button type="primary" htmlType="submit" loading={loginMutation.isPending || registerMutation.isPending}>
              {isRegisterMode ? 'Зарегистрироваться' : 'Войти'}
            </Button>
            <Button type="link" onClick={() => setIsRegisterMode((state) => !state)}>
              {isRegisterMode ? 'У меня уже есть аккаунт' : 'Создать админ-аккаунт'}
            </Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
};

export default AdminLoginPage;
