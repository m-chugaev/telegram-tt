import type { FC } from '../../../lib/teact/teact';
import React, {
  memo, useEffect, useRef, useState,
} from '../../../lib/teact/teact';

import type { ObserveFn } from '../../../hooks/useIntersectionObserver';

import {
  EMOJI_SIZE_PICKER, FOLDER_SYMBOL_SET_ID, RECENT_SYMBOL_SET_ID, SEARCH_SYMBOL_SET_ID,
} from '../../../config';
import buildClassName from '../../../util/buildClassName';
import windowSize from '../../../util/windowSize';
import { REM } from '../../common/helpers/mediaDimensions';

import useAppLayout from '../../../hooks/useAppLayout';
import { useOnIntersect } from '../../../hooks/useIntersectionObserver';
import useMediaTransitionDeprecated from '../../../hooks/useMediaTransitionDeprecated';
import useOldLang from '../../../hooks/useOldLang';

import EmojiButton from './EmojiButton';
import FolderEmojiButton from './FolderEmojiButton';

const EMOJIS_PER_ROW_ON_DESKTOP = 8;
const EMOJI_MARGIN = 0.625 * REM;
const EMOJI_VERTICAL_MARGIN = 0.25 * REM;
const EMOJI_VERTICAL_MARGIN_MOBILE = 0.5 * REM;
const MOBILE_CONTAINER_PADDING = 0.5 * REM;

type OwnProps = {
  category: EmojiCategory;
  index: number;
  allEmojis: AllEmojis;
  observeIntersection: ObserveFn;
  shouldRender: boolean;
  onEmojiSelect: (emoji: string, name: string) => void;
  containerWidth?: number;
};

const EmojiCategory: FC<OwnProps> = ({
  category, index, allEmojis, observeIntersection, shouldRender, onEmojiSelect, containerWidth,
}) => {
  // eslint-disable-next-line no-null/no-null
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState('auto');

  useOnIntersect(ref, observeIntersection);

  const transitionClassNames = useMediaTransitionDeprecated(shouldRender);

  const lang = useOldLang();
  const { isMobile } = useAppLayout() || { isMobile: true };

  useEffect(() => {
    const baseWidth = containerWidth ?? windowSize.get().width;

    const emojisPerRow = isMobile
      ? Math.floor(
        (baseWidth - MOBILE_CONTAINER_PADDING + EMOJI_MARGIN) / (EMOJI_SIZE_PICKER + EMOJI_MARGIN),
      )
      : EMOJIS_PER_ROW_ON_DESKTOP;

    const newHeight = Math.ceil(category.emojis.length / emojisPerRow)
      * (EMOJI_SIZE_PICKER + (isMobile ? EMOJI_VERTICAL_MARGIN_MOBILE : EMOJI_VERTICAL_MARGIN));

    if (category.id === SEARCH_SYMBOL_SET_ID) {
      setHeight('auto');
    } else {
      setHeight(`${newHeight}px`);
    }
  }, [containerWidth, category.emojis.length, category.id, isMobile]);

  return (
    <div
      ref={ref}
      key={category.id}
      id={`emoji-category-${index}`}
      className="symbol-set"
    >
      {category.name && (
        <div className="symbol-set-header">
          <p className="symbol-set-name" dir="auto">
            {lang(category.id === RECENT_SYMBOL_SET_ID ? 'RecentStickers' : `Emoji${index}`)}
          </p>
        </div>
      )}
      <div
        className={buildClassName('symbol-set-container', transitionClassNames)}
        style={`height: ${height};`}
        dir={lang.isRtl ? 'rtl' : undefined}
      >
        {shouldRender && category.emojis.map((name) => {
          const emoji = allEmojis[name];
          // Recent emojis may contain emoticons that are no longer in the list
          if (!emoji) {
            return undefined;
          }
          // Some emojis have multiple skins and are represented as an Object with emojis for all skins.
          // For now, we select only the first emoji with 'neutral' skin.
          const displayedEmoji = 'id' in emoji ? emoji : emoji[1];

          if (category.id === FOLDER_SYMBOL_SET_ID) {
            return (
              <FolderEmojiButton
                key={displayedEmoji.id}
                emoji={displayedEmoji}
                onClick={onEmojiSelect}
              />
            );
          }

          return (
            <EmojiButton
              key={displayedEmoji.id}
              emoji={displayedEmoji}
              onClick={onEmojiSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

export default memo(EmojiCategory);
