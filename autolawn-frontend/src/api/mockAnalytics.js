// AUTOLAWN/frontend/src/api/mockAnalytics.js
export const getMockAnalytics = () => ({
    customerGrowth: { labels: ['Jan', 'Feb', 'Mar'], data: [10, 20, 30] },
    revenue: { labels: ['Jan', 'Feb', 'Mar'], data: [1000, 1500, 2000] },
    jobStatusDistribution: { labels: ['Completed', 'Pending', 'Cancelled'], data: [50, 30, 20] },
    topPerformingEmployees: { labels: ['John', 'Jane', 'Doe'], data: [20, 15, 10] },
    jobCancellationRate: { labels: ['Cancellation Rate'], data: [10] },
    topServices: { labels: ['Mowing', 'Trimming', 'Fertilizing'], data: [500, 300, 200] },
    employeeDistribution: { labels: ['Unassigned', 'Crew A', 'Crew B'], data: [5, 3, 2] },
    customerSatisfaction: { labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'], data: [1, 2, 3, 4, 5], averageRating: 3.6 },
    averageLifetimeValue: { labels: ['Average Lifetime Value'], data: [1500] },
    customerLifetimeValue: { labels: ['Customer A', 'Customer B', 'Customer C'], data: [1000, 2000, 3000] },
  });
  