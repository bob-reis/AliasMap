import type { SiteSpec } from './types';

// Curated subset for initial implementation. Mirrors docs/sites.core.yaml intent.
export const CORE_SITES: SiteSpec[] = [
  {
    id: 'github',
    tier: 'fundamental',
    norm: { caseSensitive: false, allowed: '[A-Za-z0-9-]{1,39}' },
    profile: {
      url: 'https://github.com/{username}',
      successPatterns: [
        'Followers',
        'Following',
        'rel="canonical".*github.com/{username}'
      ],
      notFoundPatterns: ['Not Found'],
      timeoutMs: 3500
    },
    recovery: { enabled: true, risk: 'green', endpoint: 'https://github.com/password_reset', method: 'GET' }
  },
  {
    id: 'telegram',
    tier: 'fundamental',
    profile: {
      url: 'https://t.me/{username}',
      successPatterns: ['t.me/{username}'],
      notFoundPatterns: ['If you have Telegram, you can contact'],
      timeoutMs: 3000
    },
    recovery: { enabled: false, risk: 'red' }
  },
  {
    id: 'linkedin',
    tier: 'fundamental',
    profile: {
      url: 'https://www.linkedin.com/in/{username}',
      successPatterns: ['LinkedIn', 'in/{username}'],
      notFoundPatterns: [
        "This page doesn’t exist",
        'A página não existe',
        'Profile Not Found',
        'Page not found'
      ],
      timeoutMs: 3500
    },
    recovery: { enabled: false, risk: 'red' }
  },
  {
    id: 'gitlab',
    tier: 'fundamental',
    profile: {
      url: 'https://gitlab.com/{username}',
      successPatterns: ['rel="canonical".*gitlab.com/{username}'],
      notFoundPatterns: ['404'],
      timeoutMs: 3500
    },
    recovery: { enabled: true, risk: 'green', endpoint: 'https://gitlab.com/users/password/new', method: 'GET' }
  },
  {
    id: 'reddit',
    tier: 'fundamental',
    profile: {
      url: 'https://www.reddit.com/user/{username}',
      successPatterns: ['u/{username}', 'rel="canonical".*reddit.com/user/{username}'],
      notFoundPatterns: ['page not found', 'Sorry, nobody on Reddit goes by that name.'],
      timeoutMs: 3500
    },
    recovery: { enabled: true, risk: 'green', endpoint: 'https://www.reddit.com/password', method: 'GET' }
  },
  {
    id: 'twitter',
    tier: 'fundamental',
    norm: { caseSensitive: false, allowed: '[a-z0-9_]{1,15}' },
    profile: {
      url: 'https://x.com/{username}',
      successPatterns: ['Followers', 'Following', 'Tweets', 'rel="canonical".*x.com/{username}', 'Account suspended'],
      notFoundPatterns: ['This account doesn’t exist', 'Try searching for another'],
      timeoutMs: 3500
    },
    recovery: { enabled: true, risk: 'amber', endpoint: 'https://x.com/account/begin_password_reset', method: 'GET' }
  },
  {
    id: 'instagram',
    tier: 'fundamental',
    profile: {
      url: 'https://www.instagram.com/{username}/',
      successPatterns: ['property="og:url"', 'instagram.com/{username}'],
      notFoundPatterns: [
        "Sorry, this page isn't available.",
        'Esta página não está disponível'
      ],
      timeoutMs: 3500
    },
    recovery: { enabled: true, risk: 'amber', endpoint: 'https://www.instagram.com/accounts/password/reset/', method: 'GET' }
  },
  {
    id: 'youtube',
    tier: 'fundamental',
    profile: {
      url: 'https://www.youtube.com/@{username}',
      successPatterns: ['Subscribe', 'link rel="canonical".*youtube.com/@{username}'],
      notFoundPatterns: ['This page isn’t available'],
      timeoutMs: 3500
    },
    recovery: { enabled: false, risk: 'amber' }
  },
  {
    id: 'tiktok',
    tier: 'fundamental',
    profile: {
      url: 'https://www.tiktok.com/@{username}',
      successPatterns: ['Following', 'Followers', 'rel="canonical".*tiktok.com/@{username}'],
      notFoundPatterns: ["Couldn't find this account"],
      timeoutMs: 3500
    },
    recovery: { enabled: true, risk: 'amber', endpoint: 'https://www.tiktok.com/login/phone-or-email/email', method: 'GET' }
  },
  {
    id: 'steam',
    tier: 'fundamental',
    profile: {
      url: 'https://steamcommunity.com/id/{username}',
      successPatterns: [
        'Steam Community',
        'rel="canonical".*steamcommunity.com/id/{username}'
      ],
      notFoundPatterns: [
        'The specified profile could not be found',
        'No match',
        'was not found'
      ],
      timeoutMs: 3500
    },
    recovery: { enabled: false, risk: 'red' }
  },
  {
    id: 'flipboard',
    tier: 'fundamental',
    profile: {
      url: 'https://flipboard.com/@{username}',
      successPatterns: [
        'Flipboard',
        'rel="canonical".*flipboard.com/@{username}',
        '@{username}'
      ],
      notFoundPatterns: [
        'Not Found',
        'Page not found',
        "We couldn't find"
      ],
      timeoutMs: 3500
    },
    recovery: { enabled: false, risk: 'amber' }
  },
  {
    id: 'twitch',
    tier: 'fundamental',
    profile: {
      url: 'https://www.twitch.tv/{username}',
      successPatterns: ['Followers', 'rel="canonical".*twitch.tv/{username}'],
      notFoundPatterns: ['Sorry. Unless you’ve got a time machine'],
      timeoutMs: 3500
    },
    recovery: { enabled: true, risk: 'amber', endpoint: 'https://www.twitch.tv/settings/security', method: 'GET' }
  },
  {
    id: 'keybase',
    tier: 'fundamental',
    profile: {
      url: 'https://keybase.io/{username}',
      successPatterns: ['Keybase', 'proving'],
      notFoundPatterns: ["Sorry, we couldn't find"],
      timeoutMs: 3000
    },
    recovery: { enabled: true, risk: 'amber', endpoint: 'https://keybase.io/#password', method: 'GET' }
  },
  {
    id: 'hackernews',
    tier: 'fundamental',
    profile: {
      url: 'https://news.ycombinator.com/user?id={username}',
      successPatterns: ['user:', 'created:'],
      notFoundPatterns: ['No such user'],
      timeoutMs: 3000
    },
    recovery: { enabled: false, risk: 'red' }
  },
  {
    id: 'stackoverflow',
    tier: 'fundamental',
    profile: {
      url: 'https://stackoverflow.com/users/{username}',
      successPatterns: ['Stack Overflow', 'Profile'],
      notFoundPatterns: ['Page not found'],
      timeoutMs: 3500
    },
    recovery: { enabled: true, risk: 'amber', endpoint: 'https://stackoverflow.com/users/account-recovery', method: 'GET' }
  },

  // Additional high-value platforms from infoooze with tailored heuristics
  {
    id: 'pinterest',
    tier: 'core',
    profile: {
      url: 'https://pinterest.com/{username}',
      successPatterns: ['rel="canonical".*pinterest.com/{username}'],
      notFoundPatterns: ['Page not found', 'User not found'],
      timeoutMs: 3500
    },
    recovery: { enabled: false, risk: 'amber' }
  },
  {
    id: 'medium',
    tier: 'core',
    profile: {
      url: 'https://medium.com/@{username}',
      successPatterns: ['rel="canonical".*medium.com/@{username}'],
      notFoundPatterns: ['Username available', '404', 'Page not found'],
      timeoutMs: 3500
    },
    recovery: { enabled: false, risk: 'amber' }
  },
  {
    id: 'slideshare',
    tier: 'core',
    profile: {
      url: 'https://slideshare.net/{username}',
      successPatterns: ['rel="canonical".*slideshare.net/{username}'],
      notFoundPatterns: ['Username available'],
      timeoutMs: 3500
    },
    recovery: { enabled: false, risk: 'amber' }
  },
  {
    id: 'gravatar',
    tier: 'core',
    profile: {
      url: 'https://en.gravatar.com/{username}',
      successPatterns: ['rel="canonical".*gravatar.com/{username}'],
      notFoundPatterns: ['not found', '404'],
      timeoutMs: 3500
    },
    recovery: { enabled: false, risk: 'amber' }
  },
  {
    id: 'ello',
    tier: 'core',
    profile: {
      url: 'https://ello.co/{username}',
      successPatterns: ['rel="canonical".*ello.co/{username}'],
      notFoundPatterns: ['404', 'Page not found'],
      timeoutMs: 3500
    },
    recovery: { enabled: false, risk: 'amber' }
  },
  {
    id: 'tripadvisor',
    tier: 'core',
    profile: {
      url: 'https://www.tripadvisor.com/members/{username}',
      successPatterns: ['rel="canonical".*tripadvisor.com/Profile/{username}', 'Profile/{username}'],
      notFoundPatterns: ['This page isn\u2019t available', 'Page not found', 'doesn\u2019t exist'],
      timeoutMs: 4000
    },
    recovery: { enabled: false, risk: 'amber' }
  },

];
