export type Tier = 'fundamental' | 'core' | 'optional' | 'all';

export interface SiteNorm {
  caseSensitive?: boolean;
  allowed?: string; // regex string
}

export interface SiteProfileSpec {
  url: string; // template with {username}
  successPatterns: string[];
  notFoundPatterns?: string[];
  timeoutMs?: number;
}

export interface SiteSpec {
  id: string;
  tier: Tier;
  norm?: SiteNorm;
  profile: SiteProfileSpec;
  recovery?: {
    enabled: boolean;
    risk: 'green' | 'amber' | 'red';
    endpoint?: string;
    method?: 'GET' | 'POST';
    parsePatterns?: string[];
    notes?: string;
  };
}

export interface Evidence {
  kind: 'pattern' | 'canonical' | 'og:url' | 'final_url' | 'username-text';
  value: string; // supporting evidence for classification
}

export interface SiteResult {
  id: string;
  status: 'found' | 'not_found' | 'inconclusive' | 'error';
  url: string;
  latencyMs: number;
  reason?: string;
  evidence?: Evidence[];
  metadata?: { image?: string; title?: string; description?: string };
}
