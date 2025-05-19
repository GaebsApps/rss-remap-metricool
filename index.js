const express = require('express');
const Parser = require('rss-parser');
const RSS = require('rss');

const app = express();
const parser = new Parser();

const SOURCE_FEED = 'https://nachrichtenaustausch.ch/rss-details/feed-name/4-shift/feed-accesskey/78966adce166fdac8ba2b9249ac0becd/rss.xml';

let cache = '';
let lastUpdated = 0;

app.get('/', async (req, res) => {
  const now = Date.now();
  if (cache && (now - lastUpdated < 1000 * 60 * 10)) {
    res.set('Content-Type', 'application/rss+xml');
    return res.send(cache);
  }

  try {
    const feed = await parser.parseURL(SOURCE_FEED);

    const newFeed = new RSS({
      title: feed.title || 'Remapped Feed',
      description: feed.description || '',
      feed_url: 'https://yourdomain.com/',
      site_url: 'https://yourdomain.com/',
      language: 'en',
    });

    feed.items.forEach(item => {
      newFeed.item({
        title: item.title,
        description: item.contentSnippet || item.content || item.description || '',
        url: item.link,
        guid: item.guid || item.link,
        date: new Date(item.pubDate || item.isoDate)
      });
    });

    const xml = newFeed.xml({ indent: true });
    cache = xml;
    lastUpdated = now;

    res.set('Content-Type', 'application/rss+xml');
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Feed error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Remap app running on port ${PORT}`);
});
