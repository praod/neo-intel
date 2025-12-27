const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN')!
const APIFY_API_BASE = 'https://api.apify.com/v2'

export interface ApifyRunOptions {
  actorId: string
  input: Record<string, any>
  webhookUrl?: string
}

export async function startApifyRun(options: ApifyRunOptions): Promise<string> {
  const { actorId, input, webhookUrl } = options

  const response = await fetch(`${APIFY_API_BASE}/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${APIFY_API_TOKEN}`,
    },
    body: JSON.stringify({
      ...input,
      webhooks: webhookUrl
        ? [
            {
              eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
              requestUrl: webhookUrl,
            },
          ]
        : undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Apify API error: ${error}`)
  }

  const data = await response.json()
  return data.data.id
}

export async function getApifyRunStatus(runId: string): Promise<any> {
  const response = await fetch(`${APIFY_API_BASE}/actor-runs/${runId}`, {
    headers: {
      Authorization: `Bearer ${APIFY_API_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get run status: ${response.statusText}`)
  }

  return response.json()
}

export async function getApifyDatasetItems(runId: string): Promise<any[]> {
  const run = await getApifyRunStatus(runId)
  const datasetId = run.data.defaultDatasetId

  if (!datasetId) {
    return []
  }

  const response = await fetch(
    `${APIFY_API_BASE}/datasets/${datasetId}/items`,
    {
      headers: {
        Authorization: `Bearer ${APIFY_API_TOKEN}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get dataset items: ${response.statusText}`)
  }

  return response.json()
}

