import React from 'react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { i18n } = useTranslation();
  const attribution = i18n.language?.startsWith('zh')
    ? '基于 Banana Slides · AGPL-3.0'
    : 'Based on Banana Slides · AGPL-3.0';

  return (
    <footer className="relative w-full py-6 px-4 mt-auto text-center text-xs text-gray-500 dark:text-foreground-tertiary">
      <span className="font-medium">TOYCLOUDHK · AI PPT</span>
      <span className="mx-2" aria-hidden="true">·</span>
      <span>{attribution}</span>
    </footer>
  );
};
