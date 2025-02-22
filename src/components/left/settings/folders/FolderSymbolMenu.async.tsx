import type { FC } from '../../../../lib/teact/teact';
import React from '../../../../lib/teact/teact';

import type { OwnProps } from './FolderSymbolMenu';

import { Bundles } from '../../../../util/moduleLoader';

import useModuleLoader from '../../../../hooks/useModuleLoader';

const FolderSymbolMenuAsync: FC<OwnProps> = (props) => {
  const { isOpen } = props;
  const FolderSymbolMenu = useModuleLoader(Bundles.Extra, 'FolderSymbolMenu', !isOpen);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return FolderSymbolMenu ? <FolderSymbolMenu {...props} /> : undefined;
};

export default FolderSymbolMenuAsync;
