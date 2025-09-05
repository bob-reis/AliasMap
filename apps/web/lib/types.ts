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
  kind: 
    | 'pattern' 
    | 'canonical' 
    | 'og:url' 
    | 'final_url' 
    | 'username-text'
    | 'validation_canonical'
    | 'validation_og_title'
    | 'validation_og_url'
    | 'validation_profile_image'
    | 'validation_schema'
    | 'validation_username_mentions'
    | 'validation_head_200'
    | 'validation_head_404'
    | 'validation_redirect_notfound'
    | 'validation_redirect_username'
    | 'validation_content_type'
    | 'validation_server'
    | 'validation_cache'
    | 'validation_json_api';
  value: string; // supporting evidence for classification
}

export interface SiteResult {
  id: string;
  status: 'found' | 'not_found' | 'inconclusive' | 'error';
  url: string;
  latencyMs: number;
  reason?: string;
  evidence?: Evidence[];
}
