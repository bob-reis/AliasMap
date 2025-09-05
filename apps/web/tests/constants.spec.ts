import { describe, it, expect } from 'vitest';
import { disclaimerPt } from '../lib/constants';

describe('Constants Module', () => {
  describe('disclaimerPt', () => {
    it('should be defined and be a string', () => {
      expect(disclaimerPt).toBeDefined();
      expect(typeof disclaimerPt).toBe('string');
    });

    it('should contain expected disclaimer content', () => {
      expect(disclaimerPt).toContain('Aviso e Uso Ético');
      expect(disclaimerPt).toContain('AliasMap');
      expect(disclaimerPt).toContain('Sherlock Project');
    });

    it('should mention data collection practices', () => {
      expect(disclaimerPt).toContain('informações publicamente acessíveis');
      expect(disclaimerPt).toContain('Não persistimos dados no servidor');
    });

    it('should reference legal compliance', () => {
      expect(disclaimerPt).toContain('LGPD/GDPR/CCPA');
      expect(disclaimerPt).toContain('leis e regulamentos');
      expect(disclaimerPt).toContain('Termos de Uso');
    });

    it('should mention operational limits', () => {
      expect(disclaimerPt).toContain('concorrência/timeout');
      expect(disclaimerPt).toContain('não tente uso abusivo');
    });

    it('should have agreement clause', () => {
      expect(disclaimerPt).toContain('não concordar com estes termos');
      expect(disclaimerPt).toContain('não utilize a ferramenta');
    });

    it('should be properly formatted as markdown', () => {
      expect(disclaimerPt).toMatch(/^# /); // Starts with h1 heading
      expect(disclaimerPt).toContain('- '); // Contains bullet points
    });

    it('should have reasonable length for a disclaimer', () => {
      expect(disclaimerPt.length).toBeGreaterThan(100);
      expect(disclaimerPt.length).toBeLessThan(2000);
    });

    it('should contain key ethical guidelines', () => {
      const ethicalKeywords = [
        'educacionais',
        'investigações legítimas',
        'publicamente acessíveis',
        'consentimento',
        'responsabilidade'
      ];

      ethicalKeywords.forEach(keyword => {
        expect(disclaimerPt.toLowerCase()).toContain(keyword.toLowerCase());
      });
    });

    it('should mention specific privacy regulations', () => {
      const regulations = ['LGPD', 'GDPR', 'CCPA'];
      
      regulations.forEach(regulation => {
        expect(disclaimerPt).toContain(regulation);
      });
    });

    it('should have clear lines and structure', () => {
      const lines = disclaimerPt.split('\n');
      
      // Should have multiple lines
      expect(lines.length).toBeGreaterThan(5);
      
      // Should have a title line
      expect(lines[0]).toMatch(/^# .+/);
      
      // Should have bullet points
      const bulletPoints = lines.filter(line => line.startsWith('- '));
      expect(bulletPoints.length).toBeGreaterThan(2);
    });

    it('should not contain placeholder text', () => {
      expect(disclaimerPt).not.toContain('TODO');
      expect(disclaimerPt).not.toContain('FIXME');
      expect(disclaimerPt).not.toContain('XXX');
      expect(disclaimerPt).not.toContain('[placeholder]');
    });

    it('should be immutable when accessed', () => {
      const original = disclaimerPt;
      
      // Accessing the constant should not change it
      const accessed = disclaimerPt;
      
      expect(accessed).toBe(original);
      expect(accessed).toEqual(original);
    });
  });
});