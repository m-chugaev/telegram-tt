import type { FC, TeactNode } from '../../../lib/teact/teact';
import React, { memo, useMemo, useRef } from '../../../lib/teact/teact';

import type { ApiFormattedText } from '../../../api/types/messages';
import type { MenuItemContextAction } from '../../ui/ListItem';

import { FOLDER_EMOTICONS_TO_ICON } from '../../../config';
import buildClassName from '../../../util/buildClassName';
import { MouseButton } from '../../../util/windowEnvironment';
import { renderTextWithEntities } from '../../common/helpers/renderTextWithEntities';

import useContextMenuHandlers from '../../../hooks/useContextMenuHandlers';
import { useFastClick } from '../../../hooks/useFastClick';
import useLastCallback from '../../../hooks/useLastCallback';

import Icon from '../../common/icons/Icon';
import Menu from '../../ui/Menu';
import MenuItem from '../../ui/MenuItem';
import MenuSeparator from '../../ui/MenuSeparator';

import styles from './Tab.module.scss';

interface OwnProps {
  title: ApiFormattedText;
  emoticon?: string;
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
    isActive && styles.active,
  );

  // eslint-disable-next-line no-null/no-null
  const tabRef = useRef<HTMLDivElement>(null);

  const {
    contextMenuAnchor, handleContextMenu, handleBeforeContextMenu, handleContextMenuClose,
    handleContextMenuHide, isContextMenuOpen,
  } = useContextMenuHandlers(tabRef, !contextActions);

  const { handleClick, handleMouseDown } = useFastClick((e: React.MouseEvent<HTMLDivElement>) => {
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

  const getFirstEmoji = (array: TeactNode[]) => {
    return array.find((item) => typeof item === 'object');
  };

  const getFirstText = (array: TeactNode[]) => {
    return array.find((item) => typeof item === 'string');
  };

  const renderedTitle = useMemo(() => {
    return renderTextWithEntities({
      text: title.text,
      entities: title.entities,
      emojiSize: 32,
    });
  }, [title]);

  const renderIcon = useMemo(() => {
    if (emoticon) {
      // If we got a custom emoji
      if (title.entities && title.entities.length > 0) {
        return getFirstEmoji(renderedTitle);
      }

      // If we got a folder emoji
      const iconName = FOLDER_EMOTICONS_TO_ICON[emoticon] ?? '';

      if (iconName) {
        return <i className={`icon icon-${iconName}`} aria-hidden="true" role="img" />;
      }
    }

    // If we got an emoji inside the title
    if (renderedTitle.length > 1) {
      return renderedTitle.find((item) => typeof item !== 'string');
    }

    // If we got a simple emoji
    if (emoticon) {
      return <span>{ emoticon }</span>;
    }

    return <i className="icon icon-folder-badge" aria-hidden="true" role="img" />;
  }, [emoticon, renderedTitle, title]);

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
        {renderIcon}
      </div>
      <span className={styles.title}>
        {getFirstText(renderedTitle)}
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
