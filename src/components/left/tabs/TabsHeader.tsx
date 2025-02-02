import type { FC } from '../../../lib/teact/teact';
import React, { memo, useMemo } from '../../../lib/teact/teact';

import buildClassName from '../../../util/buildClassName';
import useOldLang from '../../../hooks/useOldLang';
import useFlag from '../../../hooks/useFlag';
import { APP_NAME } from '../../../config';

import Button from '../../ui/Button';
import DropdownMenu from '../../ui/DropdownMenu';

import styles from './TabsHeader.module.scss';
import LeftSideMenuItems from '../main/LeftSideMenuItems';
import useAppLayout from '../../../hooks/useAppLayout';

interface OwnProps {
  searchQuery?: string;
  onReset: () => void;
  onSelectArchived: NoneToVoidFunction;
  onSelectContacts: NoneToVoidFunction;
  onSelectSettings: NoneToVoidFunction;
}

const TabsHeader: FC<OwnProps> = ({
  onReset,
  onSelectArchived,
  onSelectContacts,
  onSelectSettings,
}) => {
  const oldLang = useOldLang();
  const [isBotMenuOpen, markBotMenuOpen, unmarkBotMenuOpen] = useFlag();
  const { isMobile } = useAppLayout();

  const MainButton: FC<{ onTrigger: () => void; isOpen?: boolean }> = useMemo(() => {
    return ({ onTrigger, isOpen }) => (
      <Button
        round
        size="smaller"
        color="translucent"
        className={isOpen ? 'active' : ''}
        onClick={onTrigger}
        ariaLabel={oldLang('AccDescrOpenMenu2')}
      >
        <div className={buildClassName(
          'animated-menu-icon',
        )}
        />
      </Button>
    );
  }, [isMobile, oldLang, onReset]);

  return (
    <div className={styles.wrapper}>
      <DropdownMenu
        trigger={MainButton}
        footer={`${APP_NAME} ${APP_VERSION}`}
        className={buildClassName(
          'main-menu',
          oldLang.isRtl && 'rtl',
        )}
        forceOpen={isBotMenuOpen}
      >
        <LeftSideMenuItems
          onSelectArchived={onSelectArchived}
          onSelectContacts={onSelectContacts}
          onSelectSettings={onSelectSettings}
          onBotMenuOpened={markBotMenuOpen}
          onBotMenuClosed={unmarkBotMenuOpen}
        />
      </DropdownMenu>
    </div>
  );
};

export default memo(TabsHeader); 