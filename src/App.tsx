import { useEffect, useMemo, useState } from 'react'
import { RubyText } from './components/RubyText'
import { Label } from './components/ui/label'
import { Switch } from './components/ui/switch'
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
} from './components/ui/sidebar'
import { TooltipProvider } from './components/ui/tooltip'
import { sections } from './data/uirouuri'

const FURIGANA_KEY = 'show-furigana'
const STEALTH_KEY = 'stealth-mode'

function loadFlag(key: string, fallback: boolean): boolean {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value === 'true'
  } catch {
    return fallback
  }
}

// 各段の先頭行の、全体での通し番号
const sectionOffsets = new Map<string, number>()
sections.reduce((offset, section) => {
  sectionOffsets.set(section.id, offset)
  return offset + section.phrases.length
}, 0)

/** 選択中の段を、朱の地に白文字ではっきり示す。 */
const ACTIVE_MENU_CLASS =
  'data-active:bg-sidebar-primary data-active:font-bold data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground'

function App() {
  const [showFurigana, setShowFurigana] = useState(() => loadFlag(FURIGANA_KEY, true))
  const [stealth, setStealth] = useState(() => loadFlag(STEALTH_KEY, false))
  const [activeSectionId, setActiveSectionId] = useState<string>('all')
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const visibleSections = useMemo(
    () =>
      activeSectionId === 'all'
        ? sections
        : sections.filter((section) => section.id === activeSectionId),
    [activeSectionId],
  )

  useEffect(() => {
    try {
      localStorage.setItem(FURIGANA_KEY, String(showFurigana))
    } catch {
      // 保存できなくても動作には影響しない
    }
  }, [showFurigana])

  useEffect(() => {
    try {
      localStorage.setItem(STEALTH_KEY, String(stealth))
    } catch {
      // 保存できなくても動作には影響しない
    }
  }, [stealth])

  // 表示中の行の範囲(全体での通し番号)
  const firstIndex = sectionOffsets.get(visibleSections[0].id) ?? 0
  const lastSection = visibleSections[visibleSections.length - 1]
  const lastIndex = (sectionOffsets.get(lastSection.id) ?? 0) + lastSection.phrases.length - 1

  const selectSection = (id: string) => {
    setActiveSectionId(id)
    setActiveIndex(id === 'all' ? 0 : (sectionOffsets.get(id) ?? 0))
  }

  // Space / ↓ で次の行へ、Shift+Space / ↑ で前の行へ
  useEffect(() => {
    const direction = (event: KeyboardEvent): 1 | -1 | null => {
      if (event.ctrlKey || event.metaKey || event.altKey) return null
      if (event.key === 'ArrowDown') return 1
      if (event.key === 'ArrowUp') return -1
      if (event.key === ' ') return event.shiftKey ? -1 : 1
      return null
    }
    const isFormControl = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.closest('input, select, textarea, [role="switch"], [role="tab"]') !== null)

    const onKeyDown = (event: KeyboardEvent) => {
      const step = direction(event)
      if (step === null || isFormControl(event.target)) return
      event.preventDefault()
      setActiveIndex((current) => {
        const base = current ?? firstIndex - (step === 1 ? 1 : -1)
        return Math.min(lastIndex, Math.max(firstIndex, base + step))
      })
    }
    // フォーカス中の行ボタンが Space で押された扱いにならないようにする
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ' && !isFormControl(event.target)) event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [firstIndex, lastIndex])

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

        <SidebarInset>
          <div className="app">
            <SidebarTrigger className="md:hidden" />
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
                            onClick={() => setActiveIndex(index)}
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
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default App
