import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface WaitlistLead {
  id: string;
  email: string;
  company?: string;
  notes?: string;
  plan: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

// In-memory cache across warm lambdas
const inMemoryLeads: WaitlistLead[] = [];

// Fallback file storage path (/tmp in serverless environment, .data locally)
const storageDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(process.cwd(), '.data');
const storageFile = path.join(storageDir, 'waitlist_leads.json');

function getStoredLeads(): WaitlistLead[] {
  try {
    if (fs.existsSync(storageFile)) {
      const data = fs.readFileSync(storageFile, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore file read error
  }
  return inMemoryLeads;
}

function saveStoredLeads(leads: WaitlistLead[]) {
  try {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    fs.writeFileSync(storageFile, JSON.stringify(leads, null, 2), 'utf-8');
  } catch {
    // Ignore file write error
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, company, notes, plan } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    const lead: WaitlistLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: email.trim().toLowerCase(),
      company: typeof company === 'string' && company.trim().length > 0 ? company.trim() : undefined,
      notes: typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : undefined,
      plan: typeof plan === 'string' && plan.trim().length > 0 ? plan.trim() : 'Team Workspaces',
      userAgent: request.headers.get('user-agent') || undefined,
      createdAt: new Date().toISOString(),
    };

    // Add to in-memory store and file
    const current = getStoredLeads();
    const updated = [lead, ...current.filter(l => l.email !== lead.email)];
    inMemoryLeads.unshift(lead);
    saveStoredLeads(updated);

    // If webhook is configured (e.g. Slack / Discord / Zapier), dispatch notification
    const webhookUrl = process.env.WAITLIST_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🔔 **New ComputeCanvas Waitlist Registration**\n- **Email**: ${lead.email}\n- **Tier**: ${lead.plan}\n- **Company**: ${lead.company || 'N/A'}\n- **Focus**: ${lead.notes || 'N/A'}\n- **Time**: ${lead.createdAt}`,
          }),
        });
      } catch (err) {
        console.error('Webhook notification error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Priority waitlist registration confirmed.',
      id: lead.id,
    });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing waitlist request.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const format = searchParams.get('format');

  // Security check: builder admin key (configurable via env ADMIN_SECRET, defaults to computecanvas2026)
  const expectedSecret = process.env.ADMIN_SECRET || 'computecanvas2026';
  if (secret !== expectedSecret) {
    return NextResponse.json(
      {
        error: 'Unauthorized. Provide valid ?secret= query parameter to access registered waitlist leads.',
      },
      { status: 401 }
    );
  }

  const leads = getStoredLeads();

  if (format === 'csv') {
    const csvHeaders = 'ID,Email,Plan,Company,Notes,CreatedAt\n';
    const csvRows = leads
      .map(
        l =>
          `"${l.id}","${l.email}","${l.plan}","${(l.company || '').replace(/"/g, '""')}","${(l.notes || '').replace(/"/g, '""')}","${l.createdAt}"`
      )
      .join('\n');

    return new Response(csvHeaders + csvRows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="computecanvas_waitlist_leads.csv"',
      },
    });
  }

  return NextResponse.json({
    total: leads.length,
    leads,
  });
}
