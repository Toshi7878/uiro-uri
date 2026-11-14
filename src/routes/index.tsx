import { createFileRoute } from '@tanstack/react-router'
import { ScriptPage } from '@/features/script/script-page'
import { getScriptSettings } from '@/features/script/settings-fns'
import { getVideos } from '@/features/videos/server'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [videos, settings] = await Promise.all([getVideos(), getScriptSettings()])
    return { videos, settings }
  },
  component: Home,
})

function Home() {
  const { videos, settings } = Route.useLoaderData()
  return <ScriptPage videos={videos} settings={settings} />
}
