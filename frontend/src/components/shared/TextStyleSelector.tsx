import React, { useState, useRef } from 'react';
import { ImagePlus, Loader2, Dices } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { Textarea } from './Textarea';
import { PRESET_STYLES } from '@/config/presetStyles';
import { presetStylesI18n } from '@/config/presetStylesI18n';
import { extractStyleFromImage } from '@/api/endpoints';

const AI_RANDOM_STYLE_VALUE = '[AI_GENERATE_STYLE]';

const i18n = {
  zh: {
    presetStyles: presetStylesI18n.zh,
    stylePlaceholder: '描述您想要的 PPT 风格，例如：简约商务风格，使用蓝色和白色配色，字体清晰大方...',
    presetStylesLabel: '快速选择预设风格：',
    styleTip: '提示：选择「AI 随机风格」让 AI 自动设计，或点击预设风格快速填充，也可以自定义描述',
    extractFromImage: '从图片提取风格',
    extracting: '提取中...',
    extractSuccess: '风格提取成功',
    extractFailed: '风格提取失败',
    aiRandomStyle: 'AI 随机风格',
    aiRandomStyleSelected: 'AI 随机风格已选择',
    aiRandomStyleDesc: '生成图片时，AI 将根据 PPT 内容自动设计独特的视觉风格',
    aiRandomStyleTooltip: '让 AI 根据您的 PPT 内容，自动设计一套独特的视觉风格。AI 会考虑主题特点，生成配色、材质、排版等完整的风格方案。',
  },
  en: {
    presetStyles: presetStylesI18n.en,
    stylePlaceholder: 'Describe your desired PPT style, e.g., minimalist business style...',
    presetStylesLabel: 'Quick select preset styles:',
    styleTip: 'Tip: Select "AI Random Style" for auto design, click presets to quick fill, or customize',
    extractFromImage: 'Extract from image',
    extracting: 'Extracting...',
    extractSuccess: 'Style extracted successfully',
    extractFailed: 'Style extraction failed',
    aiRandomStyle: 'AI Random Style',
    aiRandomStyleSelected: 'AI Random Style selected',
    aiRandomStyleDesc: 'AI will automatically design a unique visual style based on your PPT content',
    aiRandomStyleTooltip: 'Let AI design a unique visual style based on your PPT content, including color scheme, texture, layout, and more.',
  },
};

interface TextStyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onToast?: (msg: { message: string; type: 'success' | 'error' }) => void;
}

export const TextStyleSelector: React.FC<TextStyleSelectorProps> = ({ value, onChange, onToast }) => {
  const t = useT(i18n);
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);
  const [isExtractingStyle, setIsExtractingStyle] = useState(false);
  const styleImageInputRef = useRef<HTMLInputElement>(null);

  const isAiRandom = value === AI_RANDOM_STYLE_VALUE;

  return (
    <div className="space-y-3">
      {isAiRandom ? (
        <div className="p-4 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-3">
            <Dices className="w-6 h-6 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('aiRandomStyleSelected')}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {t('aiRandomStyleDesc')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Textarea
          placeholder={t('stylePlaceholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="text-sm border-2 border-gray-200 dark:border-border-primary dark:bg-background-tertiary dark:text-white dark:placeholder-foreground-tertiary focus:border-banana-400 dark:focus:border-banana transition-colors duration-200"
        />
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600 dark:text-foreground-tertiary">
          {t('presetStylesLabel')}
        </p>
        <div className="flex flex-wrap gap-2">
          {/* AI 随机风格按钮 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onChange(isAiRandom ? '' : AI_RANDOM_STYLE_VALUE)}
              onMouseEnter={() => setHoveredPresetId('ai-random')}
              onMouseLeave={() => setHoveredPresetId(null)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border-2 transition-all duration-200 hover:shadow-sm ${
                isAiRandom
                  ? 'border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-600 dark:border-purple-700 dark:hover:border-purple-500 dark:hover:bg-purple-900/20 dark:text-purple-400'
              }`}
            >
              <Dices size={12} />
              {t('aiRandomStyle')}
            </button>

            {hoveredPresetId === 'ai-random' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="bg-white dark:bg-background-secondary rounded-lg shadow-2xl dark:shadow-none border-2 border-purple-400 dark:border-purple-500 p-3 w-64">
                  <div className="flex items-center gap-2 mb-2">
                    <Dices className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('aiRandomStyle')}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-foreground-tertiary">
                    {t('aiRandomStyleTooltip')}
                  </p>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-3 h-3 bg-white dark:bg-background-secondary border-r-2 border-b-2 border-purple-400 dark:border-purple-500 transform rotate-45"></div>
                </div>
              </div>
            )}
          </div>

          {PRESET_STYLES.map((preset) => (
            <div key={preset.id} className="relative">
              <button
                type="button"
                onClick={() => onChange(t(preset.descriptionKey))}
                onMouseEnter={() => setHoveredPresetId(preset.id)}
                onMouseLeave={() => setHoveredPresetId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border-2 border-gray-200 dark:border-border-primary dark:text-foreground-secondary hover:border-banana-400 dark:hover:border-banana hover:bg-banana-50 dark:hover:bg-background-hover transition-all duration-200 hover:shadow-sm dark:hover:shadow-none"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
                  style={{ backgroundColor: preset.color }}
                />
                {t(preset.nameKey)}
              </button>

              {hoveredPresetId === preset.id && preset.previewImage && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="bg-white dark:bg-background-secondary rounded-lg shadow-2xl dark:shadow-none border-2 border-banana-400 dark:border-banana p-2.5 w-72">
                    <img
                      src={preset.previewImage}
                      alt={t(preset.nameKey)}
                      className="w-full h-40 object-cover rounded"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <p className="text-xs text-gray-600 dark:text-foreground-tertiary mt-2 px-1 line-clamp-3">
                      {t(preset.descriptionKey)}
                    </p>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="w-3 h-3 bg-white dark:bg-background-secondary border-r-2 border-b-2 border-banana-400 dark:border-banana transform rotate-45"></div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => styleImageInputRef.current?.click()}
            disabled={isExtractingStyle}
            className="px-3 py-1.5 text-xs font-medium rounded-full border-2 border-dashed border-gray-300 dark:border-border-primary dark:text-foreground-secondary hover:border-banana-400 dark:hover:border-banana hover:bg-banana-50 dark:hover:bg-background-hover transition-all duration-200 hover:shadow-sm dark:hover:shadow-none flex items-center gap-1"
          >
            {isExtractingStyle ? (
              <><Loader2 size={12} className="animate-spin" />{t('extracting')}</>
            ) : (
              <><ImagePlus size={12} />{t('extractFromImage')}</>
            )}
          </button>
          <input
            ref={styleImageInputRef}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = '';
              setIsExtractingStyle(true);
              try {
                const result = await extractStyleFromImage(file);
                if (result.data?.style_description) {
                  onChange(result.data.style_description);
                  onToast?.({ message: t('extractSuccess'), type: 'success' });
                }
              } catch (error: any) {
                onToast?.({ message: `${t('extractFailed')}: ${error?.message || ''}`, type: 'error' });
              } finally {
                setIsExtractingStyle(false);
              }
            }}
            className="hidden"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-foreground-tertiary">
        💡 {t('styleTip')}
      </p>
    </div>
  );
};
