import type { FC } from '../../../lib/teact/teact';
import React, { memo } from '../../../lib/teact/teact';

import type { ApiFormattedText } from '../../../api/types/messages';
import type { MenuItemContextAction } from '../../ui/ListItem';

import Tab from './Tab';

import styles from './TabsList.module.scss';

export interface TabItem {
  id: number;
  title: ApiFormattedText;
  emoticon?: string;
  badgeCount?: number;
  isBlocked?: boolean;
  isBadgeActive?: boolean;
  contextActions?: MenuItemContextAction[];
}

interface OwnProps {
  tabs: readonly TabItem[];
  activeTab?: number;
  onSwitchTab: (id: number) => void;
  contextRootElementSelector?: string;
}

const TabsList: FC<OwnProps> = ({
  tabs, activeTab, onSwitchTab, contextRootElementSelector,
}) => {
  return (
    <div className={styles.wrapper} role="tablist">
      {tabs.map((tab, i) => (
        <Tab
          key={tab.id}
          title={tab.title}
          emoticon={tab.emoticon}
          isActive={i === activeTab}
          isBlocked={tab.isBlocked}
          badgeCount={tab.badgeCount}
          isBadgeActive={tab.isBadgeActive}
          onClick={onSwitchTab}
          clickArg={i}
          contextActions={tab.contextActions}
          contextRootElementSelector={contextRootElementSelector}
        />
      ))}
    </div>
  );
};

export default memo(TabsList);
