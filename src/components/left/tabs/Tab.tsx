import useContextMenuHandlers from '../../../hooks/useContextMenuHandlers';
import { useFastClick } from '../../../hooks/useFastClick';
import useLastCallback from '../../../hooks/useLastCallback';
import type { FC, TeactNode } from '../../../lib/teact/teact';
import React, { memo, useRef } from '../../../lib/teact/teact';
import buildClassName from '../../../util/buildClassName';
import { MouseButton } from '../../../util/windowEnvironment';
import renderText from '../../common/helpers/renderText';
import Icon from '../../common/icons/Icon';
import { MenuItemContextAction } from '../../ui/ListItem';
import Menu from '../../ui/Menu';
import MenuItem from '../../ui/MenuItem';
import MenuSeparator from '../../ui/MenuSeparator';

import styles from './Tab.module.scss';

interface OwnProps {
  title: TeactNode;
  emoticon: string;
  isActive?: boolean;
  isBlocked?: boolean;
  badgeCount?: number;
  isBadgeActive?: boolean;
  onClick?: (arg: number) => void;
  clickArg?: number;
  contextActions?: MenuItemContextAction[];
  contextRootElementSelector?: string;
}

const Tab: FC<OwnProps> = ({
  title,
  emoticon,
  isActive,
  isBlocked,
  badgeCount,
  isBadgeActive,
  onClick,
  clickArg,
  contextActions,
  contextRootElementSelector,
}) => {
  const className = buildClassName(
    styles.tab,
    isActive && styles.active
  );

  // eslint-disable-next-line no-null/no-null
  const tabRef = useRef<HTMLDivElement>(null);

  const {
    contextMenuAnchor, handleContextMenu, handleBeforeContextMenu, handleContextMenuClose,
    handleContextMenuHide, isContextMenuOpen,
  } = useContextMenuHandlers(tabRef, !contextActions);

  const { handleClick, handleMouseDown } = useFastClick((e: React.MouseEvent<HTMLDivElement>) => {
    console.log('click', contextActions, (e.button === MouseButton.Secondary || !onClick), e.button, onClick, MouseButton.Secondary, MouseButton.Main);
    if (contextActions && (e.button === MouseButton.Secondary || !onClick)) {
      handleBeforeContextMenu(e);
    }

    if (e.type === 'mousedown' && e.button !== MouseButton.Main) {
      return;
    }

    onClick?.(clickArg!);
  });

  const getTriggerElement = useLastCallback(() => tabRef.current);
  const getRootElement = useLastCallback(
    () => (contextRootElementSelector ? tabRef.current!.closest(contextRootElementSelector) : document.body),
  );
  const getMenuElement = useLastCallback(
    () => document.querySelector('#portals')!.querySelector(`.${styles.contextMenu} .bubble`),
  );
  const getLayout = useLastCallback(() => ({ withPortal: true }));

  // TODO: Add emoticon matchmap
  // TODO: Think about long titles with emojis (need to rewrite toString() for TeactNode)

  return (
    <div
      ref={tabRef}
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      className={className}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
    >
      <div className={styles.icon}>
        {emoticon.length > 2 ? (
          <i className={'icon icon-' + emoticon} aria-hidden="true" role="img" />
        ) : (
          <span>{ emoticon }</span>
        )}
      </div>
      <span className={styles.title}>
        {typeof title === 'string' ? renderText(title) : title}
      </span>
      {Boolean(badgeCount) && (
        <span className={buildClassName(styles.badge, isBadgeActive && styles.badgeActive)}>{badgeCount}</span>
      )}
      {isBlocked && <Icon name="lock-badge" className={styles.blocked} />}

      {contextActions && contextMenuAnchor !== undefined && (
        <Menu
          isOpen={isContextMenuOpen}
          anchor={contextMenuAnchor}
          getTriggerElement={getTriggerElement}
          getRootElement={getRootElement}
          getMenuElement={getMenuElement}
          getLayout={getLayout}
          className={styles.contextMenu}
          autoClose
          onClose={handleContextMenuClose}
          onCloseAnimationEnd={handleContextMenuHide}
          withPortal
        >
          {contextActions.map((action) => (
            ('isSeparator' in action) ? (
              <MenuSeparator key={action.key || 'separator'} />
            ) : (
              <MenuItem
                key={action.title}
                icon={action.icon}
                destructive={action.destructive}
                disabled={!action.handler}
                onClick={action.handler}
              >
                {action.title}
              </MenuItem>
            )
          ))}
        </Menu>
      )}
    </div>
  );
};

export default memo(Tab); 