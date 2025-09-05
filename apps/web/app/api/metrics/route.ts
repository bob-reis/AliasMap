import { NextRequest, NextResponse } from 'next/server';
import { getCurrentMetrics, precisionTracker } from '../../../lib/enhanced-engine';

export async function GET(req: NextRequest) {
  try {
    const metrics = getCurrentMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve metrics', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, params } = await req.json();
    
    switch (action) {
      case 'cleanup':
        const daysToKeep = params?.daysToKeep || 30;
        precisionTracker.cleanup(daysToKeep);
        return NextResponse.json({ success: true, message: `Cleaned up data older than ${daysToKeep} days` });
        
      case 'report':
        const report = precisionTracker.generateQualityReport();
        return NextResponse.json(report);
        
      case 'problematic':
        const minAttempts = params?.minAttempts || 5;
        const problematic = precisionTracker.getProblematicSites(minAttempts);
        return NextResponse.json({ problematicSites: problematic });
        
      case 'reliable':
        const minAttemptsReliable = params?.minAttempts || 5;
        const reliable = precisionTracker.getMostReliableSites(minAttemptsReliable);
        return NextResponse.json({ reliableSites: reliable });
        
      default:
        return NextResponse.json(
          { error: 'Unknown action', availableActions: ['cleanup', 'report', 'problematic', 'reliable'] },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request', details: (error as Error).message },
      { status: 500 }
    );
  }
}