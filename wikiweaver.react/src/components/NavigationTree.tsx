import React from 'react';
import { Tree } from 'antd';
import type { NavigationNodeDto } from '../shared/types/ApiTypes';
import { convertToTreeData } from '../utils/navigationHelper';
import { useNavigate } from 'react-router-dom';
import styles from './NavigationTree.module.css';

interface NavigationTreeProps {
    navigationTree?: NavigationNodeDto[];
}

const NavigationTree: React.FC<NavigationTreeProps> = ({ navigationTree }) => {
    const navigate = useNavigate();

    const handleTreeSelect = (selectedKeys: React.Key[]) => {
        const key = selectedKeys[0] as string;
        if (key.startsWith('article-')) {
            const articleId = key.split('article-')[1];
            navigate(`/article/${articleId}`);
        }
    };

    const treeData = navigationTree ? convertToTreeData(navigationTree) : [];

    return (
        <div className={styles.navigationTreeContainer}>
            <Tree
                className={styles.treeContainer}
                treeData={treeData}
                onSelect={handleTreeSelect}
                defaultExpandAll
            />
        </div>
    );
};

export default NavigationTree;