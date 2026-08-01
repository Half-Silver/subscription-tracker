import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const ACCOUNTS_FILE = path.resolve(process.cwd(), 'accounts.json');

export async function GET() {
  if (!fs.existsSync(ACCOUNTS_FILE)) return NextResponse.json([]);
  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    return NextResponse.json(JSON.parse(raw));
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const { user, pass } = await req.json();
    let accounts: {user: string, pass: string}[] = [];
    if (fs.existsSync(ACCOUNTS_FILE)) {
      accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    }
    if (!accounts.find(a => a.user === user)) {
      accounts.push({ user, pass });
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await req.json();
    if (fs.existsSync(ACCOUNTS_FILE)) {
      let accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
      accounts = accounts.filter((a: any) => a.user !== user);
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
