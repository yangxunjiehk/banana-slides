import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const zh = i18n.language?.startsWith('zh');
  const [page, setPage] = useState<'start' | 'features'>('start');
  const steps = zh ? [
    ['输入想法或大纲', '描述主题和需求，或粘贴已有的标题与要点。'],
    ['检查内容并生成', '确认大纲和页面描述，选择风格后生成幻灯片。'],
    ['修改并导出', '在预览中描述修改要求，满意后导出 PPTX 或 PDF。'],
  ] : [
    ['Start with an idea or outline', 'Describe your topic, or paste your slide titles and key points.'],
    ['Review and generate', 'Review your outline and descriptions, choose a style, and generate slides.'],
    ['Edit and export', 'Describe changes in the preview, then export as PPTX or PDF.'],
  ];
  const features = zh ? [
    ['两种创作方式', '从一句话或已有大纲开始，生成前可以检查并修改内容。'],
    ['自然语言修改', '描述修改要求，AI 参考原图生成新版本，历史版本可以找回。'],
    ['参考素材', '添加参考文件或图片，帮助表达内容与风格。'],
    ['导出', '支持导出 PPTX 或 PDF；导出后请检查文字和页面比例。'],
  ] : [
    ['Two ways to start', 'Start with an idea or an outline, and review your content before generating.'],
    ['Edit in natural language', 'Describe your changes and generate a new image; previous versions remain available.'],
    ['Reference material', 'Add reference files or images to help express your content and style.'],
    ['Export', 'Export as PPTX or PDF; review the text and aspect ratio after export.'],
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={zh ? '使用帮助' : 'Help'} size="lg">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold tracking-wide text-banana-600 dark:text-banana">TOYCLOUDHK · AI PPT</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground-primary">
            {zh ? '用 AI 制作 PPT' : 'Create PPTs with AI'}
          </h2>
        </div>
        <div className="flex gap-2" role="tablist" aria-label={zh ? '帮助内容' : 'Help sections'}>
          {(['start', 'features'] as const).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={page === item}
              onClick={() => setPage(item)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${page === item ? 'bg-banana-500 text-black' : 'bg-gray-100 text-gray-700 dark:bg-background-elevated dark:text-foreground-secondary'}`}>
              {item === 'start' ? (zh ? '快速开始' : 'Quick start') : (zh ? '功能介绍' : 'Features')}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {(page === 'start' ? steps : features).map(([title, description], index) => (
            <div key={title} className="flex gap-3 rounded-xl border border-gray-200 p-4 dark:border-border-primary">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-banana-100 text-sm font-semibold text-gray-900">{index + 1}</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-foreground-primary">{title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-foreground-tertiary">{description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end"><Button variant="ghost" onClick={onClose}>{zh ? '关闭' : 'Close'}</Button></div>
      </div>
    </Modal>
  );
};
