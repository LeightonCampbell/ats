export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-start-a-successful-daycare-in-california",
    title: "How to Start a Successful Daycare in California",
    excerpt:
      "A practical overview of licensing, home vs. center care, EMSA training requirements, and the steps California providers take before opening their doors.",
    publishedAt: "2026-06-02",
    readTime: "8 min read",
  },
];
