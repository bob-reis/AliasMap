import { disclaimerPt } from '../../lib/constants';

export const metadata = { title: 'Aviso e Uso Ético — AliasMap' };

export default function EthicsPage() {
  return (
    <article>
      <h1>Aviso e Uso Ético</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{disclaimerPt}</pre>
    </article>
  );
}

