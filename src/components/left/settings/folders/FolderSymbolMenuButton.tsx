import type { FC, TeactNode } from '../../../../lib/teact/teact';
import React, { memo, useMemo } from '../../../../lib/teact/teact';

import type { ApiFormattedText, ApiSticker } from '../../../../api/types';
import { FOLDER_EMOTICONS_TO_ICON } from '../../../../config';
import Button from '../../../ui/Button';
import { renderTextWithEntities } from '../../../common/helpers/renderTextWithEntities';
import FolderSymbolMenu from './FolderSymbolMenu';
import styles from './FolderSymbolMenuButton.module.scss';

type OwnProps = {
  isSymbolMenuOpen: boolean;
  openSymbolMenu: VoidFunction;
  closeSymbolMenu: VoidFunction;
  onCustomEmojiSelect: (emoji: ApiSticker) => void;
  onRemoveSymbol: VoidFunction;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  selectedEmoji: string;
  title: ApiFormattedText;
};

const FolderSymbolMenuButton: FC<OwnProps> = ({
  isSymbolMenuOpen,
  openSymbolMenu,
  closeSymbolMenu,
  onCustomEmojiSelect,
  onRemoveSymbol,
  onEmojiSelect,
  className,
  selectedEmoji,
  title,
}) => {
  const getFirstEmoji = (array: TeactNode[]) => {
    return array.find((item) => typeof item === 'object');
  };

  const renderedTitle = useMemo(() => {
    return renderTextWithEntities({
      text: title.text,
      entities: title.entities,
      emojiSize: 32,
    });
  }, [title]);

  const renderEmoji = useMemo(() => {
    if (selectedEmoji) {
      // If we got a custom emoji
      if (title.entities && title.entities.length > 0) {
        return getFirstEmoji(renderedTitle);
      }

      const iconName = FOLDER_EMOTICONS_TO_ICON[selectedEmoji] ?? '';

      // If we got a folder emoji
      if (iconName) {
        return <i className={`icon icon-${iconName}`} aria-hidden="true" role="img" />;
      }

      // If we got a simple emoji
      return <span>{ selectedEmoji }</span>;
    }

    // If we got an emoji inside the title
    if (renderedTitle.length > 1) {
      return renderedTitle.find((item) => typeof item !== 'string');
    }

    return <i className="icon icon-folder-badge" aria-hidden="true" role="img" />;
  }, [selectedEmoji, renderedTitle, title]);

  return (
    <div className={className}>
      <Button
        className={styles.button}
        color="translucent-graphite"
        onClick={isSymbolMenuOpen ? closeSymbolMenu : openSymbolMenu}
        ariaLabel="Choose emoji, sticker or GIF"
      >
        {renderEmoji}
      </Button>

      <FolderSymbolMenu
        isOpen={isSymbolMenuOpen}
        onEmojiSelect={onEmojiSelect}
        onCustomEmojiSelect={onCustomEmojiSelect}
        onRemoveSymbol={onRemoveSymbol}
        onClose={closeSymbolMenu}
      />
    </div>
  );
};

export default memo(FolderSymbolMenuButton);
