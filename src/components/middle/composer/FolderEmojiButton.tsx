import type { FC } from '../../../lib/teact/teact';
import React, { memo } from '../../../lib/teact/teact';

import { FOLDER_EMOTICONS_TO_ICON } from '../../../config';
import buildClassName from '../../../util/buildClassName';

import useLastCallback from '../../../hooks/useLastCallback';

import './FolderEmojiButton.scss';

type OwnProps = {
  emoji: Emoji;
  focus?: boolean;
  onClick: (emoji: string, name: string) => void;
};

const FolderEmojiButton: FC<OwnProps> = ({
  emoji, focus, onClick,
}) => {
  const handleClick = useLastCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Preventing safari from losing focus on SettingsFoldersEdit InputText
    e.preventDefault();

    onClick(emoji.native, emoji.id);
  });

  const className = buildClassName(
    'FolderEmojiButton',
    focus && 'focus',
  );

  const iconName = FOLDER_EMOTICONS_TO_ICON[emoji.native];

  return (
    <div
      className={className}
      onMouseDown={handleClick}
      title={`:${emoji.names[0]}:`}
    >
      <i className={`icon icon-${iconName}`} aria-hidden="true" role="img" />
    </div>
  );
};

export default memo(FolderEmojiButton);
