import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Layers } from 'lucide-react'

export interface PlaceholderCardProps {
  featureName: string
  endpoints?: string[]
}

export const PlaceholderCard: React.FC<PlaceholderCardProps> = ({
  featureName,
  endpoints = [],
}) => {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{featureName}</CardTitle>
          <CardDescription>
            Frontend foundation and routing are active. Business feature implementation is scheduled for the upcoming phase.
          </CardDescription>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
          <Layers className="w-3.5 h-3.5" />
          Phase 1 Foundation
        </span>
      </CardHeader>
      <CardContent>
        {endpoints.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Verified Backend API Mapping:
            </h4>
            <ul className="space-y-1.5 font-mono text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
              {endpoints.map((ep, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>{ep}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
