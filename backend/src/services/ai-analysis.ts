import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { PainPoint, Insight } from '../models';
import { v4 as uuidv4 } from 'uuid';

export class AIAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  async analyzePainPoint(painPoint: PainPoint): Promise<Insight> {
    try {
      const prompt = this.buildAnalysisPrompt(painPoint);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert UX analyst and product manager. Analyze user behavior data and provide actionable insights and recommendations. Be specific, data-driven, and focus on practical solutions that can be implemented.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      return this.parseAIResponse(response, painPoint);
    } catch (error) {
      logger.error('Error analyzing pain point with AI:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(painPoint: PainPoint): string {
    const typeDescriptions: Record<string, string> = {
      dropoff: 'high user drop-off rate',
      cycle: 'users navigating in circles or repeated patterns',
      underused: 'feature or page with very low engagement',
      slow_interaction: 'users spending excessive time without progress',
      error: 'frequent errors or failed interactions',
    };

    return `
Analyze this user behavior pain point:

Type: ${typeDescriptions[painPoint.type]}
Location: ${painPoint.location}
Severity: ${painPoint.severity}
Affected Users: ${painPoint.affectedUsers} (${painPoint.affectedPercentage.toFixed(1)}%)
Description: ${painPoint.description}

Additional Metrics:
${JSON.stringify(painPoint.metrics, null, 2)}

Please provide:
1. A clear title for this issue (max 10 words)
2. A brief summary explaining what's happening and why it matters (2-3 sentences)
3. A specific, actionable recommendation to address this issue
4. The potential impact if this is fixed (1 sentence)
5. Estimated effort level (low/medium/high)
6. Category (onboarding/conversion/engagement/performance/usability)

Format your response as JSON with these exact keys:
{
  "title": "...",
  "summary": "...",
  "recommendation": "...",
  "impact": "...",
  "effort": "low|medium|high",
  "category": "..."
}
`;
  }

  private parseAIResponse(response: string, painPoint: PainPoint): Insight {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Map severity to priority
      const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
        high: 'high',
        medium: 'medium',
        low: 'low',
      };

      return {
        id: uuidv4(),
        painPointId: painPoint.id,
        title: parsed.title || 'Untitled Insight',
        summary: parsed.summary || painPoint.description,
        recommendation: parsed.recommendation || 'No recommendation provided',
        priority: priorityMap[painPoint.severity],
        impact: parsed.impact || 'Impact not specified',
        effort: parsed.effort || 'medium',
        category: parsed.category || 'usability',
        metrics: painPoint.metrics,
        createdAt: new Date(),
        status: 'new',
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      
      // Fallback insight
      return {
        id: uuidv4(),
        painPointId: painPoint.id,
        title: `${painPoint.type} Issue at ${painPoint.location}`,
        summary: painPoint.description,
        recommendation: 'Manual review required - AI analysis failed',
        priority: 'medium',
        impact: 'Unknown',
        effort: 'medium',
        category: 'usability',
        metrics: painPoint.metrics,
        createdAt: new Date(),
        status: 'new',
      };
    }
  }

  async generateSummaryInsights(
    painPoints: PainPoint[],
    analyticsData: any
  ): Promise<string> {
    try {
      const prompt = `
Based on the following analytics data and pain points, provide a high-level summary of the user experience:

Total Pain Points: ${painPoints.length}
Pain Points by Type: ${JSON.stringify(
        painPoints.reduce((acc, pp) => {
          acc[pp.type] = (acc[pp.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )}

Top Issues:
${painPoints
  .slice(0, 5)
  .map(pp => `- ${pp.description} (${pp.affectedPercentage.toFixed(1)}% affected)`)
  .join('\n')}

Analytics Summary:
${JSON.stringify(analyticsData, null, 2)}

Please provide:
1. Overall user experience assessment (1-2 sentences)
2. Top 3 areas needing immediate attention
3. Positive findings or improvements to highlight
4. Strategic recommendations for the product team

Keep the response concise and actionable.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a senior product analyst providing executive summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      });

      return completion.choices[0].message.content || 'Summary generation failed';
    } catch (error) {
      logger.error('Error generating summary insights:', error);
      return 'Failed to generate summary insights';
    }
  }

  async prioritizeInsights(insights: Insight[]): Promise<Insight[]> {
    try {
      const prompt = `
Given these product insights, rank them by priority considering:
- User impact (how many users affected and severity)
- Business value
- Implementation effort
- Dependencies

Insights:
${insights
  .map(
    (i, idx) =>
      `${idx + 1}. ${i.title}
   Impact: ${i.impact}
   Effort: ${i.effort}
   Affected Users: ${i.metrics.affectedUsers || 'Unknown'}`
  )
  .join('\n\n')}

Return just the numbers in order of priority (highest to lowest), separated by commas.
Example: 3,1,5,2,4
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        return insights;
      }

      const order = response
        .split(',')
        .map(n => parseInt(n.trim()) - 1)
        .filter(n => !isNaN(n) && n >= 0 && n < insights.length);

      // Reorder insights based on AI recommendation
      const prioritized = order.map(idx => insights[idx]);
      
      // Add any missing insights at the end
      insights.forEach((insight, idx) => {
        if (!order.includes(idx)) {
          prioritized.push(insight);
        }
      });

      return prioritized;
    } catch (error) {
      logger.error('Error prioritizing insights:', error);
      return insights; // Return original order if prioritization fails
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();