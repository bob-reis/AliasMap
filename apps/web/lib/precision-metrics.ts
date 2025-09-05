import type { SiteResult } from './types';

export interface PrecisionMetrics {
  totalScanned: number;
  found: number;
  notFound: number;
  inconclusive: number;
  errors: number;
  precisionScore: number; // 0-1, higher = better precision
  inconclusiveRate: number; // 0-1, lower = better
  averageConfidence: number; // from validation engine
  qualityScore: number; // overall quality metric
}

export interface SiteMetrics {
  siteId: string;
  attempts: number;
  successes: number;
  inconclusive: number;
  averageLatency: number;
  reliabilityScore: number; // 0-1
  lastUpdated: Date;
}

/**
 * Sistema de métricas para monitorar e melhorar a precisão das detecções
 */
export class PrecisionTracker {
  private siteMetrics = new Map<string, SiteMetrics>();
  private scanHistory: Array<{
    timestamp: Date;
    username: string;
    results: SiteResult[];
    metrics: PrecisionMetrics;
  }> = [];

  /**
   * Calcula métricas de precisão para um conjunto de resultados
   */
  calculateMetrics(results: SiteResult[]): PrecisionMetrics {
    const total = results.length;
    const found = results.filter(r => r.status === 'found').length;
    const notFound = results.filter(r => r.status === 'not_found').length;
    const inconclusive = results.filter(r => r.status === 'inconclusive').length;
    const errors = results.filter(r => r.status === 'error').length;

    // Precision score: quanto dos resultados são definitivos (não inconclusivos)
    const definitiveResults = found + notFound;
    const precisionScore = total > 0 ? definitiveResults / total : 0;

    // Taxa de inconclusivos (queremos minimizar)
    const inconclusiveRate = total > 0 ? inconclusive / total : 0;

    // Confiança média (se disponível dos resultados de validação)
    const confidenceScores = results
      .filter(r => r.evidence?.some(e => e.kind.startsWith('validation_')))
      .length;
    const averageConfidence = confidenceScores / total;

    // Score geral de qualidade
    const qualityScore = this.calculateQualityScore(precisionScore, inconclusiveRate, averageConfidence);

    return {
      totalScanned: total,
      found,
      notFound,
      inconclusive,
      errors,
      precisionScore,
      inconclusiveRate,
      averageConfidence,
      qualityScore
    };
  }

  /**
   * Atualiza métricas por site
   */
  updateSiteMetrics(siteId: string, result: SiteResult): void {
    const existing = this.siteMetrics.get(siteId) || {
      siteId,
      attempts: 0,
      successes: 0,
      inconclusive: 0,
      averageLatency: 0,
      reliabilityScore: 0,
      lastUpdated: new Date()
    };

    existing.attempts++;
    existing.lastUpdated = new Date();

    if (result.status === 'found' || result.status === 'not_found') {
      existing.successes++;
    } else if (result.status === 'inconclusive') {
      existing.inconclusive++;
    }

    // Atualiza latência média
    if (result.latencyMs) {
      existing.averageLatency = (existing.averageLatency + result.latencyMs) / 2;
    }

    // Calcula score de confiabilidade
    existing.reliabilityScore = existing.attempts > 0 
      ? existing.successes / existing.attempts 
      : 0;

    this.siteMetrics.set(siteId, existing);
  }

  /**
   * Registra scan completo para histórico
   */
  recordScan(username: string, results: SiteResult[]): void {
    const metrics = this.calculateMetrics(results);
    
    this.scanHistory.push({
      timestamp: new Date(),
      username,
      results,
      metrics
    });

    // Mantém apenas últimos 100 scans para não consumir muita memória
    if (this.scanHistory.length > 100) {
      this.scanHistory.shift();
    }

    // Atualiza métricas individuais dos sites
    results.forEach(result => this.updateSiteMetrics(result.id, result));
  }

  /**
   * Retorna sites com maior taxa de inconclusivos
   */
  getProblematicSites(minAttempts = 5): SiteMetrics[] {
    return Array.from(this.siteMetrics.values())
      .filter(m => m.attempts >= minAttempts)
      .filter(m => (m.inconclusive / m.attempts) > 0.3) // >30% inconclusivos
      .sort((a, b) => (b.inconclusive / b.attempts) - (a.inconclusive / a.attempts));
  }

  /**
   * Retorna sites mais confiáveis
   */
  getMostReliableSites(minAttempts = 5): SiteMetrics[] {
    return Array.from(this.siteMetrics.values())
      .filter(m => m.attempts >= minAttempts)
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
      .slice(0, 10);
  }

  /**
   * Calcula tendência de melhoria ao longo do tempo
   */
  getPrecisionTrend(days = 7): { improving: boolean; change: number } {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentScans = this.scanHistory.filter(s => s.timestamp > cutoff);
    
    if (recentScans.length < 2) {
      return { improving: false, change: 0 };
    }

    const first = recentScans[0].metrics.qualityScore;
    const last = recentScans[recentScans.length - 1].metrics.qualityScore;
    const change = last - first;

    return {
      improving: change > 0,
      change
    };
  }

  /**
   * Gera relatório de qualidade
   */
  generateQualityReport(): {
    overall: PrecisionMetrics;
    trending: { improving: boolean; change: number };
    problematicSites: SiteMetrics[];
    recommendations: string[];
  } {
    if (this.scanHistory.length === 0) {
      return {
        overall: {
          totalScanned: 0, found: 0, notFound: 0, inconclusive: 0, errors: 0,
          precisionScore: 0, inconclusiveRate: 0, averageConfidence: 0, qualityScore: 0
        },
        trending: { improving: false, change: 0 },
        problematicSites: [],
        recommendations: ['Realizar mais scans para gerar métricas']
      };
    }

    // Métricas gerais dos últimos scans
    const recentResults = this.scanHistory
      .slice(-10)
      .flatMap(s => s.results);
    const overall = this.calculateMetrics(recentResults);

    const trending = this.getPrecisionTrend();
    const problematicSites = this.getProblematicSites();

    const recommendations = this.generateRecommendations(overall, problematicSites);

    return {
      overall,
      trending,
      problematicSites,
      recommendations
    };
  }

  private calculateQualityScore(
    precisionScore: number, 
    inconclusiveRate: number, 
    averageConfidence: number
  ): number {
    // Fórmula ponderada: precisão (50%) + baixa taxa inconclusive (30%) + confiança (20%)
    const precisionComponent = precisionScore * 0.5;
    const inconclusiveComponent = (1 - inconclusiveRate) * 0.3;
    const confidenceComponent = averageConfidence * 0.2;
    
    return Math.min(1.0, precisionComponent + inconclusiveComponent + confidenceComponent);
  }

  private generateRecommendations(
    metrics: PrecisionMetrics,
    problematicSites: SiteMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.inconclusiveRate > 0.3) {
      recommendations.push(
        'Alta taxa de inconclusivos (>30%). Considere implementar validações adicionais.'
      );
    }

    if (metrics.precisionScore < 0.7) {
      recommendations.push(
        'Baixa precisão geral. Revise padrões de detecção e timeouts.'
      );
    }

    if (problematicSites.length > 5) {
      recommendations.push(
        `${problematicSites.length} sites com alta taxa de inconclusivos. Priorize correções.`
      );
    }

    if (metrics.errors / metrics.totalScanned > 0.1) {
      recommendations.push(
        'Alta taxa de erros (>10%). Verifique conectividade e rate limits.'
      );
    }

    if (metrics.averageConfidence < 0.5) {
      recommendations.push(
        'Baixa confiança média. Implemente mais checks de validação.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Qualidade geral satisfatória. Continue monitorando.');
    }

    return recommendations;
  }

  /**
   * Exporta métricas em formato JSON para análise externa
   */
  exportMetrics() {
    return {
      scanHistory: this.scanHistory,
      siteMetrics: Object.fromEntries(this.siteMetrics),
      summary: this.generateQualityReport()
    };
  }

  /**
   * Limpa histórico antigo
   */
  cleanup(daysToKeep = 30): void {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    this.scanHistory = this.scanHistory.filter(s => s.timestamp > cutoff);

    // Remove métricas de sites não utilizados recentemente
    for (const [siteId, metrics] of this.siteMetrics) {
      if (metrics.lastUpdated < cutoff) {
        this.siteMetrics.delete(siteId);
      }
    }
  }
}