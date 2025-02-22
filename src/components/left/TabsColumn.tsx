import type { FC } from '../../lib/teact/teact';
import React, { memo, useEffect, useMemo } from '../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../global';

import type { ApiChatFolder, ApiChatlistExportedInvite } from '../../api/types';
import type { MenuItemContextAction } from '../ui/ListItem';
import type { TabItem } from './tabs/TabsList';
import { LeftColumnContent, SettingsScreens } from '../../types';

import { ALL_FOLDER_ID } from '../../config';
import { selectCanShareFolder, selectTabState } from '../../global/selectors';
import { selectCurrentLimit } from '../../global/selectors/limits';
import buildClassName from '../../util/buildClassName';
import { MEMO_EMPTY_ARRAY } from '../../util/memo';

import { useFolderManagerForUnreadCounters } from '../../hooks/useFolderManager';
import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';

import TabsHeader from './tabs/TabsHeader';
import TabsList from './tabs/TabsList';

import styles from './TabsColumn.module.scss';

type OwnProps = {
  forceDarkTheme?: boolean;
};

type StateProps = {
  chatFoldersById: Record<number, ApiChatFolder>;
  folderInvitesById: Record<number, ApiChatlistExportedInvite[]>;
  orderedFolderIds?: number[];
  activeChatFolder: number;
  currentUserId?: string;
  shouldSkipHistoryAnimations?: boolean;
  maxFolders: number;
  maxChatLists: number;
  maxFolderInvites: number;
  hasArchivedChats?: boolean;
  hasArchivedStories?: boolean;
  isStoryRibbonShown?: boolean;
};

const TabsColumn: FC<OwnProps & StateProps> = ({
  chatFoldersById,
  folderInvitesById,
  orderedFolderIds,
  activeChatFolder,
  maxFolders,
  maxChatLists,
  maxFolderInvites,
  forceDarkTheme,
}) => {
  const {
    loadChatFolders,
    setActiveChatFolder,
    openShareChatFolderModal,
    openDeleteChatFolderModal,
    openEditChatFolder,
    openLimitReachedModal,
    requestNextSettingsScreen,
    requestNextContentScreen,
  } = getActions();

  useEffect(() => {
    loadChatFolders();
  }, []);

  const lang = useLang();

  const handleSwitchTab = useLastCallback((index: number) => {
    setActiveChatFolder({ activeChatFolder: index }, { forceOnHeavyAnimation: true });
  });

  const allChatsFolder: ApiChatFolder = {
    id: ALL_FOLDER_ID,
    title: { text: lang('FilterAllChats') },
    emoticon: '💬',
    includedChatIds: MEMO_EMPTY_ARRAY,
    excludedChatIds: MEMO_EMPTY_ARRAY,
  } satisfies ApiChatFolder;

  const displayedFolders = useMemo(() => {
    return orderedFolderIds
      ? orderedFolderIds.map((id) => {
        if (id === ALL_FOLDER_ID) {
          return allChatsFolder;
        }

        return chatFoldersById[id] || {};
      }).filter(Boolean)
      : undefined;
  }, [chatFoldersById, allChatsFolder, orderedFolderIds]);

  const folderCountersById = useFolderManagerForUnreadCounters();
  const folderTabs = useMemo(() => {
    if (!displayedFolders || !displayedFolders.length) {
      return undefined;
    }

    return displayedFolders.map((folder, i) => {
      const { id, title } = folder;
      const isBlocked = id !== ALL_FOLDER_ID && i > maxFolders - 1;
      const canShareFolder = selectCanShareFolder(getGlobal(), id);
      const contextActions: MenuItemContextAction[] = [];

      if (canShareFolder) {
        contextActions.push({
          title: lang('FilterShare'),
          icon: 'link',
          handler: () => {
            const chatListCount = Object.values(chatFoldersById).reduce((acc, el) => acc + (el.isChatList ? 1 : 0), 0);
            if (chatListCount >= maxChatLists && !folder.isChatList) {
              openLimitReachedModal({
                limit: 'chatlistJoined',
              });
              return;
            }

            // Greater amount can be after premium downgrade
            if (folderInvitesById[id]?.length >= maxFolderInvites) {
              openLimitReachedModal({
                limit: 'chatlistInvites',
              });
              return;
            }

            openShareChatFolderModal({
              folderId: id,
            });
          },
        });
      }

      if (id === ALL_FOLDER_ID) {
        contextActions.push({
          title: lang('FilterEditAll'),
          icon: 'edit',
          handler: () => {
            requestNextSettingsScreen({ screen: SettingsScreens.Folders });
          },
        });
      } else {
        contextActions.push({
          title: lang('FilterEdit'),
          icon: 'edit',
          handler: () => {
            openEditChatFolder({ folderId: id });
          },
        });

        contextActions.push({
          title: lang('FilterDelete'),
          icon: 'delete',
          destructive: true,
          handler: () => {
            openDeleteChatFolderModal({ folderId: id });
          },
        });
      }

      return {
        id,
        title,
        emoticon: folder.emoticon,
        badgeCount: folderCountersById[id]?.chatsCount,
        isBadgeActive: Boolean(folderCountersById[id]?.notificationsCount),
        isBlocked,
        contextActions: contextActions?.length ? contextActions : undefined,
      } satisfies TabItem;
    });
  }, [
    displayedFolders, maxFolders, folderCountersById, lang, chatFoldersById, maxChatLists, folderInvitesById,
    maxFolderInvites,
  ]);

  const handleSelectArchived = useLastCallback(() => {
    requestNextContentScreen({ screen: LeftColumnContent.Archived });
  });

  const handleSelectContacts = useLastCallback(() => {
    requestNextContentScreen({ screen: LeftColumnContent.Contacts });
  });

  const handleSelectSettings = useLastCallback(() => {
    requestNextContentScreen({ screen: LeftColumnContent.Settings });
  });

  return (
    <div className={buildClassName(styles.wrapper, forceDarkTheme && styles.dark)} id="TabsColumn">
      <TabsHeader
        onSelectArchived={handleSelectArchived}
        onSelectContacts={handleSelectContacts}
        onSelectSettings={handleSelectSettings}
      />

      <TabsList
        tabs={folderTabs || []}
        activeTab={activeChatFolder}
        onSwitchTab={handleSwitchTab}
        contextRootElementSelector="#TabsColumn"
      />
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const {
      chatFolders: {
        byId: chatFoldersById,
        orderedIds: orderedFolderIds,
        invites: folderInvitesById,
      },
      chats: {
        listIds: {
          archived,
        },
      },
      stories: {
        orderedPeerIds: {
          archived: archivedStories,
        },
      },
      currentUserId,
    } = global;
    const { shouldSkipHistoryAnimations, activeChatFolder } = selectTabState(global);
    const { storyViewer: { isRibbonShown: isStoryRibbonShown } } = selectTabState(global);

    return {
      chatFoldersById,
      folderInvitesById,
      orderedFolderIds,
      activeChatFolder,
      currentUserId,
      shouldSkipHistoryAnimations,
      hasArchivedChats: Boolean(archived?.length),
      hasArchivedStories: Boolean(archivedStories?.length),
      maxFolders: selectCurrentLimit(global, 'dialogFilters'),
      maxFolderInvites: selectCurrentLimit(global, 'chatlistInvites'),
      maxChatLists: selectCurrentLimit(global, 'chatlistJoined'),
      isStoryRibbonShown,
    };
  },
)(TabsColumn));
