import { BadRequestException } from '@nestjs/common';
export function normalizeYouTubeUrl(value?: string | null): {
  url: string | null;
  id: string | null;
} {
  if (value === undefined) return { url: null, id: null };
  if (value === null || value.trim() === '') return { url: null, id: null };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('Introduction video URL must be a valid YouTube URL');
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let id = '';
  if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] ?? '';
  else if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v') ?? '';
    else {
      const match = url.pathname.match(/^\/(embed|shorts)\/([^/?#]+)/);
      id = match?.[2] ?? '';
    }
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(id))
    throw new BadRequestException('Unsupported or invalid YouTube video URL');
  return { url: `https://www.youtube.com/watch?v=${id}`, id };
}
