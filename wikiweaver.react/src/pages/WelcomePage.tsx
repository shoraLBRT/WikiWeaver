import React from 'react';
import { Typography, Card } from 'antd';
import { locale } from '../localization';
import styles from './WelcomePage.module.css';

const { Title, Text } = Typography;

const WelcomePage: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <Card className={styles.welcomeCard}>
        <Title level={2}>{locale.welcomePage.title}</Title>
        <Text>
          {locale.welcomePage.selectArticleMessage} {locale.app.name} — {locale.app.description}.
        </Text>
      </Card>
    </div>
  );
};

export default WelcomePage;
