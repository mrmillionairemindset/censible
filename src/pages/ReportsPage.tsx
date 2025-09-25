import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Users, DollarSign, Target, Filter, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getSpendingByMember,
  getCategoryBreakdown,
  getMonthlyTrends,
  getReportSummary,
  type SpendingByMember,
  type CategoryBreakdown,
  type MonthlyTrend
} from '../lib/auth-utils';

interface ReportSummary {
  totalSpent: number;
  averageDailySpend: number;
  savingsRate: number;
  familyMembers: number;
}

const ReportsPage: React.FC = () => {
  const { household } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMember, setSelectedMember] = useState('all');
  const [reportType, setReportType] = useState<'overview' | 'members' | 'categories' | 'trends'>('overview');

  const [spendingByMember, setSpendingByMember] = useState<SpendingByMember[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary>({ totalSpent: 0, averageDailySpend: 0, savingsRate: 0, familyMembers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reports data from database
  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [memberData, categoryData, trendsData, summaryData] = await Promise.all([
        getSpendingByMember(selectedPeriod),
        getCategoryBreakdown(selectedPeriod),
        getMonthlyTrends(9),
        getReportSummary(selectedPeriod)
      ]);

      setSpendingByMember(memberData);
      setCategoryBreakdown(categoryData);
      setMonthlyTrends(trendsData);
      setReportSummary(summaryData);
    } catch (err) {
      console.error('Error loading reports data:', err);
      setError('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when period changes
  useEffect(() => {
    if (household?.household_id) {
      loadReportsData();
    } else {
      setSpendingByMember([]);
      setCategoryBreakdown([]);
      setMonthlyTrends([]);
      setReportSummary({ totalSpent: 0, averageDailySpend: 0, savingsRate: 0, familyMembers: 0 });
      setLoading(false);
    }
  }, [household?.household_id, selectedPeriod]);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${reportSummary.totalSpent.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Average</p>
              <p className="text-2xl font-bold text-gray-900">${reportSummary.averageDailySpend.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Savings Rate</p>
              <p className="text-2xl font-bold text-green-600">{reportSummary.savingsRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Family Members</p>
              <p className="text-2xl font-bold text-gray-900">{reportSummary.familyMembers}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Member Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Family Member</h3>
          <div className="space-y-4">
            {spendingByMember.map((member, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${member.color}`}></div>
                  <span className="font-medium text-gray-900">{member.member}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${member.amount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{member.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {categoryBreakdown.slice(0, 5).map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                  <span className="font-medium text-gray-900">{category.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${category.amount}</div>
                  <div className="text-sm text-gray-600">{category.percentage}%</div>
                </div>
              </div>
            ))}
            <button className="text-mint-600 hover:text-mint-700 text-sm font-medium">
              View all categories →
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <div className="overflow-x-auto">
          <div className="flex space-x-4 pb-4">
            {monthlyTrends.map((month, index) => (
              <div key={index} className="flex-shrink-0 text-center">
                <div className="w-20">
                  <div className="text-xs text-gray-500 mb-2">{month.month}</div>
                  <div className="relative h-32 bg-gray-100 rounded">
                    {/* Income bar */}
                    <div
                      className="absolute bottom-0 w-6 bg-green-500 rounded-t"
                      style={{ height: `${(month.income / 6000) * 100}%`, left: '2px' }}
                    ></div>
                    {/* Expenses bar */}
                    <div
                      className="absolute bottom-0 w-6 bg-red-500 rounded-t"
                      style={{ height: `${(month.expenses / 6000) * 100}%`, left: '10px' }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">${(month.income / 1000).toFixed(1)}k</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Income</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Expenses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Member Spending Analysis</h3>
        <p className="text-gray-600">Detailed breakdown of spending by family member</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {spendingByMember.map((member, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${member.color} rounded-full flex items-center justify-center text-white font-bold`}>
                  {member.member[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{member.member}</h4>
                  <p className="text-sm text-gray-600">{member.transactions} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">${member.amount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">{member.percentage}% of total</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average per transaction:</span>
                <span className="font-medium">${(member.amount / member.transactions).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Daily average:</span>
                <span className="font-medium">${(member.amount / 30).toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${member.color}`}
                  style={{ width: `${member.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Category Performance</h3>
        <p className="text-gray-600">Budget vs actual spending by category</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Category</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Budgeted</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Actual</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Variance</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">% of Budget</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Performance</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((category, index) => {
              const percentageOfBudget = (category.amount / category.budgeted) * 100;
              return (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                      <span className="font-medium text-gray-900">{category.category}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-gray-900">
                    ${category.budgeted}
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-gray-900">
                    ${category.amount}
                  </td>
                  <td className={`py-4 px-6 text-right font-medium ${
                    category.variance >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {category.variance >= 0 ? '+' : ''}${category.variance}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`font-medium ${
                      percentageOfBudget > 100 ? 'text-red-600' :
                      percentageOfBudget > 80 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {percentageOfBudget.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="w-16 mx-auto">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentageOfBudget > 100 ? 'bg-red-500' :
                            percentageOfBudget > 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentageOfBudget, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTrendsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Spending Trends</h3>
        <p className="text-gray-600">Track your family's financial patterns over time</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Monthly Income vs Expenses</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Month</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Income</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Expenses</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Savings</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Savings Rate</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrends.map((month, index) => {
                const savingsRate = (month.savings / month.income) * 100;
                return (
                  <tr key={index} className="border-b border-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">{month.month}</td>
                    <td className="py-3 text-right text-sm text-gray-900">${month.income.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm text-gray-900">${month.expenses.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm font-medium text-green-600">${month.savings.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm font-medium text-green-600">{savingsRate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Reports</h1>
          <p className="text-gray-600">Loading your reports...</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Reports</h1>
          <p className="text-gray-600">
            Track trends and analyze spending patterns
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center space-x-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'members', label: 'By Member', icon: Users },
            { id: 'categories', label: 'By Category', icon: PieChart },
            { id: 'trends', label: 'Trends', icon: TrendingUp }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  reportType === tab.id
                    ? 'border-mint-500 text-mint-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {reportType === 'overview' && renderOverviewTab()}
      {reportType === 'members' && renderMembersTab()}
      {reportType === 'categories' && renderCategoriesTab()}
      {reportType === 'trends' && renderTrendsTab()}
    </div>
  );
};

export default ReportsPage;