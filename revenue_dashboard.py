#!/usr/bin/env python3
"""
XMRT DAO - Revenue Dashboard CLI
Quick commands to check revenue progress
"""

import requests
import json
from datetime import datetime

SUPABASE_URL = "https://vawouugtzwmejxqkeqqj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

def get_pfp_stats():
    """Get Party Favor Photo stats"""
    print("\n📸 PARTY FAVOR PHOTO")
    print("=" * 50)
    
    # Get partnerships
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/pfp_partnerships",
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        }
    )
    
    if resp.status_code == 200:
        partners = resp.json()
        active = [p for p in partners if p.get('status') == 'partner']
        
        print(f"Total Leads: {len(partners)}")
        print(f"Active Partners: {len(active)}")
        
        total_revenue = sum(p.get('total_revenue', 0) for p in active)
        print(f"Total Revenue: ${total_revenue:,.2f}")
    else:
        print("⚠️  Table not deployed yet")

def get_xmrt_stats():
    """Get XMRT-DAO stats"""
    print("\n🦑 XMRT-DAO")
    print("=" * 50)
    
    # University enrollments
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/xmrt_university_enrollments",
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        }
    )
    
    if resp.status_code == 200:
        enrollments = resp.json()
        print(f"University Enrollments: {len(enrollments)}")
    else:
        print("⚠️  University table not deployed yet")
    
    # MUAPI generations
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/muapi_generations",
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        }
    )
    
    if resp.status_code == 200:
        generations = resp.json()
        total_cost = sum(g.get('cost', 0) for g in generations)
        print(f"MUAPI Generations: {len(generations)}")
        print(f"MUAPI Revenue: ${total_cost:,.2f}")
    else:
        print("⚠️  MUAPI table not deployed yet")

def get_financial_review():
    """Get latest financial review"""
    print("\n📊 FINANCIAL PROGRESS")
    print("=" * 50)
    
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/monthly_financial_reviews",
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        },
        params={'order': 'review_month.desc', 'limit': '1'}
    )
    
    if resp.status_code == 200:
        reviews = resp.json()
        if reviews:
            review = reviews[0]
            print(f"Month: {review.get('review_month', 'N/A')}")
            print(f"PFP MRR: ${review.get('pfp_mrr', 0):,.2f} / $10,000 ({review.get('pfp_mrr_progress', 0)}%)")
            print(f"XMRT ARR: ${review.get('xmt_total_arr', 0):,.2f} / $50,000 ({review.get('xmt_arr_progress', 0)}%)")
        else:
            print("⏳ No reviews yet - first review: May 31, 2026")
    else:
        print("⚠️  Review table not deployed yet")

def main():
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║     XMRT DAO - REVENUE DASHBOARD                             ║")
    print(f"║     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                            ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    
    get_pfp_stats()
    get_xmrt_stats()
    get_financial_review()
    
    print("\n" + "=" * 50)
    print("🎯 GOALS:")
    print("   PFP: $10K MRR by Q4 2026")
    print("   XMRT: $50K ARR by Q4 2026")
    print("=" * 50)
    print()

if __name__ == "__main__":
    main()
