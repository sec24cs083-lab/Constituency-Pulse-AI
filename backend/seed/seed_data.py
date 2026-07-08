"""
Seed data for the "Pune Urban" sample constituency.
All data is SYNTHETIC / MOCK — structured like real datasets but not real government data.
Sources mimicked: Census 2011 ward-level data, PMGSY road coverage, Jal Jeevan Mission,
MPLADS guidelines (₹5 Cr/year per MP).
"""
from sqlalchemy.orm import Session
from models import Ward, Scheme, Project, Complaint, Budget
import json


# ── Ward GeoJSON boundaries (simplified polygons around Pune city center) ──
WARD_BOUNDARIES = {
    1: {"type": "Polygon", "coordinates": [[[73.856, 18.520], [73.876, 18.520], [73.876, 18.535], [73.856, 18.535], [73.856, 18.520]]]},
    2: {"type": "Polygon", "coordinates": [[[73.876, 18.520], [73.900, 18.520], [73.900, 18.535], [73.876, 18.535], [73.876, 18.520]]]},
    3: {"type": "Polygon", "coordinates": [[[73.856, 18.505], [73.876, 18.505], [73.876, 18.520], [73.856, 18.520], [73.856, 18.505]]]},
    4: {"type": "Polygon", "coordinates": [[[73.876, 18.505], [73.900, 18.505], [73.900, 18.520], [73.876, 18.520], [73.876, 18.505]]]},
    5: {"type": "Polygon", "coordinates": [[[73.840, 18.520], [73.856, 18.520], [73.856, 18.540], [73.840, 18.540], [73.840, 18.520]]]},
    6: {"type": "Polygon", "coordinates": [[[73.900, 18.505], [73.925, 18.505], [73.925, 18.535], [73.900, 18.535], [73.900, 18.505]]]},
}

WARDS = [
    {"id": 1, "name": "Kasba Peth", "population": 42500, "households": 9200, "literacy_rate": 78.4, "sc_st_percentage": 12.1,
     "road_coverage_pct": 62.0, "water_access_pct": 55.0, "electricity_pct": 89.0, "school_count": 8, "health_centre_count": 2, "drainage_coverage_pct": 48.0,
     "lat": 18.527, "lng": 18.866},
    {"id": 2, "name": "Shivajinagar", "population": 68200, "households": 15400, "literacy_rate": 85.2, "sc_st_percentage": 8.3,
     "road_coverage_pct": 79.0, "water_access_pct": 74.0, "electricity_pct": 96.0, "school_count": 14, "health_centre_count": 4, "drainage_coverage_pct": 68.0,
     "lat": 18.527, "lng": 73.888},
    {"id": 3, "name": "Hadapsar", "population": 95000, "households": 21000, "literacy_rate": 72.1, "sc_st_percentage": 18.7,
     "road_coverage_pct": 51.0, "water_access_pct": 41.0, "electricity_pct": 82.0, "school_count": 19, "health_centre_count": 3, "drainage_coverage_pct": 35.0,
     "lat": 18.512, "lng": 73.866},
    {"id": 4, "name": "Kondhwa", "population": 78000, "households": 17500, "literacy_rate": 69.8, "sc_st_percentage": 21.4,
     "road_coverage_pct": 44.0, "water_access_pct": 38.0, "electricity_pct": 78.0, "school_count": 15, "health_centre_count": 2, "drainage_coverage_pct": 30.0,
     "lat": 18.512, "lng": 73.888},
    {"id": 5, "name": "Kothrud", "population": 55000, "households": 12800, "literacy_rate": 88.5, "sc_st_percentage": 6.2,
     "road_coverage_pct": 82.0, "water_access_pct": 81.0, "electricity_pct": 98.0, "school_count": 12, "health_centre_count": 5, "drainage_coverage_pct": 75.0,
     "lat": 18.530, "lng": 73.848},
    {"id": 6, "name": "Wanowrie", "population": 62000, "households": 14000, "literacy_rate": 74.3, "sc_st_percentage": 15.9,
     "road_coverage_pct": 58.0, "water_access_pct": 49.0, "electricity_pct": 86.0, "school_count": 11, "health_centre_count": 3, "drainage_coverage_pct": 42.0,
     "lat": 18.520, "lng": 73.912},
]

SCHEMES = [
    {"id": 1, "name": "Jal Jeevan Mission", "short_name": "JJM", "ministry": "Jal Shakti",
     "description": "Household tap water connections in rural and urban areas.", "category": "water",
     "funding_ceiling_lakhs": 200.0, "cofunding_pct": 60.0,
     "eligibility_criteria": {"categories": ["water"], "min_population": 1000, "water_access_pct_below": 70}},
    {"id": 2, "name": "Pradhan Mantri Gram Sadak Yojana", "short_name": "PMGSY", "ministry": "Rural Development",
     "description": "All-weather road connectivity to unconnected habitations.", "category": "roads",
     "funding_ceiling_lakhs": 150.0, "cofunding_pct": 50.0,
     "eligibility_criteria": {"categories": ["roads"], "road_coverage_pct_below": 60}},
    {"id": 3, "name": "Pradhan Mantri Awas Yojana — Urban", "short_name": "PMAY-U", "ministry": "Housing & Urban Affairs",
     "description": "Affordable housing for EWS/LIG/MIG beneficiaries.", "category": "housing",
     "funding_ceiling_lakhs": 250.0, "cofunding_pct": 40.0,
     "eligibility_criteria": {"categories": ["housing"], "sc_st_percentage_above": 10}},
    {"id": 4, "name": "Swachh Bharat Mission — Urban", "short_name": "SBM-U", "ministry": "Housing & Urban Affairs",
     "description": "Open Defecation Free cities, solid waste management, and drainage.", "category": "sanitation",
     "funding_ceiling_lakhs": 100.0, "cofunding_pct": 55.0,
     "eligibility_criteria": {"categories": ["sanitation", "drainage"], "drainage_coverage_pct_below": 60}},
    {"id": 5, "name": "Rashtriya Swasthya Bima Yojana", "short_name": "RSBY", "ministry": "Health & Family Welfare",
     "description": "Health infrastructure support for BPL families.", "category": "health",
     "funding_ceiling_lakhs": 80.0, "cofunding_pct": 45.0,
     "eligibility_criteria": {"categories": ["health"], "sc_st_percentage_above": 15}},
    {"id": 6, "name": "Samagra Shiksha Abhiyan", "short_name": "SSA", "ministry": "Education",
     "description": "Integrated school education from pre-primary to Class XII.", "category": "education",
     "funding_ceiling_lakhs": 120.0, "cofunding_pct": 50.0,
     "eligibility_criteria": {"categories": ["education"], "literacy_rate_below": 80}},
    {"id": 7, "name": "DDUGJY — Urban Electricity", "short_name": "DDUGJY", "ministry": "Power",
     "description": "Last-mile electricity connectivity and feeder separation.", "category": "electricity",
     "funding_ceiling_lakhs": 90.0, "cofunding_pct": 40.0,
     "eligibility_criteria": {"categories": ["electricity"], "electricity_pct_below": 85}},
]

PROJECTS = [
    {
        "id": 1, "name": "Hadapsar Piped Water Network Expansion",
        "description": "Extend JJM piped water connections to 8,400 unserved households in Hadapsar ward. Currently only 41% have tap connections.",
        "ward_id": 3, "category": "water",
        "estimated_cost_lakhs": 185.0, "matched_scheme_id": 1, "scheme_cofunding_lakhs": 111.0, "net_cost_lakhs": 74.0,
        "population_affected": 38000,
        "infra_evidence": "Hadapsar ward water access at 41% vs. constituency average of 56%. 12 documented complaints in last 90 days citing daily water shortage.",
        "infra_evidence_source": "Synthetic ward infra dataset (JJM-style), complaint cluster analysis",
        "delay_risk": "high",
        "priority_score": 87.4,
        "score_breakdown": {
            "urgency": {"value": 4.2, "weight": 0.25, "weighted_score": 21.0, "description": "Avg urgency score from 12 complaints (scale 1-5)"},
            "population_affected": {"value": 38000, "weight": 0.20, "weighted_score": 19.0, "description": "38,000 residents lack safe tap water"},
            "cost_efficiency": {"value": 3.8, "weight": 0.20, "weighted_score": 19.0, "description": "Cost per person served: ₹1,947 (low)"},
            "delay_risk": {"value": 4.5, "weight": 0.20, "weighted_score": 18.0, "description": "High risk — monsoon waterborne disease risk escalates quarterly"},
            "scheme_fundability": {"value": 0.6, "weight": 0.15, "weighted_score": 9.0, "description": "JJM co-funds 60% (₹111L of ₹185L)"},
        },
        "status": "proposed",
    },
    {
        "id": 2, "name": "Kondhwa Internal Road Upgradation",
        "description": "Upgrade 4.2 km of kachcha (unpaved) internal roads in Kondhwa to all-weather bitumen surface under PMGSY norms.",
        "ward_id": 4, "category": "roads",
        "estimated_cost_lakhs": 128.0, "matched_scheme_id": 2, "scheme_cofunding_lakhs": 64.0, "net_cost_lakhs": 64.0,
        "population_affected": 31000,
        "infra_evidence": "Kondhwa road coverage at 44% — lowest in constituency. 9 road-related complaints. Rainy-season mobility disruption documented.",
        "infra_evidence_source": "Synthetic ward infra dataset (PMGSY-style), complaint cluster",
        "delay_risk": "high",
        "priority_score": 82.1,
        "score_breakdown": {
            "urgency": {"value": 3.9, "weight": 0.25, "weighted_score": 19.5, "description": "Avg urgency from 9 road complaints"},
            "population_affected": {"value": 31000, "weight": 0.20, "weighted_score": 18.6, "description": "31,000 residents on unpaved roads"},
            "cost_efficiency": {"value": 4.1, "weight": 0.20, "weighted_score": 16.4, "description": "₹4,129/person — competitive for road infra"},
            "delay_risk": {"value": 4.2, "weight": 0.20, "weighted_score": 16.8, "description": "Pre-monsoon window closing — delays worsen road damage"},
            "scheme_fundability": {"value": 0.5, "weight": 0.15, "weighted_score": 7.5, "description": "PMGSY co-funds 50% (₹64L of ₹128L)"},
        },
        "status": "proposed",
    },
    {
        "id": 3, "name": "Kasba Peth Drainage Rehabilitation",
        "description": "Rehabilitate 3.1 km of clogged/broken storm-water drains in Kasba Peth under SBM-U norms to prevent annual flood damage.",
        "ward_id": 1, "category": "sanitation",
        "estimated_cost_lakhs": 95.0, "matched_scheme_id": 4, "scheme_cofunding_lakhs": 52.25, "net_cost_lakhs": 42.75,
        "population_affected": 22000,
        "infra_evidence": "Kasba Peth drainage coverage at 48%. 7 flooding complaints in last 60 days. Annual repair costs estimated ₹15L from informal records.",
        "infra_evidence_source": "Synthetic drainage dataset (SBM-U style), complaint analysis",
        "delay_risk": "high",
        "priority_score": 78.6,
        "score_breakdown": {
            "urgency": {"value": 4.1, "weight": 0.25, "weighted_score": 20.5, "description": "High urgency — monsoon proximity"},
            "population_affected": {"value": 22000, "weight": 0.20, "weighted_score": 13.2, "description": "22,000 at flood risk annually"},
            "cost_efficiency": {"value": 3.5, "weight": 0.20, "weighted_score": 14.0, "description": "₹4,318/person; prevents recurring ₹15L/yr repair"},
            "delay_risk": {"value": 4.0, "weight": 0.20, "weighted_score": 16.0, "description": "High — monsoon season 6 weeks away"},
            "scheme_fundability": {"value": 0.55, "weight": 0.15, "weighted_score": 8.25, "description": "SBM-U co-funds 55% (₹52.25L of ₹95L)"},
        },
        "status": "proposed",
    },
    {
        "id": 4, "name": "Wanowrie Primary Health Centre Upgrade",
        "description": "Upgrade Wanowrie PHC — add 4 beds, diagnostic equipment, and 24×7 staffing under RSBY norms for SC/ST beneficiaries.",
        "ward_id": 6, "category": "health",
        "estimated_cost_lakhs": 68.0, "matched_scheme_id": 5, "scheme_cofunding_lakhs": 30.6, "net_cost_lakhs": 37.4,
        "population_affected": 19000,
        "infra_evidence": "Wanowrie SC/ST at 15.9%. 1 PHC serving 62,000 residents (under-served ratio 1:62,000 vs. norm 1:30,000).",
        "infra_evidence_source": "Synthetic health infra dataset (RSBY style), census SC/ST data",
        "delay_risk": "medium",
        "priority_score": 71.2,
        "score_breakdown": {
            "urgency": {"value": 3.4, "weight": 0.25, "weighted_score": 17.0, "description": "Medium urgency — chronic gap, not acute"},
            "population_affected": {"value": 19000, "weight": 0.20, "weighted_score": 11.4, "description": "19,000 SC/ST residents lack adequate PHC"},
            "cost_efficiency": {"value": 4.2, "weight": 0.20, "weighted_score": 16.8, "description": "₹3,578/beneficiary — good for health infra"},
            "delay_risk": {"value": 3.0, "weight": 0.20, "weighted_score": 12.0, "description": "Medium delay risk — health outcomes degrade over years"},
            "scheme_fundability": {"value": 0.45, "weight": 0.15, "weighted_score": 6.75, "description": "RSBY covers 45% (₹30.6L of ₹68L)"},
        },
        "status": "proposed",
    },
    {
        "id": 5, "name": "Hadapsar Government School Digital Lab",
        "description": "Equip 3 Hadapsar government schools with computer labs (30 computers each) and high-speed internet under Samagra Shiksha.",
        "ward_id": 3, "category": "education",
        "estimated_cost_lakhs": 42.0, "matched_scheme_id": 6, "scheme_cofunding_lakhs": 21.0, "net_cost_lakhs": 21.0,
        "population_affected": 4200,
        "infra_evidence": "Hadapsar literacy rate 72.1% (below 80% SSA threshold). Zero digital labs in ward's 19 govt. schools.",
        "infra_evidence_source": "Synthetic education dataset (SSA style), ward literacy census",
        "delay_risk": "low",
        "priority_score": 63.7,
        "score_breakdown": {
            "urgency": {"value": 2.8, "weight": 0.25, "weighted_score": 14.0, "description": "Lower urgency — developmental, not acute"},
            "population_affected": {"value": 4200, "weight": 0.20, "weighted_score": 5.0, "description": "4,200 students directly benefit"},
            "cost_efficiency": {"value": 4.8, "weight": 0.20, "weighted_score": 19.2, "description": "₹10,000/student — excellent ROI for digital infra"},
            "delay_risk": {"value": 2.5, "weight": 0.20, "weighted_score": 10.0, "description": "Low — can be implemented in next academic cycle"},
            "scheme_fundability": {"value": 0.5, "weight": 0.15, "weighted_score": 7.5, "description": "SSA covers 50% (₹21L of ₹42L)"},
        },
        "status": "proposed",
    },
    {
        "id": 6, "name": "Kondhwa Street Lighting (Solar LED)",
        "description": "Install 220 solar LED street lights in Kondhwa's 12 unlit lanes to improve safety, especially for women.",
        "ward_id": 4, "category": "electricity",
        "estimated_cost_lakhs": 38.0, "matched_scheme_id": 7, "scheme_cofunding_lakhs": 15.2, "net_cost_lakhs": 22.8,
        "population_affected": 12000,
        "infra_evidence": "Kondhwa electricity pct 78% — below 85% DDUGJY threshold. 5 complaints citing lack of street lighting and safety concerns.",
        "infra_evidence_source": "Synthetic electrification dataset (DDUGJY style), complaint cluster",
        "delay_risk": "low",
        "priority_score": 58.3,
        "score_breakdown": {
            "urgency": {"value": 2.9, "weight": 0.25, "weighted_score": 14.5, "description": "Moderate — safety issue but not life-threatening"},
            "population_affected": {"value": 12000, "weight": 0.20, "weighted_score": 7.2, "description": "12,000 residents in dark lanes"},
            "cost_efficiency": {"value": 4.5, "weight": 0.20, "weighted_score": 18.0, "description": "₹3,167/person — solar reduces ongoing OpEx"},
            "delay_risk": {"value": 2.0, "weight": 0.20, "weighted_score": 8.0, "description": "Low risk — non-seasonal implementation"},
            "scheme_fundability": {"value": 0.40, "weight": 0.15, "weighted_score": 6.0, "description": "DDUGJY covers 40% (₹15.2L of ₹38L)"},
        },
        "status": "proposed",
    },
    {
        "id": 7, "name": "Shivajinagar Pedestrian Footpath Repair",
        "description": "Repair and widen 2.8 km of broken footpaths in Shivajinagar market area to improve pedestrian safety.",
        "ward_id": 2, "category": "roads",
        "estimated_cost_lakhs": 28.0, "matched_scheme_id": None, "scheme_cofunding_lakhs": 0.0, "net_cost_lakhs": 28.0,
        "population_affected": 25000,
        "infra_evidence": "6 footpath-related complaints. Market area footpaths broken/encroached. No applicable scheme — fully MPLADS funded.",
        "infra_evidence_source": "Complaint cluster, field inspection notes (synthetic)",
        "delay_risk": "low",
        "priority_score": 52.1,
        "score_breakdown": {
            "urgency": {"value": 2.6, "weight": 0.25, "weighted_score": 13.0, "description": "Moderate — daily inconvenience, injury risk"},
            "population_affected": {"value": 25000, "weight": 0.20, "weighted_score": 15.0, "description": "25,000 daily commuters/market visitors"},
            "cost_efficiency": {"value": 3.8, "weight": 0.20, "weighted_score": 15.2, "description": "₹1,120/person — very cost-effective"},
            "delay_risk": {"value": 1.8, "weight": 0.20, "weighted_score": 7.2, "description": "Low — no seasonal urgency"},
            "scheme_fundability": {"value": 0.0, "weight": 0.15, "weighted_score": 0.0, "description": "No matching scheme — 100% MPLADS funded"},
        },
        "status": "proposed",
    },
    {
        "id": 8, "name": "Kothrud Community Sports Ground",
        "description": "Develop a 1-acre community sports ground with basic amenities in Kothrud — fitness equipment, lighting, and perimeter wall.",
        "ward_id": 5, "category": "housing",
        "estimated_cost_lakhs": 55.0, "matched_scheme_id": None, "scheme_cofunding_lakhs": 0.0, "net_cost_lakhs": 55.0,
        "population_affected": 8500,
        "infra_evidence": "3 community space requests. Kothrud is well-served on core infra — community amenity gap identified by ward councilor.",
        "infra_evidence_source": "Complaint portal, ward-level community survey (synthetic)",
        "delay_risk": "low",
        "priority_score": 38.9,
        "score_breakdown": {
            "urgency": {"value": 1.8, "weight": 0.25, "weighted_score": 9.0, "description": "Low urgency — aspirational project"},
            "population_affected": {"value": 8500, "weight": 0.20, "weighted_score": 5.1, "description": "8,500 residents benefit"},
            "cost_efficiency": {"value": 2.5, "weight": 0.20, "weighted_score": 10.0, "description": "₹6,471/person — moderate cost for amenity"},
            "delay_risk": {"value": 1.5, "weight": 0.20, "weighted_score": 6.0, "description": "No urgency — can be deferred"},
            "scheme_fundability": {"value": 0.0, "weight": 0.15, "weighted_score": 0.0, "description": "No matching scheme — MPLADS only"},
        },
        "status": "proposed",
    },
]

COMPLAINTS = [
    # Hadapsar water complaints
    {"raw_text": "Pani nahi milta subah se. Kal bhi nahi aaya. Bachche school nahi gaye.", "language": "hi", "channel": "whatsapp",
     "translated_text": "No water since morning. Yesterday also no supply. Children couldn't go to school.", "issue_category": "water",
     "urgency": "critical", "sentiment": -0.85, "ward_id": 3, "lat": 18.512, "lng": 73.862, "location_name": "Hadapsar, Sector 4", "project_id": 1,
     "entities": {"issue": "water shortage", "location": "Hadapsar Sector 4", "urgency": "critical"}},
    {"raw_text": "Water supply is completely irregular in our lane. We depend on tankers paying ₹500/month extra.", "language": "en", "channel": "portal",
     "translated_text": "Water supply is completely irregular in our lane. We depend on tankers paying ₹500/month extra.", "issue_category": "water",
     "urgency": "high", "sentiment": -0.70, "ward_id": 3, "lat": 18.511, "lng": 73.868, "location_name": "Hadapsar, Magarpatta Road", "project_id": 1,
     "entities": {"issue": "water irregularity", "location": "Hadapsar Magarpatta Road", "financial_impact": "₹500/month extra"}},
    {"raw_text": "Tap water not connected to 60% of houses in our society. Builder promised but never done.", "language": "en", "channel": "email",
     "translated_text": "Tap water not connected to 60% of houses in our society. Builder promised but never done.", "issue_category": "water",
     "urgency": "high", "sentiment": -0.60, "ward_id": 3, "lat": 18.509, "lng": 73.864, "location_name": "Hadapsar, Undri Road", "project_id": 1,
     "entities": {"issue": "water connection missing", "location": "Hadapsar Undri Road"}},
    # Kondhwa road complaints
    {"raw_text": "Kondhwa roads are disaster. My bike got damaged twice this month in potholes.", "language": "en", "channel": "social",
     "translated_text": "Kondhwa roads are disaster. My bike got damaged twice this month in potholes.", "issue_category": "roads",
     "urgency": "high", "sentiment": -0.80, "ward_id": 4, "lat": 18.509, "lng": 73.884, "location_name": "Kondhwa, Main Road", "project_id": 2,
     "entities": {"issue": "potholes", "location": "Kondhwa Main Road", "damage": "vehicle damage"}},
    {"raw_text": "Baarish mein kachchi sadak par chalna impossible hai. Gira, chot lagi.", "language": "hi", "channel": "voice",
     "translated_text": "During rain walking on the unpaved road is impossible. I fell and got injured.", "issue_category": "roads",
     "urgency": "critical", "sentiment": -0.90, "ward_id": 4, "lat": 18.511, "lng": 73.886, "location_name": "Kondhwa, Internal Lane 5", "project_id": 2,
     "entities": {"issue": "unpaved road", "location": "Kondhwa Internal Lane 5", "injury": True}},
    # Kasba Peth drainage complaints
    {"raw_text": "Every monsoon our ground floor gets flooded. The drain outside is completely blocked with garbage.", "language": "en", "channel": "portal",
     "translated_text": "Every monsoon our ground floor gets flooded. The drain outside is completely blocked with garbage.", "issue_category": "sanitation",
     "urgency": "high", "sentiment": -0.75, "ward_id": 1, "lat": 18.525, "lng": 73.858, "location_name": "Kasba Peth, Tilak Road", "project_id": 3,
     "entities": {"issue": "drain blockage", "location": "Kasba Peth Tilak Road", "seasonal": "monsoon"}},
    {"raw_text": "Nali ka paani ghar ke saamne bhar jaata hai. Bachche beemar ho gaye pichle saal.", "language": "hi", "channel": "whatsapp",
     "translated_text": "Drain water overflows in front of our house. Children fell sick last year due to this.", "issue_category": "sanitation",
     "urgency": "high", "sentiment": -0.82, "ward_id": 1, "lat": 18.523, "lng": 73.860, "location_name": "Kasba Peth, Vishram Baug", "project_id": 3,
     "entities": {"issue": "drain overflow", "location": "Kasba Peth Vishram Baug", "health_impact": True}},
    # Health complaint
    {"raw_text": "Wanowrie PHC has only 1 doctor for 60,000 people. I waited 4 hours for a basic consultation.", "language": "en", "channel": "email",
     "translated_text": "Wanowrie PHC has only 1 doctor for 60,000 people. I waited 4 hours for a basic consultation.", "issue_category": "health",
     "urgency": "medium", "sentiment": -0.65, "ward_id": 6, "lat": 18.518, "lng": 73.906, "location_name": "Wanowrie, PHC", "project_id": 4,
     "entities": {"issue": "inadequate health staff", "location": "Wanowrie PHC", "wait_time": "4 hours"}},
    # Education complaint
    {"raw_text": "Government school mein computer nahi hai. Private school waale bachche aage nikal rahe hain.", "language": "hi", "channel": "portal",
     "translated_text": "Government school has no computers. Children from private schools are getting ahead.", "issue_category": "education",
     "urgency": "medium", "sentiment": -0.50, "ward_id": 3, "lat": 18.508, "lng": 73.870, "location_name": "Hadapsar, Govt. Primary School", "project_id": 5,
     "entities": {"issue": "no digital facilities", "location": "Hadapsar Govt Primary School"}},
    # Street light complaint
    {"raw_text": "There are no street lights in our lane from 8pm. Women feel unsafe walking home.", "language": "en", "channel": "social",
     "translated_text": "There are no street lights in our lane from 8pm. Women feel unsafe walking home.", "issue_category": "electricity",
     "urgency": "high", "sentiment": -0.78, "ward_id": 4, "lat": 18.514, "lng": 73.882, "location_name": "Kondhwa, Lane 12", "project_id": 6,
     "entities": {"issue": "no street lighting", "location": "Kondhwa Lane 12", "safety_concern": "women safety"}},
]

BUDGET = {
    "mp_name": "Aditi Sharma",
    "constituency": "Pune Urban",
    "fiscal_year": "2024-25",
    "total_allocation_lakhs": 500.0,
    "amount_used_lakhs": 120.0,
    "amount_remaining_lakhs": 380.0,
    "notes": "₹120L already disbursed for ongoing school building repair (Ward 2). ₹380L available for new MPLADS projects.",
}


def seed_database(db: Session) -> None:
    """Idempotently seed the database with sample constituency data."""

    # Check if already seeded
    if db.query(Ward).count() > 0:
        print("Database already seeded — skipping.")
        return

    print("Seeding database with Pune Urban constituency data...")

    # Wards
    for w in WARDS:
        ward = Ward(
            id=w["id"], name=w["name"], constituency_name="Pune Urban", mp_name="Aditi Sharma",
            population=w["population"], households=w["households"],
            literacy_rate=w["literacy_rate"], sc_st_percentage=w["sc_st_percentage"],
            road_coverage_pct=w["road_coverage_pct"], water_access_pct=w["water_access_pct"],
            electricity_pct=w["electricity_pct"], school_count=w["school_count"],
            health_centre_count=w["health_centre_count"], drainage_coverage_pct=w["drainage_coverage_pct"],
            lat=w["lat"], lng=w["lng"],
            boundary_geojson=WARD_BOUNDARIES.get(w["id"]),
        )
        db.add(ward)
    db.flush()

    # Schemes
    for s in SCHEMES:
        scheme = Scheme(**s)
        db.add(scheme)
    db.flush()

    # Projects
    for p in PROJECTS:
        project = Project(
            id=p["id"], name=p["name"], description=p["description"],
            ward_id=p["ward_id"], category=p["category"],
            estimated_cost_lakhs=p["estimated_cost_lakhs"],
            matched_scheme_id=p["matched_scheme_id"],
            scheme_cofunding_lakhs=p["scheme_cofunding_lakhs"],
            net_cost_lakhs=p["net_cost_lakhs"],
            population_affected=p["population_affected"],
            infra_evidence=p["infra_evidence"],
            infra_evidence_source=p["infra_evidence_source"],
            delay_risk=p["delay_risk"],
            priority_score=p["priority_score"],
            score_breakdown=p["score_breakdown"],
            status=p["status"],
        )
        db.add(project)
    db.flush()

    # Complaints
    for c in COMPLAINTS:
        complaint = Complaint(**c)
        db.add(complaint)
    db.flush()

    # Budget
    budget = Budget(**BUDGET)
    db.add(budget)

    db.commit()
    print(f"SUCCESS: Seeded {len(WARDS)} wards, {len(SCHEMES)} schemes, {len(PROJECTS)} projects, {len(COMPLAINTS)} complaints.")
