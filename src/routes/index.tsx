import { createFileRoute } from '@tanstack/react-router'
import { ScriptPage } from '@/features/script/script-page'
import { getVideos } from '@/features/videos/server'

export const Route = createFileRoute('/')({
  loader: () => getVideos(),
  component: Home,
})

function Home() {
  return <ScriptPage videos={Route.useLoaderData()} />
}
