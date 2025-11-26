export interface UrlExpansionResponse {
  'Original URL': string
  'Full Link': string
  'All Possible Redirections': string[]
  error?: string
  details?: string[]
}

export interface UrlExpansionResult {
  originalUrl: string
  fullLink: string
  redirections: string[]
  fetchedAt: number
}

export async function fetchExpandedUrl(shortUrl: string): Promise<UrlExpansionResult> {
  const response = await fetch(`/extract?url=${encodeURIComponent(shortUrl)}`);
  const data: UrlExpansionResponse = await response.json();

  if (!response.ok || data.error) {
    const details = data.details?.join(' | ');
    const message = details ? `${data.error}: ${details}` : data.error ?? 'Failed to expand the URL';
    throw new Error(message);
  }

  return {
    originalUrl: data['Original URL'] ?? shortUrl,
    fullLink: data['Full Link'],
    redirections: data['All Possible Redirections'] ?? [],
    fetchedAt: Date.now(),
  };
}
