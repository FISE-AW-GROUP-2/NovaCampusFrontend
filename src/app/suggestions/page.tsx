"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Wand2, TrendingUp, Users, Target, DollarSign, Clock, ArrowRight, Lightbulb } from "lucide-react"

export default function SmartSuggestionsPage() {
  const suggestions = [
    {
      category: "Audience Targeting",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      items: [
        {
          title: "Expand to Tech Professionals",
          description: "Based on your current audience, tech professionals show 45% higher engagement",
          impact: "High",
          effort: "Medium",
        },
        {
          title: "Target Evening Hours",
          description: "Your audience is 3x more active between 7-9 PM",
          impact: "Medium",
          effort: "Low",
        },
      ],
    },
    {
      category: "Content Optimization",
      icon: Lightbulb,
      color: "from-purple-500 to-pink-500",
      items: [
        {
          title: "Add Video Content",
          description: "Campaigns with video see 80% more engagement in your niche",
          impact: "High",
          effort: "High",
        },
        {
          title: "Shorten Email Subject Lines",
          description: "Subject lines under 50 characters have 25% higher open rates",
          impact: "Medium",
          effort: "Low",
        },
      ],
    },
    {
      category: "Budget Allocation",
      icon: DollarSign,
      color: "from-emerald-500 to-green-500",
      items: [
        {
          title: "Increase Social Media Spend",
          description: "Social campaigns show 2.3x ROI compared to email",
          impact: "High",
          effort: "Low",
        },
        {
          title: "Reduce Display Ad Budget",
          description: "Display ads underperforming by 40% vs. benchmark",
          impact: "Medium",
          effort: "Low",
        },
      ],
    },
    {
      category: "Performance Boost",
      icon: TrendingUp,
      color: "from-orange-500 to-red-500",
      items: [
        {
          title: "A/B Test Call-to-Action",
          description: 'Try "Get Started Free" instead of "Sign Up Now"',
          impact: "Medium",
          effort: "Low",
        },
        {
          title: "Optimize Landing Pages",
          description: "Reduce load time by 2s to improve conversion by 15%",
          impact: "High",
          effort: "Medium",
        },
      ],
    },
  ]

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
      case "Medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-64">
        <Header
          title="Smart Suggestions"
          description="AI-powered recommendations to optimize your marketing campaigns."
          actions={
            <>
              <Button className="w-full sm:w-auto h-9 text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                <Wand2 className="w-4 h-4 mr-2" />
                Refresh Suggestions
              </Button>
            </>
          }
        />

        <div className="mt-4 md:mt-5 space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-foreground">Suggestions</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">24</p>
              <p className="text-xs text-muted-foreground mt-1">Active recommendations</p>
            </Card>

            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-foreground">Potential Gain</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">+32%</p>
              <p className="text-xs text-muted-foreground mt-1">Estimated ROI increase</p>
            </Card>

            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-foreground">Quick Wins</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">8</p>
              <p className="text-xs text-muted-foreground mt-1">Low effort, high impact</p>
            </Card>

            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-foreground">Implemented</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </Card>
          </div>

          <div className="space-y-4">
            {suggestions.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="p-4 md:p-6 bg-card border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{category.category}</h2>
                </div>
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <Card
                      key={itemIndex}
                      className="p-4 bg-background border-border hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(item.impact)}`}>
                              {item.impact} Impact
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-muted text-muted-foreground">
                              {item.effort} Effort
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 flex-shrink-0"
                        >
                          Apply
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
