import React, { useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Typography, message } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminLogin, adminRegister, getAuthStatus } from '../services/authService';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { locale } from '../localization';
import { setStoredAdminToken } from '../services/authTokenStorage';

const { Title } = Typography;

type FormValues = {
  email: string;
  password: string;
  inviteToken?: string;
};

const AdminLoginPage: React.FC = () => {
  const t = locale.adminLoginPage;
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const statusQuery = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.AUTH_STATUS],
    queryFn: getAuthStatus,
  });

  const loginMutation = useMutation({
    mutationFn: adminLogin,
    onSuccess: (result) => {
      setStoredAdminToken(result.accessToken);
      messageApi.success(t.loginSuccess);
      navigate('/admin');
    },
    onError: (error) => messageApi.error((error as Error).message),
  });

  const registerMutation = useMutation({
    mutationFn: adminRegister,
    onSuccess: (result) => {
      setStoredAdminToken(result.accessToken);
      messageApi.success(t.registerSuccess);
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
      <Title level={2}>{isRegisterMode ? t.registerTitle : t.loginTitle}</Title>
      <Card style={{ maxWidth: 480 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label={t.emailLabel} name="email" rules={[{ required: true }]}>
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item label={t.passwordLabel} name="password" rules={[{ required: true }]}>
            <Input.Password autoComplete={isRegisterMode ? 'new-password' : 'current-password'} />
          </Form.Item>

          {isRegisterMode && requiresInvite && (
            <Form.Item label={t.inviteTokenLabel} name="inviteToken" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}

          {isRegisterMode && !requiresInvite && (
            <Alert
              type="info"
              showIcon
              message={t.firstAdminHint}
              style={{ marginBottom: 16 }}
            />
          )}

          <Space>
            <Button type="primary" htmlType="submit" loading={loginMutation.isPending || registerMutation.isPending}>
              {isRegisterMode ? t.registerAction : t.loginAction}
            </Button>
            <Button type="link" onClick={() => setIsRegisterMode((state) => !state)}>
              {isRegisterMode ? t.haveAccount : t.createAccount}
            </Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
};

export default AdminLoginPage;
