import axios from "axios";

/**
 * Web search tool using a search API
 * For production, you'd use a proper search API like SerpAPI, Google Custom Search, etc.
 * This is a simplified version using DuckDuckGo's instant answer API
 */
export async function webSearch(query: string): Promise<string> {
  try {
    // Using DuckDuckGo instant answer API as a free alternative
    // For production, consider using SerpAPI, Google Custom Search, or similar
    const response = await axios.get("https://api.duckduckgo.com/", {
      params: {
        q: query,
        format: "json",
        no_html: "1",
        skip_disambig: "1",
      },
      timeout: 10000,
    });

    const data = response.data;
    let results = "";

    if (data.AbstractText) {
      results += `Abstract: ${data.AbstractText}\n`;
    }
    if (data.Answer) {
      results += `Answer: ${data.Answer}\n`;
    }
    if (data.Definition) {
      results += `Definition: ${data.Definition}\n`;
    }
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      results += "Related Topics:\n";
      data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
        if (topic.Text) {
          results += `- ${topic.Text}\n`;
        }
      });
    }

    // If no results from DuckDuckGo, try a web search simulation
    if (!results.trim()) {
      // Fallback: return a message indicating search was performed
      results = `Searched for: "${query}". No instant answer available. Consider using a more specific search API for detailed results.`;
    }

    return results.trim() || `Search performed for: "${query}"`;
  } catch (error) {
    console.error("Web search error:", error);
    return `Error performing web search for: "${query}". Please try again or rephrase your query.`;
  }
}
