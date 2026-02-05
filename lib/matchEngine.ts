import type { AgencyProfile, StartupPreferences, MatchResult, ThinkingStyle } from '@/types';

/**
 * Match Engine - Core differentiator for the platform
 * 
 * Calculates compatibility between startup preferences and agency profiles
 * based on multiple weighted factors including thinking style alignment.
 */

// Scoring weights (total = 100)
const WEIGHTS = {
  THINKING_STYLE: 30,    // Most important - thinking fit
  BUDGET: 25,            // Budget compatibility
  CATEGORIES: 20,        // Service category match
  INDUSTRIES: 10,        // Industry experience
  AREAS: 10,             // Geographic/remote preference
  KEYWORDS: 5,           // Keyword relevance
};

/**
 * Calculate thinking style compatibility score (0-100)
 * 
 * Scoring matrix:
 * - Exact match: 100
 * - Hybrid with any: 75
 * - Creative vs Data: 25 (opposite styles)
 */
function calculateThinkingScore(
  preferredStyle: ThinkingStyle,
  agencyStyle: ThinkingStyle
): number {
  // Exact match
  if (preferredStyle === agencyStyle) {
    return 100;
  }

  // Hybrid is flexible - good match with anything
  if (preferredStyle === 'hybrid' || agencyStyle === 'hybrid') {
    return 75;
  }

  // Creative vs Data - opposite styles, lowest compatibility
  return 25;
}

/**
 * Calculate budget compatibility score (0-100)
 * 
 * Scores based on how well agency's range fits startup's budget:
 * - Budget within agency range: 100
 * - Budget slightly outside: proportional score
 * - Budget way outside: 0
 */
function calculateBudgetScore(
  startupBudget: number,
  agencyMin: number,
  agencyMax: number
): number {
  // Perfect fit - budget is within agency's range
  if (startupBudget >= agencyMin && startupBudget <= agencyMax) {
    return 100;
  }

  // Budget is below minimum
  if (startupBudget < agencyMin) {
    const difference = agencyMin - startupBudget;
    const percentBelow = difference / agencyMin;
    // Allow some flexibility (up to 30% below minimum)
    if (percentBelow <= 0.3) {
      return Math.round(100 - (percentBelow * 200));
    }
    return 0;
  }

  // Budget is above maximum (agency might be too small)
  const difference = startupBudget - agencyMax;
  const percentAbove = difference / agencyMax;
  // More flexibility for higher budgets (up to 50% above)
  if (percentAbove <= 0.5) {
    return Math.round(100 - (percentAbove * 100));
  }
  
  return 20; // Some score for being over budget
}

/**
 * Calculate array overlap score (0-100)
 * Based on Jaccard similarity with boost for multiple matches
 */
function calculateArrayScore(
  preferences: string[],
  agencyArray: string[]
): number {
  if (preferences.length === 0 || agencyArray.length === 0) {
    return 50; // Neutral score if no preferences specified
  }

  const preferencesLower = preferences.map(p => p.toLowerCase());
  const agencyLower = agencyArray.map(a => a.toLowerCase());

  const matches = preferencesLower.filter(p => agencyLower.includes(p));
  const matchCount = matches.length;

  if (matchCount === 0) {
    return 0;
  }

  // Score based on how many preferences are matched
  const matchRatio = matchCount / preferences.length;
  
  // Boost for matching multiple items
  const boost = Math.min(matchCount - 1, 3) * 5;
  
  return Math.min(100, Math.round(matchRatio * 100 + boost));
}

/**
 * Calculate keyword relevance score (0-100)
 * Fuzzy matching on keywords
 */
function calculateKeywordScore(
  searchKeywords: string[],
  agencyKeywords: string[],
  agencyDescription: string
): number {
  if (searchKeywords.length === 0) {
    return 50; // Neutral if no keywords specified
  }

  const searchLower = searchKeywords.map(k => k.toLowerCase());
  const agencyLower = agencyKeywords.map(k => k.toLowerCase());
  const descriptionLower = agencyDescription.toLowerCase();

  let matchScore = 0;

  for (const keyword of searchLower) {
    // Exact keyword match (high value)
    if (agencyLower.includes(keyword)) {
      matchScore += 30;
      continue;
    }

    // Partial match in keywords
    const partialKeywordMatch = agencyLower.some(k => 
      k.includes(keyword) || keyword.includes(k)
    );
    if (partialKeywordMatch) {
      matchScore += 20;
      continue;
    }

    // Match in description
    if (descriptionLower.includes(keyword)) {
      matchScore += 10;
    }
  }

  // Normalize to 0-100
  const maxPossible = searchKeywords.length * 30;
  return Math.min(100, Math.round((matchScore / maxPossible) * 100));
}

/**
 * Generate "why matched" explanations
 */
function generateWhyMatched(
  preferences: StartupPreferences,
  agency: AgencyProfile,
  scores: {
    thinking: number;
    budget: number;
    categories: number;
    industries: number;
    areas: number;
    keywords: number;
  }
): string[] {
  const reasons: string[] = [];

  // Thinking style explanation
  if (scores.thinking >= 75) {
    if (agency.thinkingStyle === preferences.thinkingPreference) {
      reasons.push(`Perfect thinking style match: Both favor ${agency.thinkingStyle} approach`);
    } else if (agency.thinkingStyle === 'hybrid') {
      reasons.push(`Flexible hybrid thinking adapts to your ${preferences.thinkingPreference} preference`);
    } else {
      reasons.push(`Hybrid preference works well with ${agency.thinkingStyle} approach`);
    }
  }

  // Budget explanation
  if (scores.budget >= 80) {
    reasons.push(`Budget aligned: Your budget of $${preferences.budget.toLocaleString()} fits within their $${agency.budgetMin.toLocaleString()}-$${agency.budgetMax.toLocaleString()} range`);
  } else if (scores.budget >= 50) {
    reasons.push(`Budget is near their range ($${agency.budgetMin.toLocaleString()}-$${agency.budgetMax.toLocaleString()})`);
  }

  // Category matches
  const matchedCategories = preferences.categories.filter(c => 
    agency.categories.includes(c)
  );
  if (matchedCategories.length > 0) {
    reasons.push(`Expertise in: ${matchedCategories.join(', ')}`);
  }

  // Industry experience
  if (preferences.industries && scores.industries >= 50) {
    const matchedIndustries = preferences.industries.filter(i =>
      agency.industries.includes(i)
    );
    if (matchedIndustries.length > 0) {
      reasons.push(`Industry experience: ${matchedIndustries.join(', ')}`);
    }
  }

  // Area match
  if (preferences.areas && scores.areas >= 50) {
    const matchedAreas = preferences.areas.filter(a =>
      agency.areas.some(aa => aa.toLowerCase() === a.toLowerCase())
    );
    if (matchedAreas.length > 0) {
      reasons.push(`Available in: ${matchedAreas.join(', ')}`);
    }
  }

  // Experience level
  if (preferences.experienceLevel && preferences.experienceLevel === agency.experienceLevel) {
    reasons.push(`Specializes in ${agency.experienceLevel} startups`);
  }

  return reasons.length > 0 ? reasons : ['General compatibility based on profile analysis'];
}

/**
 * Main matching function
 * Calculates match scores for an agency against startup preferences
 */
export function calculateMatch(
  preferences: StartupPreferences,
  agency: AgencyProfile
): MatchResult {
  // Calculate individual scores
  const scores = {
    thinking: calculateThinkingScore(preferences.thinkingPreference, agency.thinkingStyle),
    budget: calculateBudgetScore(preferences.budget, agency.budgetMin, agency.budgetMax),
    categories: calculateArrayScore(preferences.categories, agency.categories),
    industries: calculateArrayScore(preferences.industries || [], agency.industries),
    areas: calculateArrayScore(preferences.areas || [], agency.areas),
    keywords: calculateKeywordScore(preferences.keywords || [], agency.keywords, agency.description),
  };

  // Calculate weighted overall score
  const overallScore = Math.round(
    (scores.thinking * WEIGHTS.THINKING_STYLE +
     scores.budget * WEIGHTS.BUDGET +
     scores.categories * WEIGHTS.CATEGORIES +
     scores.industries * WEIGHTS.INDUSTRIES +
     scores.areas * WEIGHTS.AREAS +
     scores.keywords * WEIGHTS.KEYWORDS) / 100
  );

  // Generate explanations
  const whyMatched = generateWhyMatched(preferences, agency, scores);

  return {
    agency,
    thinkingMatchScore: scores.thinking,
    overallScore,
    whyMatched,
  };
}

/**
 * Match multiple agencies and sort by score
 */
export function matchAgencies(
  preferences: StartupPreferences,
  agencies: AgencyProfile[],
  minScore = 0
): MatchResult[] {
  const results = agencies
    .map(agency => calculateMatch(preferences, agency))
    .filter(result => result.overallScore >= minScore)
    .sort((a, b) => b.overallScore - a.overallScore);

  return results;
}
