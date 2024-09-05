import { useState, useEffect } from 'react'
import { CanvasClient } from '@dscvr-one/canvas-client-sdk'

export function useCanvas() {
  const [canvasClient, setCanvasClient] = useState<CanvasClient | null>(null)
  const [user, setUser] = useState<{ id: string; username: string; avatar?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initCanvas = async () => {
      if (window.self !== window.top) {
        const client = new CanvasClient()
        try {
          const response = await client.ready()
          if (response) {
            setCanvasClient(client)
            setUser(response.untrusted.user || null)
          }
        } catch (error) {
          console.error('Error initializing Canvas:', error)
        }
      }
      setIsLoading(false)
    }

    initCanvas()
  }, [])

  return { canvasClient, user, isLoading }
}
