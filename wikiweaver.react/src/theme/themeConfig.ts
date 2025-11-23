import { theme } from 'antd';

export const customTheme = {
  token: {
    colorBgContainer: '#ffffff', // White background for containers
    colorBgLayout: '#ffffff',    // White background for layouts
    colorBgElevated: '#ffffff',  // White background for elevated components
    colorBgSpotlight: '#ffffff', // White background for spotlight elements
    colorText: 'rgba(0, 0, 0, 0.87)', // Dark text
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)', // Secondary dark text
    colorPrimary: '#1890ff',     // Keep the primary color
    colorPrimaryBg: '#e6f7ff',   // Light blue background for primary buttons
  },
  components: {
    Layout: {
      headerBg: '#ffffff',  // White background specifically for header
      siderBg: '#ffffff',   // White background for sider
    },
    Button: {
      colorBgContainer: '#ffffff', // White background for default buttons
      colorText: 'rgba(0, 0, 0, 0.87)', // Dark text on buttons
      colorBgTextHover: 'rgba(0, 0, 0, 0.06)', // Light hover effect for text buttons
    },
    Tree: {
      colorBgContainer: '#ffffff', // White background for tree component
    },
  },
};