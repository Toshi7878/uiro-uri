import { useHotkey } from '@tanstack/react-hotkeys'
import { useEffect, useMemo, useState } from 'react'
import { RubyText } from './ruby-text'
import { previewPlayer } from '@/features/preview/preview-store'
import { VideoSidebar } from '@/features/videos/video-sidebar'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { sections } from './uirouuri'
import type { Video } from '@/features/videos/server'
import type { ScriptSettings } from './settings'
import { useScriptSettings } from './settings-store'

/** 入力欄などでは、ここで扱わず本来の操作(文字入力・スイッチの切り替えなど)に任せる。 */
const isFormControl = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest('input, select, textarea, [role="switch"], [role="tab"]') !== null

/**
 * 行ボタンにフォーカスがあっても Space で次の行へ進めたいので、ボタンでの Space を除外する既定の動きはやめ、
 * 除外の判断と preventDefault は `isFormControl` を使ってコールバック側で行う。
 */
const HOTKEY_OPTIONS = { ignoreInputs: false, preventDefault: false, stopPropagation: false } as const

// 各段の先頭行の、全体での通し番号
const sectionOffsets = new Map<string, number>()
sections.reduce((offset, section) => {
  sectionOffsets.set(section.id, offset)
  return offset + section.phrases.length
}, 0)

/** 選択中の段を、朱の地に白文字ではっきり示す。 */
const ACTIVE_MENU_CLASS =
  'data-active:bg-sidebar-primary data-active:font-bold data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground'

export function ScriptPage({ videos, settings }: { videos: Video[]; settings: ScriptSettings }) {
  const { showFurigana, stealth, textSize, setShowFurigana, setStealth, setTextSize } = useScriptSettings(settings)
  const [activeSectionId, setActiveSectionId] = useState<string>('all')
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const visibleSections = useMemo(
    () =>
      activeSectionId === 'all'
        ? sections
        : sections.filter((section) => section.id === activeSectionId),
    [activeSectionId],
  )

  // 表示中の行の範囲(全体での通し番号)
  const firstIndex = sectionOffsets.get(visibleSections[0].id) ?? 0
  const lastSection = visibleSections[visibleSections.length - 1]
  const lastIndex = (sectionOffsets.get(lastSection.id) ?? 0) + lastSection.phrases.length - 1

  const selectSection = (id: string) => {
    setActiveSectionId(id)
    setActiveIndex(id === 'all' ? 0 : (sectionOffsets.get(id) ?? 0))
  }

  // Space / ↓ で次の行へ、Shift+Space / ↑ で前の行へ
  const moveActive = (step: 1 | -1) => (event: KeyboardEvent) => {
    if (isFormControl(event.target)) return
    event.preventDefault()
    setActiveIndex((current) => {
      const base = current ?? firstIndex - (step === 1 ? 1 : -1)
      return Math.min(lastIndex, Math.max(firstIndex, base + step))
    })
  }
  useHotkey('ArrowDown', moveActive(1), HOTKEY_OPTIONS)
  useHotkey('Space', moveActive(1), HOTKEY_OPTIONS)
  useHotkey('ArrowUp', moveActive(-1), HOTKEY_OPTIONS)
  useHotkey('Shift+Space', moveActive(-1), HOTKEY_OPTIONS)

  // フォーカス中の行ボタンが、Space を離したときにクリックされた扱いにならないようにする
  const suppressSpaceClick = (event: KeyboardEvent) => {
    if (!isFormControl(event.target)) event.preventDefault()
  }
  useHotkey('Space', suppressSpaceClick, { ...HOTKEY_OPTIONS, eventType: 'keyup' })
  useHotkey('Shift+Space', suppressSpaceClick, { ...HOTKEY_OPTIONS, eventType: 'keyup' })

  // 選択中の行を画面の中央に寄せる
  useEffect(() => {
    document
      .querySelector(`[data-phrase-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeIndex])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <Switch id="furigana" checked={showFurigana} onCheckedChange={setShowFurigana} />
              <Label htmlFor="furigana">ふりがな</Label>
            </div>
            <div className="flex items-center gap-2 px-2 py-1">
              <Switch id="stealth" checked={stealth} onCheckedChange={setStealth} />
              <Label htmlFor="stealth">ステルス</Label>
            </div>
            <div className="flex items-center gap-2 px-2 py-1">
              <Switch
                id="large-text"
                checked={textSize === 'large'}
                onCheckedChange={(checked) => setTextSize(checked ? 'large' : 'medium')}
              />
              <Label htmlFor="large-text">大きい文字</Label>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>段</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className={ACTIVE_MENU_CLASS}
                      isActive={activeSectionId === 'all'}
                      onClick={() => selectSection('all')}
                    >
                      全文
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {sections.map((section) => (
                    <SidebarMenuItem key={section.id}>
                      <SidebarMenuButton
                        className={ACTIVE_MENU_CLASS}
                        isActive={activeSectionId === section.id}
                        onClick={() => selectSection(section.id)}
                      >
                        {section.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="min-w-0">
          <div className="app" data-size={textSize}>
            {/* スマホ幅では左サイドバーが Sheet になる。どこまでスクロールしていても開けるよう、画面の左上に固定する */}
            <SidebarTrigger variant="outline" className="fixed top-3 left-3 z-40 bg-background md:hidden" />
            <div className="script">
              {visibleSections.map((section) => (
                <section key={section.id} className="act">
                  <h2>{section.title}</h2>
                  <ol className="phrases">
                    {section.phrases.map((phrase, indexInSection) => {
                      const index = (sectionOffsets.get(section.id) ?? 0) + indexInSection
                      return (
                        <li key={`${section.id}-${index}`}>
                          <button
                            type="button"
                            className={activeIndex === index ? 'phrase is-active' : 'phrase'}
                            data-phrase-index={index}
                            data-size={textSize}
                            onClick={() => {
                              setActiveIndex(index)
                              // プレビュー中の動画があれば、その行の時刻から再生する(一時停止中なら再開)
                              previewPlayer.seekToLine(index)
                            }}
                          >
                            <span className="index">{index + 1}</span>
                            <span className={stealth ? 'text is-stealth' : 'text'}>
                              <RubyText text={phrase.text} showFurigana={showFurigana} />
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              ))}
            </div>
          </div>
        </SidebarInset>

        <VideoSidebar videos={videos} selectedLine={activeIndex} />
      </SidebarProvider>
    </TooltipProvider>
  )
}

