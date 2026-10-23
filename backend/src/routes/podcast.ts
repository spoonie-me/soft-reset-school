// @ts-nocheck
import { Router, Request, Response } from 'express';
import prisma from '../lib/db';

const router = Router();

const PODCAST_TITLE = process.env.PODCAST_TITLE || 'Bedcoders Podcast';
const PODCAST_DESC = process.env.PODCAST_DESCRIPTION || 'Coding from bed, with AI.';
const PODCAST_IMAGE = process.env.PODCAST_IMAGE || 'https://bedcoders.com/podcast-cover.jpg';
const PODCAST_AUTHOR = process.env.PODCAST_AUTHOR || 'Roi Shternin';
const PODCAST_EMAIL = process.env.PODCAST_EMAIL || 'hi@softreset.school';
const SITE_URL = process.env.SITE_URL || 'https://bedcoders.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// GET /podcast.xml — RSS feed for podcast
router.get('/', async (req: Request, res: Response) => {
  try {
    const episodes = await prisma.blogPost.findMany({
      where: {
        status: 'published',
        podcastPublished: true,
        audioUrl: { not: null },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    const now = new Date().toUTCString();
    const feedUrl = `${SITE_URL}/podcast.xml`;

    const items = episodes.map((ep) => {
      const pubDate = ep.publishedAt ? new Date(ep.publishedAt).toUTCString() : now;
      const epUrl = `${SITE_URL}/blog/${ep.slug}`;
      const duration = ep.podcastDuration
        ? `${Math.floor(ep.podcastDuration / 60)}:${String(ep.podcastDuration % 60).padStart(2, '0')}`
        : '10:00';

      return `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <link>${epUrl}</link>
      <guid isPermaLink="true">${epUrl}</guid>
      <description>${escapeXml(ep.excerpt || ep.title)}</description>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${ep.audioUrl}" type="audio/mpeg" length="0"/>
      <itunes:title>${escapeXml(ep.title)}</itunes:title>
      <itunes:summary>${escapeXml(ep.excerpt || ep.title)}</itunes:summary>
      <itunes:duration>${duration}</itunes:duration>
      <itunes:episodeType>full</itunes:episodeType>
      ${ep.podcastEpNum ? `<itunes:episode>${ep.podcastEpNum}</itunes:episode>` : ''}
    </item>`;
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(PODCAST_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(PODCAST_DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <itunes:author>${escapeXml(PODCAST_AUTHOR)}</itunes:author>
    <itunes:email>${PODCAST_EMAIL}</itunes:email>
    <itunes:owner>
      <itunes:name>${escapeXml(PODCAST_AUTHOR)}</itunes:name>
      <itunes:email>${PODCAST_EMAIL}</itunes:email>
    </itunes:owner>
    <itunes:image href="${PODCAST_IMAGE}"/>
    <image>
      <url>${PODCAST_IMAGE}</url>
      <title>${escapeXml(PODCAST_TITLE)}</title>
      <link>${SITE_URL}</link>
    </image>
    <itunes:category text="Technology"/>
    <itunes:category text="Education">
      <itunes:category text="How To"/>
    </itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(rss);
  } catch (error) {
    console.error('Error generating podcast RSS:', error);
    res.status(500).send('Failed to generate feed');
  }
});

export default router;
