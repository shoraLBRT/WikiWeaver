import React from 'react';
import { Typography, Card } from 'antd';

const { Title, Text } = Typography;

const WelcomePage: React.FC = () => {
  return (
    <Card style={{ maxWidth: 600, textAlign: 'center' }}>
      <Title level={2}>Welcome to WikiWeaver</Title>
      <Text>
        Please select an article from the navigation panel on the left to get started.
        WikiWeaver is your platform for creating and managing wiki-style content with ease.
      </Text>
    </Card>
  );
};

export default WelcomePage;