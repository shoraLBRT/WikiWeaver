import React from 'react';
import { Typography, Card } from 'antd';
import { APP_CONSTANTS } from '../constants/AppConstants';

const { Title, Text } = Typography;

const WelcomePage: React.FC = () => {
  return (
    <Card style={{ maxWidth: APP_CONSTANTS.STYLING.MAX_CARD_WIDTH, textAlign: 'center' }}>
      <Title level={2}>{APP_CONSTANTS.PLACEHOLDER_TEXT.WELCOME_MESSAGE}</Title>
      <Text>
        {APP_CONSTANTS.PLACEHOLDER_TEXT.SELECT_ARTICLE_MESSAGE}
        {APP_CONSTANTS.APP_NAME} is your platform for creating and managing wiki-style content with ease.
      </Text>
    </Card>
  );
};

export default WelcomePage;