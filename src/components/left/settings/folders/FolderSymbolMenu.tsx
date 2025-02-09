import type { FC } from '../../../../lib/teact/teact';
import React, {
  memo, useCallback, useEffect,
  useState,
} from '../../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../../global';

import type { ApiSticker } from '../../../../api/types';

import { selectIsContextMenuTranslucent } from '../../../../global/selectors';

import useFlag from '../../../../hooks/useFlag';

import Menu from '../../../ui/Menu';
import Portal from '../../../ui/Portal';

import styles from './FolderSymbolMenu.module.scss';
import EmojiPicker from '../../../middle/composer/EmojiPicker';
import CustomEmojiPicker from '../../../common/CustomEmojiPicker';
import SymbolMenuFooter, { SymbolMenuTabs } from '../../../middle/composer/SymbolMenuFooter';
import Transition from '../../../ui/Transition';

export type OwnProps = {
  isOpen: boolean;
  onEmojiSelect: (emoji: string) => void;
  onCustomEmojiSelect: (emoji: ApiSticker) => void;
  onRemoveSymbol: () => void;
  onClose: () => void;
};

interface StateProps {
  areFeaturedStickersLoaded?: boolean;
  isTranslucent?: boolean;
}

const FolderSymbolMenu: FC<OwnProps & StateProps> = ({
  isOpen,
  areFeaturedStickersLoaded,
  isTranslucent,
  onEmojiSelect,
  onCustomEmojiSelect,
  onRemoveSymbol,
  onClose,
}) => {
  const { loadFeaturedEmojiStickers } = getActions();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [isContextMenuShown, markContextMenuShown, unmarkContextMenuShown] = useFlag();

  useEffect(() => {
    if (isOpen && !areFeaturedStickersLoaded) {
      loadFeaturedEmojiStickers();
    }
  }, [areFeaturedStickersLoaded, isOpen, loadFeaturedEmojiStickers]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  }, [onClose, onEmojiSelect]);

  const handleCustomEmojiSelect = useCallback((emoji: ApiSticker) => {
    onCustomEmojiSelect(emoji);
    onClose();
  }, [onClose, onCustomEmojiSelect]);

  function renderContent() {
    switch (activeTab) {
      case SymbolMenuTabs.Emoji:
        return (
          <EmojiPicker
            className="picker-tab"
            onEmojiSelect={handleEmojiSelect}
            hideRecentEmojis
            showFolderEmojis
            withSearch
          />
        );
      case SymbolMenuTabs.CustomEmoji:
        return (
          <CustomEmojiPicker
            idPrefix="folder-emoji-set-"
            loadAndPlay={isOpen}
            isHidden={!isOpen}
            isTranslucent={isTranslucent}
            onContextMenuOpen={markContextMenuShown}
            onContextMenuClose={unmarkContextMenuShown}
            onCustomEmojiSelect={handleCustomEmojiSelect}
            onContextMenuClick={onClose}
          />
        );
    }

    return undefined;
  }

  function stopPropagation(event: any) {
    event.stopPropagation();
  }

  return (
    <Portal>
      <Menu
        isOpen={isOpen}
        noCompact
        bubbleClassName={styles.menuContent}
        onClose={onClose}
        noCloseOnBackdrop={isContextMenuShown}
      >
        <div className="SymbolMenu-main" onClick={stopPropagation}>
          <Transition
            name="slide"
            activeKey={activeTab}
            renderCount={2}
          >
            {renderContent}
          </Transition>
        </div>
        <SymbolMenuFooter
          activeTab={activeTab}
          onSwitchTab={setActiveTab}
          onRemoveSymbol={onRemoveSymbol}
          onSearchOpen={() => {}}
          canSearch
          isAttachmentModal
          canSendPlainText
        />
      </Menu>
    </Portal>
  );
};

export default memo(withGlobal<OwnProps>((global): StateProps => {
  return {
    areFeaturedStickersLoaded: Boolean(global.customEmojis.featuredIds?.length),
    isTranslucent: selectIsContextMenuTranslucent(global),
  };
})(FolderSymbolMenu));
