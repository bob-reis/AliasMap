export function canonicalPlatformIdFromUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const host = u.host.toLowerCase();
    const base = host.startsWith('www.') ? host.slice(4) : host;
    const ends = (h: string) => base.endsWith(h);
    if (ends('reddit.com')) return 'reddit';
    if (ends('x.com') || ends('twitter.com')) return 'twitter';
    if (ends('instagram.com')) return 'instagram';
    if (ends('facebook.com')) return 'facebook';
    if (ends('youtube.com') || ends('youtu.be')) return 'youtube';
    if (ends('vimeo.com')) return 'vimeo';
    if (ends('github.com')) return 'github';
    if (ends('google.com') || ends('plus.google.com')) return 'google-plus';
    if (ends('pinterest.com')) return 'pinterest';
    if (ends('flickr.com')) return 'flickr';
    if (ends('vk.com')) return 'vk';
    if (ends('about.me')) return 'aboutme';
    if (ends('disqus.com')) return 'disqus';
    if (ends('bitbucket.org')) return 'bitbucket';
    if (ends('flipboard.com')) return 'flipboard';
    if (ends('medium.com')) return 'medium';
    if (ends('hackerone.com')) return 'hackerone';
    if (ends('keybase.io')) return 'keybase';
    if (ends('buzzfeed.com')) return 'buzzfeed';
    if (ends('slideshare.net')) return 'slideshare';
    if (ends('mixcloud.com')) return 'mixcloud';
    if (ends('soundcloud.com')) return 'soundcloud';
    if (ends('badoo.com')) return 'badoo';
    if (ends('imgur.com')) return 'imgur';
    if (ends('open.spotify.com') || ends('spotify.com')) return 'spotify';
    if (ends('pastebin.com')) return 'pastebin';
    if (ends('wattpad.com')) return 'wattpad';
    if (ends('canva.com')) return 'canva';
    if (ends('codecademy.com')) return 'codecademy';
    if (ends('last.fm')) return 'lastfm';
    if (ends('blip.fm')) return 'blipfm';
    if (ends('dribbble.com')) return 'dribbble';
    if (ends('gravatar.com')) return 'gravatar';
    if (ends('foursquare.com')) return 'foursquare';
    if (ends('creativemarket.com')) return 'creativemarket';
    if (ends('ello.co')) return 'ello';
    if (ends('cash.me')) return 'cashapp';
    if (ends('angel.co')) return 'angel';
    if (ends('500px.com')) return '500px';
    if (ends('houzz.com')) return 'houzz';
    if (ends('tripadvisor.com')) return 'tripadvisor';
    if (ends('kongregate.com')) return 'kongregate';
    if (ends('blogspot.com')) return 'blogspot';
    if (ends('tumblr.com')) return 'tumblr';
    if (ends('wordpress.com')) return 'wordpress';
    if (ends('devianart.com') || ends('deviantart.com')) return 'deviantart';
    if (ends('slack.com')) return 'slack';
    if (ends('livejournal.com')) return 'livejournal';
    if (ends('newgrounds.com')) return 'newgrounds';
    if (ends('hubpages.com')) return 'hubpages';
    if (ends('contently.com')) return 'contently';
    if (ends('steamcommunity.com')) return 'steam';
    if (ends('wikipedia.org')) return 'wikipedia';
    if (ends('freelancer.com')) return 'freelancer';
    if (ends('dailymotion.com')) return 'dailymotion';
    if (ends('etsy.com')) return 'etsy';
    if (ends('scribd.com')) return 'scribd';
    if (ends('patreon.com')) return 'patreon';
    if (ends('behance.net')) return 'behance';
    if (ends('goodreads.com')) return 'goodreads';
    if (ends('gumroad.com')) return 'gumroad';
    if (ends('instructables.com')) return 'instructables';
    if (ends('codementor.io')) return 'codementor';
    if (ends('reverbnation.com')) return 'reverbnation';
    if (ends('designspiration.net')) return 'designspiration';
    if (ends('bandcamp.com')) return 'bandcamp';
    if (ends('colourlovers.com')) return 'colourlovers';
    if (ends('ifttt.com')) return 'ifttt';
    if (ends('trakt.tv')) return 'trakt';
    if (ends('okcupid.com')) return 'okcupid';
    if (ends('skyscanner.com')) return 'skyscanner';
    if (ends('zone-h.org')) return 'zone-h';
    return base;
  } catch {
    return rawUrl;
  }
}

export function platformLabel(id: string): string {
  const map: Record<string, string> = {
    reddit: 'Reddit',
    twitter: 'Twitter',
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    github: 'GitHub',
    'google-plus': 'Google+',
    pinterest: 'Pinterest',
    flickr: 'Flickr',
    vk: 'VK',
    aboutme: 'About.me',
    disqus: 'Disqus',
    bitbucket: 'Bitbucket',
    flipboard: 'Flipboard',
    medium: 'Medium',
    hackerone: 'HackerOne',
    keybase: 'Keybase',
    buzzfeed: 'BuzzFeed',
    slideshare: 'SlideShare',
    mixcloud: 'Mixcloud',
    soundcloud: 'SoundCloud',
    badoo: 'Badoo',
    imgur: 'Imgur',
    spotify: 'Spotify',
    pastebin: 'Pastebin',
    wattpad: 'Wattpad',
    canva: 'Canva',
    codecademy: 'Codecademy',
    lastfm: 'Last.fm',
    blipfm: 'Blip.fm',
    dribbble: 'Dribbble',
    gravatar: 'Gravatar',
    foursquare: 'Foursquare',
    creativemarket: 'Creative Market',
    ello: 'Ello',
    cashapp: 'Cash App',
    angel: 'AngelList',
    '500px': '500px',
    houzz: 'Houzz',
    tripadvisor: 'Tripadvisor',
    kongregate: 'Kongregate',
    blogspot: 'Blogspot',
    tumblr: 'Tumblr',
    wordpress: 'WordPress',
    deviantart: 'DeviantArt',
    slack: 'Slack',
    livejournal: 'LiveJournal',
    newgrounds: 'Newgrounds',
    hubpages: 'HubPages',
    contently: 'Contently',
    steam: 'Steam',
    wikipedia: 'Wikipedia',
    freelancer: 'Freelancer',
    dailymotion: 'Dailymotion',
    etsy: 'Etsy',
    scribd: 'Scribd',
    patreon: 'Patreon',
    behance: 'Behance',
    goodreads: 'Goodreads',
    gumroad: 'Gumroad',
    instructables: 'Instructables',
    codementor: 'Codementor',
    reverbnation: 'ReverbNation',
    designspiration: 'Designspiration',
    bandcamp: 'Bandcamp',
    colourlovers: 'COLOURlovers',
    ifttt: 'IFTTT',
    trakt: 'Trakt',
    okcupid: 'OkCupid',
    skyscanner: 'Skyscanner',
    'zone-h': 'Zone-H',
    telegram: 'Telegram',
    linkedin: 'LinkedIn',
    gitlab: 'GitLab',
    tiktok: 'TikTok',
    twitch: 'Twitch',
    hackernews: 'Hacker News',
    stackoverflow: 'Stack Overflow',
  };
  return map[id] || (id.charAt(0).toUpperCase() + id.slice(1));
}

