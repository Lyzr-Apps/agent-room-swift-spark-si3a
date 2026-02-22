'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn, generateUUID } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FiPlus, FiSettings, FiUsers, FiSend, FiMessageSquare, FiSearch, FiTrash2, FiArrowLeft, FiChevronDown, FiChevronUp, FiActivity, FiCpu, FiUser, FiHash, FiLock, FiGlobe, FiArchive, FiX, FiZap, FiEdit3, FiLogIn, FiAlertCircle, FiShield, FiUserCheck, FiSmile, FiClock, FiCopy, FiKey, FiSun, FiMoon } from 'react-icons/fi'

// ============================================================
// TYPES
// ============================================================

interface RoomAgent {
  id: string
  name: string
  systemPrompt: string
  personality: string
  temperature: number
  topP: number
  responseLength: string
  trigger: 'mentions' | 'all' | 'proactive'
  frequency: string
  interAgentRules: 'reference' | 'independent'
  color: string
}

interface RoomUser {
  id: string
  name: string
  email: string
  role: 'participant' | 'observer' | 'moderator' | 'admin'
}

interface Message {
  id: string
  content: string
  sender: string
  senderType: 'agent' | 'user'
  agentId?: string
  timestamp: string
  confidence?: number
  tone?: string
  references?: string[]
}

interface Room {
  id: string
  name: string
  description: string
  visibility: 'public' | 'private'
  status: 'active' | 'archived'
  agents: RoomAgent[]
  users: RoomUser[]
  messages: Message[]
  createdAt: string
  lastActivity: string
  cloneCode: string
}

type ViewType = 'dashboard' | 'room-config' | 'discussion'

// ============================================================
// CONSTANTS
// ============================================================

const AGENT_ID = '699aa54eadf9a88c8206a794'

const AGENT_COLORS = [
  'hsl(0, 70%, 55%)',
  'hsl(210, 70%, 55%)',
  'hsl(150, 70%, 45%)',
  'hsl(45, 80%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(180, 60%, 45%)',
]

const PERSONALITIES = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'provocative', label: 'Provocative' },
  { value: 'supportive', label: 'Supportive' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'creative', label: 'Creative' },
]

const RESPONSE_LENGTHS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
  { value: 'unlimited', label: 'Unlimited' },
]

const FREQUENCIES = [
  { value: 'every', label: 'Every message' },
  { value: 'every-2nd', label: 'Every 2nd message' },
  { value: 'every-3rd', label: 'Every 3rd message' },
  { value: 'cooldown', label: 'Cooldown (30s)' },
]

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: 'Smileys', emojis: ['\u{1F600}', '\u{1F603}', '\u{1F604}', '\u{1F601}', '\u{1F605}', '\u{1F602}', '\u{1F923}', '\u{1F60A}', '\u{1F607}', '\u{1F642}', '\u{1F643}', '\u{1F609}', '\u{1F60C}', '\u{1F60D}', '\u{1F618}', '\u{1F617}', '\u{1F61A}', '\u{1F619}', '\u{1F60B}', '\u{1F61B}', '\u{1F61C}', '\u{1F92A}', '\u{1F61D}', '\u{1F911}', '\u{1F917}', '\u{1F914}', '\u{1F910}', '\u{1F928}', '\u{1F610}', '\u{1F611}', '\u{1F636}', '\u{1F60F}', '\u{1F612}', '\u{1F644}', '\u{1F62C}', '\u{1F925}'] },
  { label: 'Gestures', emojis: ['\u{1F44D}', '\u{1F44E}', '\u{1F44A}', '\u{270A}', '\u{1F91B}', '\u{1F91C}', '\u{1F44F}', '\u{1F64C}', '\u{1F450}', '\u{1F932}', '\u{1F91D}', '\u{1F64F}', '\u{270D}\uFE0F', '\u{1F485}', '\u{1F933}', '\u{1F4AA}', '\u{1F9B5}', '\u{1F9B6}', '\u{1F442}', '\u{1F443}', '\u{1F440}', '\u{1F441}\uFE0F', '\u{1F445}', '\u{1F444}', '\u{1F44B}', '\u{1F91A}', '\u{1F590}\uFE0F', '\u{270B}', '\u{1F596}', '\u{1F44C}', '\u{270C}\uFE0F', '\u{1F91E}', '\u{1F91F}', '\u{1F918}', '\u{1F448}', '\u{1F449}'] },
  { label: 'Objects', emojis: ['\u{2764}\uFE0F', '\u{1F4A1}', '\u{1F525}', '\u{2B50}', '\u{1F31F}', '\u{1F4AF}', '\u{1F389}', '\u{1F388}', '\u{1F381}', '\u{1F3C6}', '\u{1F947}', '\u{1F948}', '\u{1F949}', '\u{1F4DA}', '\u{1F4DD}', '\u{1F4CB}', '\u{1F4CA}', '\u{1F4C8}', '\u{1F4C9}', '\u{1F4BB}', '\u{1F4F1}', '\u{2699}\uFE0F', '\u{1F527}', '\u{1F512}', '\u{1F513}', '\u{1F4E7}', '\u{1F4AC}', '\u{1F4AD}', '\u{1F6A8}', '\u{1F514}', '\u{23F0}', '\u{1F680}', '\u{2708}\uFE0F', '\u{1F3AF}', '\u{1F9E9}', '\u{1F4A4}'] },
  { label: 'Reactions', emojis: ['\u{2705}', '\u{274C}', '\u{2757}', '\u{2753}', '\u{1F4A2}', '\u{1F4A5}', '\u{1F4AB}', '\u{1F4A6}', '\u{1F4A8}', '\u{1F4A3}', '\u{1F4AC}', '\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F', '\u{1F5E8}\uFE0F', '\u{1F5EF}\uFE0F', '\u{1F44B}', '\u{1F44D}', '\u{1F44E}', '\u{1F44F}', '\u{1F64C}', '\u{1F64F}', '\u{1F4AA}', '\u{1F91D}', '\u{270C}\uFE0F', '\u{1F918}', '\u{1F44C}', '\u{1F525}', '\u{2764}\uFE0F', '\u{1F49B}', '\u{1F49A}', '\u{1F499}', '\u{1F49C}', '\u{1F5A4}', '\u{1F90D}', '\u{1F90E}', '\u{2763}\uFE0F'] },
]

// ============================================================
// SAMPLE DATA FACTORY
// ============================================================

function createSampleData(): Room[] {
  return [
    {
      id: 'sample-room-1',
      name: 'Product Strategy Review',
      description: 'Multi-perspective analysis of Q2 product roadmap with research, design, and engineering viewpoints.',
      visibility: 'private',
      status: 'active',
      agents: [
        {
          id: 'agent-ra-1',
          name: 'ResearchAnalyst',
          systemPrompt: 'You are a meticulous research analyst. Provide data-driven insights, cite relevant studies, and challenge assumptions with evidence. Always back claims with references.',
          personality: 'analytical',
          temperature: 0.3,
          topP: 0.9,
          responseLength: 'long',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[0],
        },
        {
          id: 'agent-cd-1',
          name: 'CreativeDirector',
          systemPrompt: 'You are an imaginative creative director. Think outside the box, propose bold ideas, and push boundaries. Challenge conventional thinking with fresh perspectives.',
          personality: 'creative',
          temperature: 0.8,
          topP: 0.95,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[1],
        },
        {
          id: 'agent-da-1',
          name: 'DevilsAdvocate',
          systemPrompt: 'You challenge every idea presented. Find flaws, risks, and weaknesses. Be constructively critical while maintaining professionalism.',
          personality: 'provocative',
          temperature: 0.6,
          topP: 0.85,
          responseLength: 'medium',
          trigger: 'mentions',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[4],
        },
      ],
      users: [
        { id: 'user-1', name: 'Sarah Chen', email: 'sarah@company.com', role: 'moderator' },
        { id: 'user-2', name: 'Marcus Webb', email: 'marcus@company.com', role: 'participant' },
      ],
      messages: [
        {
          id: 'msg-1',
          content: 'What should our top priority be for the Q2 product roadmap? We need to balance user growth with monetization.',
          sender: 'Sarah Chen',
          senderType: 'user',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg-2',
          content: 'Based on current market data, **user retention** should take precedence over new user acquisition. Our churn rate of 12% is above industry average (8-10%). I recommend focusing on:\n\n1. **Onboarding optimization** - reduce time-to-value\n2. **Feature discovery** - users only engage with 30% of available features\n3. **Personalization engine** - tailored experiences increase retention by 25%\n\nMonetization will naturally follow improved retention metrics.',
          sender: 'ResearchAnalyst',
          senderType: 'agent',
          agentId: 'agent-ra-1',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          confidence: 0.87,
          tone: 'analytical',
          references: ['McKinsey Digital Report 2024', 'Internal Analytics Dashboard Q1'],
        },
        {
          id: 'msg-3',
          content: 'I agree retention matters, but what if we flip the script entirely? Instead of fixing churn, let us **make the product so remarkable that users become advocates**. Think about it:\n\n- A **social sharing layer** that turns usage into community\n- **Collaborative workspaces** that create network effects\n- A **creator program** that rewards power users\n\nThe best retention strategy is building something people want to tell others about.',
          sender: 'CreativeDirector',
          senderType: 'agent',
          agentId: 'agent-cd-1',
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          confidence: 0.72,
          tone: 'creative',
          references: ['Viral Loop Strategy - Andrew Chen'],
        },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastActivity: new Date(Date.now() - 3400000).toISOString(),
      cloneCode: 'strategy2024',
    },
    {
      id: 'sample-room-2',
      name: 'Tech Architecture Planning',
      description: 'Evaluating microservices migration strategy with security, performance, and cost perspectives.',
      visibility: 'public',
      status: 'active',
      agents: [
        {
          id: 'agent-se-1',
          name: 'SecurityExpert',
          systemPrompt: 'You are a cybersecurity specialist. Evaluate all proposals through a security lens. Identify vulnerabilities, compliance risks, and recommend security-first approaches.',
          personality: 'formal',
          temperature: 0.2,
          topP: 0.8,
          responseLength: 'long',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'independent',
          color: AGENT_COLORS[2],
        },
        {
          id: 'agent-co-1',
          name: 'CostOptimizer',
          systemPrompt: 'You analyze everything from a cost-efficiency perspective. Provide ROI calculations, budget implications, and cost-saving alternatives.',
          personality: 'analytical',
          temperature: 0.3,
          topP: 0.85,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[3],
        },
      ],
      users: [
        { id: 'user-3', name: 'Alex Turner', email: 'alex@company.com', role: 'moderator' },
      ],
      messages: [],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      lastActivity: new Date(Date.now() - 172800000).toISOString(),
      cloneCode: 'techarch99',
    },
    {
      id: 'sample-room-3',
      name: 'Marketing Campaign Brainstorm',
      description: 'Open brainstorming session for upcoming product launch campaign with brand and growth agents.',
      visibility: 'public',
      status: 'active',
      agents: [
        {
          id: 'agent-bs-1',
          name: 'BrandStrategist',
          systemPrompt: 'You are a brand strategy expert. Focus on brand positioning, messaging frameworks, and audience resonance. Ensure all ideas align with brand values.',
          personality: 'supportive',
          temperature: 0.5,
          topP: 0.9,
          responseLength: 'medium',
          trigger: 'all',
          frequency: 'every',
          interAgentRules: 'reference',
          color: AGENT_COLORS[5],
        },
      ],
      users: [
        { id: 'user-4', name: 'Jamie Ross', email: 'jamie@company.com', role: 'participant' },
      ],
      messages: [],
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      lastActivity: new Date(Date.now() - 43200000).toISOString(),
      cloneCode: 'brand2024',
    },
  ]
}

// ============================================================
// HELPERS
// ============================================================

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function formatTime(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function timeAgo(iso: string): string {
  if (!iso) return ''
  try {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const diff = now - then
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  } catch {
    return ''
  }
}

function getInitial(name: string): string {
  return (name?.charAt(0) ?? 'A').toUpperCase()
}

function extractAgentResponseText(result: any): string {
  // Try multiple paths for extracting text from agent response
  if (!result) return ''

  // Path 1: structured JSON response
  const r = result?.response?.result
  if (r) {
    if (typeof r === 'string') return r
    if (r.response) return String(r.response)
    if (r.text) return String(r.text)
    if (r.message) return String(r.message)
    if (r.content) return String(r.content)
    if (r.answer) return String(r.answer)
  }

  // Path 2: direct message field
  if (result?.response?.message && typeof result.response.message === 'string') {
    return result.response.message
  }

  // Path 3: raw_response string
  if (result?.raw_response && typeof result.raw_response === 'string') {
    try {
      const parsed = JSON.parse(result.raw_response)
      if (parsed?.response) return String(parsed.response)
      if (parsed?.text) return String(parsed.text)
      if (parsed?.message) return String(parsed.message)
    } catch {
      // raw_response might be plain text
      return result.raw_response
    }
  }

  // Path 4: result is the response object directly
  if (result?.response && typeof result.response === 'string') {
    return result.response
  }

  return ''
}

function extractAgentMetadata(result: any, fallbackName: string, fallbackPersonality: string) {
  const r = result?.response?.result
  return {
    agent_name: r?.agent_name || fallbackName,
    confidence: typeof r?.confidence === 'number' ? r.confidence : 0,
    tone: r?.tone || fallbackPersonality,
    references: Array.isArray(r?.references) ? r.references.filter((ref: any) => typeof ref === 'string' && ref.trim()) : [],
  }
}

// ============================================================
// ERROR BOUNDARY
// ============================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// SMALL REUSABLE PIECES
// ============================================================

function AgentAvatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-6 w-6 text-xs' : size === 'lg' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-sm'
  return (
    <div className={cn('flex items-center justify-center font-bold text-white flex-shrink-0', cls)} style={{ backgroundColor: color }}>
      {getInitial(name)}
    </div>
  )
}

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-6 w-6 text-xs' : size === 'lg' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-sm'
  return (
    <div className={cn('flex items-center justify-center font-bold bg-secondary text-secondary-foreground flex-shrink-0', cls)}>
      {getInitial(name)}
    </div>
  )
}

function PersonalityBadge({ personality }: { personality: string }) {
  return <Badge variant="outline" className="text-[10px] capitalize border-border h-4 px-1.5">{personality}</Badge>
}

function TypingDots({ agentName, color }: { agentName: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: color || 'hsl(0,0%,55%)', animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: color || 'hsl(0,0%,55%)', animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: color || 'hsl(0,0%,55%)', animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-muted-foreground tracking-tight">{agentName} is thinking...</span>
    </div>
  )
}

// ============================================================
// USER IDENTITY ENTRY WITH ROLE SELECTION
// ============================================================

const ADMIN_PASSCODE = 'admin123'

function UserIdentityEntry({ onJoin }: { onJoin: (name: string, role: 'admin' | 'participant') => void }) {
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'participant' | null>(null)
  const [adminCode, setAdminCode] = useState('')
  const [codeError, setCodeError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2 || !selectedRole) return

    if (selectedRole === 'admin') {
      if (adminCode !== ADMIN_PASSCODE) {
        setCodeError('Invalid admin passcode. Try again or enter as a participant.')
        return
      }
    }

    onJoin(name.trim(), selectedRole)
  }

  const canSubmit = name.trim().length >= 2 && selectedRole !== null && (selectedRole === 'participant' || adminCode.length > 0)

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(0, 70%, 55%)' }}>
            <FiMessageSquare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-serif">AgentRoom</h1>
          <p className="text-sm text-muted-foreground mt-2 tracking-tight leading-relaxed text-center">
            Multi-agent collaborative discussion platform.
            Choose how you want to join.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium tracking-tight">Your Display Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Sarah Chen"
              className="shadow-none"
              autoFocus
              minLength={2}
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium tracking-tight">Select Your Role</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setSelectedRole('admin'); setCodeError('') }}
                className={cn(
                  'p-4 border text-left transition-colors',
                  selectedRole === 'admin'
                    ? 'border-foreground bg-secondary'
                    : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiShield className="h-4 w-4" style={selectedRole === 'admin' ? { color: 'hsl(0, 70%, 55%)' } : {}} />
                  <span className="text-sm font-semibold tracking-tight">Admin</span>
                </div>
                <p className="text-xs text-muted-foreground tracking-tight leading-relaxed">
                  Create rooms, configure agents, manage users and room settings
                </p>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('participant'); setCodeError('') }}
                className={cn(
                  'p-4 border text-left transition-colors',
                  selectedRole === 'participant'
                    ? 'border-foreground bg-secondary'
                    : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiUserCheck className="h-4 w-4" style={selectedRole === 'participant' ? { color: 'hsl(0, 70%, 55%)' } : {}} />
                  <span className="text-sm font-semibold tracking-tight">Participant</span>
                </div>
                <p className="text-xs text-muted-foreground tracking-tight leading-relaxed">
                  Join rooms, chat with agents, view discussions and agent details
                </p>
              </button>
            </div>
          </div>

          {selectedRole === 'admin' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium tracking-tight">Admin Passcode</Label>
              <Input
                type="password"
                value={adminCode}
                onChange={e => { setAdminCode(e.target.value); setCodeError('') }}
                placeholder="Enter admin passcode"
                className="shadow-none"
              />
              {codeError && (
                <p className="text-xs tracking-tight flex items-center gap-1" style={{ color: 'hsl(0, 70%, 55%)' }}>
                  <FiAlertCircle className="h-3 w-3" />
                  {codeError}
                </p>
              )}
              <p className="text-xs text-muted-foreground tracking-tight">
                Contact your organization administrator for the passcode
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full shadow-none gap-2"
            style={canSubmit ? { backgroundColor: 'hsl(0, 70%, 55%)', color: 'white' } : {}}
          >
            {selectedRole === 'admin' ? <FiShield className="h-4 w-4" /> : <FiLogIn className="h-4 w-4" />}
            {selectedRole === 'admin' ? 'Enter as Admin' : selectedRole === 'participant' ? 'Enter as Participant' : 'Select a role'}
          </Button>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// DASHBOARD VIEW
// ============================================================

function DashboardView({
  rooms,
  onSelect,
  onCreate,
  onConfigure,
  onViewHistory,
  onCloneRoom,
  searchQuery,
  setSearchQuery,
  isAdmin,
}: {
  rooms: Room[]
  onSelect: (room: Room) => void
  onCreate: () => void
  onConfigure: (room: Room) => void
  onViewHistory: (room: Room) => void
  onCloneRoom: (room: Room) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  isAdmin: boolean
}) {
  const filtered = rooms.filter(
    r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Discussion Rooms</h1>
            <p className="text-sm text-muted-foreground mt-1 tracking-tight leading-relaxed">
              {isAdmin ? 'Manage and configure collaborative AI discussion rooms' : 'Join a discussion room to collaborate with AI agents'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={onCreate} className="shadow-none gap-2">
              <FiPlus className="h-4 w-4" />
              Create Room
            </Button>
          )}
        </div>

        <div className="relative mb-6">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search rooms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 shadow-none" />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 bg-secondary flex items-center justify-center mb-4">
              <FiMessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight font-serif mb-2">No rooms yet</h3>
            <p className="text-sm text-muted-foreground tracking-tight leading-relaxed max-w-sm">
              {isAdmin
                ? 'Create your first discussion room to start collaborative AI conversations with multiple agent perspectives.'
                : 'No rooms are available. Ask an admin to create a room and add you as a participant.'}
            </p>
            {isAdmin && (
              <Button onClick={onCreate} className="shadow-none gap-2 mt-6">
                <FiPlus className="h-4 w-4" />
                Create Your First Room
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(room => (
              <Card key={room.id} className="shadow-none border border-border hover:border-foreground/30 transition-colors cursor-pointer group" onClick={() => onSelect(room)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold tracking-tight font-serif truncate">{room.name}</CardTitle>
                      <CardDescription className="text-xs mt-1 tracking-tight leading-relaxed line-clamp-2">{room.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="shadow-none h-7 w-7 p-0" title="Clone room" onClick={e => { e.stopPropagation(); onCloneRoom(room) }}>
                        <FiCopy className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="sm" className="shadow-none h-7 w-7 p-0" title="View history" onClick={e => { e.stopPropagation(); onViewHistory(room) }}>
                            <FiClock className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="shadow-none h-7 w-7 p-0" title="Configure" onClick={e => { e.stopPropagation(); onConfigure(room) }}>
                            <FiSettings className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><FiCpu className="h-3 w-3" />{room.agents.length} agent{room.agents.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><FiUser className="h-3 w-3" />{room.users.length} user{room.users.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1">{room.visibility === 'private' ? <FiLock className="h-3 w-3" /> : <FiGlobe className="h-3 w-3" />}{room.visibility}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('inline-block h-2 w-2 rounded-full', room.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground')} />
                      <span className="text-xs text-muted-foreground capitalize">{room.status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(room.lastActivity)}</span>
                  </div>
                  {room.agents.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {room.agents.map(agent => (
                        <span key={agent.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: agent.color }} />
                          {agent.name}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// ROOM CONFIG VIEW
// ============================================================

function RoomConfigView({
  room,
  onBack,
  onSave,
  onLaunch,
}: {
  room: Room
  onBack: () => void
  onSave: (room: Room) => void
  onLaunch: (room: Room) => void
}) {
  const [editRoom, setEditRoom] = useState<Room>(() => ({
    ...room,
    agents: room.agents.map(a => ({ ...a })),
    users: room.users.map(u => ({ ...u })),
  }))
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(editRoom.agents.length > 0 ? editRoom.agents[0].id : null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'participant' | 'observer' | 'moderator' | 'admin'>('participant')
  const [saved, setSaved] = useState(false)

  const selectedAgent = editRoom.agents.find(a => a.id === selectedAgentId) ?? null

  function updateAgent(agentId: string, updates: Partial<RoomAgent>) {
    setEditRoom(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === agentId ? { ...a, ...updates } : a),
    }))
    setSaved(false)
  }

  function addAgent() {
    const colorIdx = editRoom.agents.length % AGENT_COLORS.length
    const newAgent: RoomAgent = {
      id: generateUUID(),
      name: 'NewAgent',
      systemPrompt: '',
      personality: 'analytical',
      temperature: 0.5,
      topP: 0.9,
      responseLength: 'medium',
      trigger: 'all',
      frequency: 'every',
      interAgentRules: 'reference',
      color: AGENT_COLORS[colorIdx],
    }
    setEditRoom(prev => ({ ...prev, agents: [...prev.agents, newAgent] }))
    setSelectedAgentId(newAgent.id)
    setSaved(false)
  }

  function removeAgent(agentId: string) {
    setEditRoom(prev => {
      const updated = prev.agents.filter(a => a.id !== agentId)
      return { ...prev, agents: updated }
    })
    if (selectedAgentId === agentId) {
      const remaining = editRoom.agents.filter(a => a.id !== agentId)
      setSelectedAgentId(remaining.length > 0 ? remaining[0].id : null)
    }
    setSaved(false)
  }

  function addUser() {
    if (!inviteEmail.trim()) return
    const newUser: RoomUser = {
      id: generateUUID(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
    }
    setEditRoom(prev => ({ ...prev, users: [...prev.users, newUser] }))
    setInviteEmail('')
    setSaved(false)
  }

  function removeUser(userId: string) {
    setEditRoom(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId) }))
    setSaved(false)
  }

  function handleSave() {
    onSave(editRoom)
    setSaved(true)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="shadow-none gap-1">
            <FiArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-xl font-bold tracking-tight font-serif">Configure Room</h1>
          <span className="text-sm text-muted-foreground tracking-tight">- {editRoom.name}</span>
          {saved && <Badge variant="outline" className="text-xs border-green-500 text-green-500">Saved</Badge>}
        </div>

        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="w-full justify-start bg-secondary">
            <TabsTrigger value="agents" className="gap-1.5"><FiCpu className="h-3.5 w-3.5" />Agents</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5"><FiUsers className="h-3.5 w-3.5" />Users</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><FiSettings className="h-3.5 w-3.5" />Settings</TabsTrigger>
          </TabsList>

          {/* AGENTS TAB */}
          <TabsContent value="agents" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold tracking-tight">Configured Agents</h3>
                  <Button variant="outline" size="sm" onClick={addAgent} className="shadow-none gap-1 h-7 text-xs">
                    <FiPlus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {editRoom.agents.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border">
                      <FiCpu className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground tracking-tight">No agents configured yet.</p>
                      <p className="text-xs text-muted-foreground tracking-tight mt-1">Click Add to create your first agent.</p>
                    </div>
                  ) : (
                    editRoom.agents.map(agent => (
                      <div key={agent.id} className={cn('flex items-center gap-3 p-3 border border-border cursor-pointer transition-colors', selectedAgentId === agent.id ? 'bg-secondary border-foreground/30' : 'hover:bg-secondary/50')} onClick={() => setSelectedAgentId(agent.id)}>
                        <AgentAvatar name={agent.name} color={agent.color} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium tracking-tight truncate">{agent.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <PersonalityBadge personality={agent.personality} />
                            <span className="text-[10px] text-muted-foreground capitalize">{agent.trigger}</span>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); removeAgent(agent.id) }} className="h-6 w-6 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                          <FiTrash2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                {selectedAgent ? (
                  <Card className="shadow-none border border-border">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <AgentAvatar name={selectedAgent.name} color={selectedAgent.color} />
                        <div>
                          <CardTitle className="text-base font-bold tracking-tight font-serif">Agent Configuration</CardTitle>
                          <CardDescription className="text-xs tracking-tight">Configure behavior for {selectedAgent.name}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium tracking-tight">Agent Name</Label>
                        <Input value={selectedAgent.name} onChange={e => updateAgent(selectedAgent.id, { name: e.target.value.replace(/\s/g, '') })} className="shadow-none" />
                        <p className="text-[10px] text-muted-foreground tracking-tight">No spaces allowed. Used for @mentions (e.g., @{selectedAgent.name})</p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium tracking-tight">System Prompt</Label>
                          <span className="text-xs text-muted-foreground font-mono">{selectedAgent.systemPrompt.length} chars</span>
                        </div>
                        <Textarea value={selectedAgent.systemPrompt} onChange={e => updateAgent(selectedAgent.id, { systemPrompt: e.target.value })} rows={5} className="shadow-none text-sm" placeholder="Define this agent's behavior, expertise, and response style..." />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium tracking-tight">Personality / Tone</Label>
                        <Select value={selectedAgent.personality} onValueChange={v => updateAgent(selectedAgent.id, { personality: v })}>
                          <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PERSONALITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium tracking-tight">Temperature</Label>
                            <span className="text-xs font-mono text-muted-foreground">{selectedAgent.temperature.toFixed(2)}</span>
                          </div>
                          <Slider value={[selectedAgent.temperature]} onValueChange={v => updateAgent(selectedAgent.id, { temperature: v[0] })} min={0} max={1} step={0.05} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium tracking-tight">Top P</Label>
                            <span className="text-xs font-mono text-muted-foreground">{selectedAgent.topP.toFixed(2)}</span>
                          </div>
                          <Slider value={[selectedAgent.topP]} onValueChange={v => updateAgent(selectedAgent.id, { topP: v[0] })} min={0} max={1} step={0.05} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium tracking-tight">Response Length</Label>
                        <Select value={selectedAgent.responseLength} onValueChange={v => updateAgent(selectedAgent.id, { responseLength: v })}>
                          <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {RESPONSE_LENGTHS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium tracking-tight">Trigger Rules</Label>
                        <RadioGroup value={selectedAgent.trigger} onValueChange={v => updateAgent(selectedAgent.id, { trigger: v as RoomAgent['trigger'] })}>
                          <div className="flex items-center gap-2"><RadioGroupItem value="mentions" id={`t-m-${selectedAgent.id}`} /><Label htmlFor={`t-m-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">@mentions only - responds only when tagged</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="all" id={`t-a-${selectedAgent.id}`} /><Label htmlFor={`t-a-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">All messages - responds to every message</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="proactive" id={`t-p-${selectedAgent.id}`} /><Label htmlFor={`t-p-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">Proactive - responds to all and may interject</Label></div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium tracking-tight">Frequency</Label>
                        <Select value={selectedAgent.frequency} onValueChange={v => updateAgent(selectedAgent.id, { frequency: v })}>
                          <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium tracking-tight">Inter-Agent Rules</Label>
                        <RadioGroup value={selectedAgent.interAgentRules} onValueChange={v => updateAgent(selectedAgent.id, { interAgentRules: v as RoomAgent['interAgentRules'] })}>
                          <div className="flex items-center gap-2"><RadioGroupItem value="reference" id={`ir-r-${selectedAgent.id}`} /><Label htmlFor={`ir-r-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">Can reference other agents responses</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="independent" id={`ir-i-${selectedAgent.id}`} /><Label htmlFor={`ir-i-${selectedAgent.id}`} className="text-xs tracking-tight cursor-pointer">Independent only</Label></div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border">
                    <FiCpu className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground tracking-tight">Select an agent to configure or add a new one</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="mt-4">
            <Card className="shadow-none border border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold tracking-tight font-serif">Invite Users</CardTitle>
                <CardDescription className="text-xs tracking-tight">Add participants, observers, or moderators to this room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Email address" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="shadow-none flex-1" />
                  <Select value={inviteRole} onValueChange={v => setInviteRole(v as typeof inviteRole)}>
                    <SelectTrigger className="shadow-none w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="participant">Participant</SelectItem>
                      <SelectItem value="observer">Observer</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addUser} className="shadow-none gap-1" disabled={!inviteEmail.trim()}>
                    <FiPlus className="h-4 w-4" />
                    Invite
                  </Button>
                </div>
                <Separator />
                {editRoom.users.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 tracking-tight">No users invited yet</p>
                ) : (
                  <div className="space-y-2">
                    {editRoom.users.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 border border-border">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium tracking-tight">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-xs" style={user.role === 'admin' ? { borderColor: 'hsl(0, 70%, 55%)', color: 'hsl(0, 70%, 55%)' } : {}}>
                            {user.role === 'admin' && <FiShield className="h-2.5 w-2.5 mr-1" />}
                            {user.role}
                          </Badge>
                          <button onClick={() => removeUser(user.id)} className="h-6 w-6 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                            <FiTrash2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="mt-4">
            <Card className="shadow-none border border-border">
              <CardHeader>
                <CardTitle className="text-base font-bold tracking-tight font-serif">Room Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-tight">Room Name</Label>
                  <Input value={editRoom.name} onChange={e => { setEditRoom(prev => ({ ...prev, name: e.target.value })); setSaved(false) }} className="shadow-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-tight">Description</Label>
                  <Textarea value={editRoom.description} onChange={e => { setEditRoom(prev => ({ ...prev, description: e.target.value })); setSaved(false) }} rows={3} className="shadow-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-tight">Visibility</Label>
                  <Select value={editRoom.visibility} onValueChange={v => { setEditRoom(prev => ({ ...prev, visibility: v as Room['visibility'] })); setSaved(false) }}>
                    <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-tight flex items-center gap-1">
                    <FiKey className="h-3 w-3" />
                    Clone Code
                  </Label>
                  <Input
                    value={editRoom.cloneCode}
                    onChange={e => { setEditRoom(prev => ({ ...prev, cloneCode: e.target.value })); setSaved(false) }}
                    placeholder="Set a code to allow users to clone this room"
                    className="shadow-none"
                  />
                  <p className="text-xs text-muted-foreground tracking-tight">
                    Users who know this code can create a copy of this room with all agents. Leave empty to disable cloning.
                  </p>
                </div>
                <Separator />
                <div className="flex items-center justify-between p-3 border border-border">
                  <div>
                    <p className="text-sm font-medium tracking-tight">Archive Room</p>
                    <p className="text-xs text-muted-foreground tracking-tight">Archived rooms are read-only</p>
                  </div>
                  <Button variant="outline" size="sm" className="shadow-none gap-1 text-xs" onClick={() => { setEditRoom(prev => ({ ...prev, status: prev.status === 'active' ? 'archived' : 'active' })); setSaved(false) }}>
                    <FiArchive className="h-3 w-3" />
                    {editRoom.status === 'active' ? 'Archive' : 'Unarchive'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleSave} className="shadow-none">Save Changes</Button>
          <Button onClick={() => onLaunch(editRoom)} className="shadow-none gap-1" disabled={editRoom.agents.length === 0} style={{ backgroundColor: 'hsl(0, 70%, 55%)', color: 'white' }}>
            <FiZap className="h-4 w-4" />
            Launch Room
          </Button>
        </div>
        {editRoom.agents.length === 0 && (
          <p className="text-xs text-muted-foreground text-right mt-2 tracking-tight flex items-center justify-end gap-1">
            <FiAlertCircle className="h-3 w-3" />
            Add at least one agent before launching
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// DISCUSSION VIEW
// ============================================================

function DiscussionView({
  rooms,
  selectedRoom,
  setSelectedRoom,
  updateRoom,
  isAdmin,
  userName,
}: {
  rooms: Room[]
  selectedRoom: Room
  setSelectedRoom: (room: Room) => void
  updateRoom: (updated: Room) => void
  isAdmin: boolean
  userName: string
}) {
  const [messageInput, setMessageInput] = useState('')
  const [typingAgents, setTypingAgents] = useState<string[]>([])
  const [showMentionPopover, setShowMentionPopover] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionCursorPos, setMentionCursorPos] = useState(0)
  const [agentDetailId, setAgentDetailId] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [agentsOpen, setAgentsOpen] = useState(true)
  const [usersOpen, setUsersOpen] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiCategory, setEmojiCategory] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const roomRef = useRef<Room>(selectedRoom)

  // Keep roomRef in sync
  useEffect(() => {
    roomRef.current = selectedRoom
  }, [selectedRoom])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [selectedRoom.messages.length, typingAgents.length, scrollToBottom])

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  function insertEmoji(emoji: string) {
    setMessageInput(prev => prev + emoji)
    setShowEmojiPicker(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const detailAgent = selectedRoom.agents.find(a => a.id === agentDetailId) ?? null

  // Parse @mentions from message - matches agent names (no spaces in names)
  function parseMentions(text: string): string[] {
    const mentions: string[] = []
    const regex = /@(\w+)/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      mentions.push(match[1])
    }
    return mentions
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setMessageInput(val)

    const cursorPos = e.target.selectionStart ?? val.length
    const textBeforeCursor = val.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
      const filterText = textBeforeCursor.slice(atIndex + 1)
      if (filterText.length < 30 && !filterText.includes(' ')) {
        setShowMentionPopover(true)
        setMentionFilter(filterText.toLowerCase())
        setMentionCursorPos(atIndex)
        return
      }
    }
    setShowMentionPopover(false)
    setMentionFilter('')
  }

  function insertMention(agentName: string) {
    const before = messageInput.slice(0, mentionCursorPos)
    // Find the end of partial mention text after the @
    const afterAt = messageInput.slice(mentionCursorPos)
    const endOfMention = afterAt.match(/^@\w*/)
    const cleanAfter = endOfMention ? afterAt.slice(endOfMention[0].length) : afterAt
    const newVal = `${before}@${agentName} ${cleanAfter}`
    setMessageInput(newVal)
    setShowMentionPopover(false)
    setMentionFilter('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function filteredMentionAgents(): RoomAgent[] {
    return selectedRoom.agents.filter(a => a.name.toLowerCase().includes(mentionFilter))
  }

  function getRespondingAgents(userMessage: string): RoomAgent[] {
    const mentions = parseMentions(userMessage)
    const result: RoomAgent[] = []

    // Check which agents are specifically mentioned
    const mentionedAgents: RoomAgent[] = []
    for (const agent of selectedRoom.agents) {
      const isMentioned = mentions.some(m => agent.name.toLowerCase() === m.toLowerCase())
      if (isMentioned) {
        mentionedAgents.push(agent)
      }
    }

    // If any agents are @mentioned, only they respond
    if (mentionedAgents.length > 0) {
      return mentionedAgents
    }

    // If no @mentions at all, agents with trigger "all" or "proactive" respond
    if (mentions.length === 0) {
      for (const agent of selectedRoom.agents) {
        if (agent.trigger === 'all' || agent.trigger === 'proactive') {
          result.push(agent)
        }
      }
    }

    return result
  }

  function buildContext(): string {
    const recent = selectedRoom.messages.slice(-10)
    if (recent.length === 0) return '(No prior conversation)'
    return recent.map(m => `[${m.sender}]: ${m.content}`).join('\n')
  }

  async function callRoomAgent(agent: RoomAgent, userMessage: string, context: string): Promise<{ content: string; agent_name: string; confidence: number; tone: string; references: string[] } | null> {
    const prompt = `[System Configuration]
Agent Name: ${agent.name}
Personality: ${agent.personality}
Response Style: ${agent.responseLength}
${agent.systemPrompt ? `System Prompt: ${agent.systemPrompt}` : ''}

[Conversation Context]
${context}

[User Message from ${userName}]
${userMessage}

IMPORTANT: Respond as ${agent.name} with a ${agent.personality} tone. Your agent_name in the JSON response MUST be "${agent.name}". Keep your response ${agent.responseLength === 'short' ? 'concise (2-3 sentences)' : agent.responseLength === 'medium' ? 'moderate (1-2 paragraphs)' : agent.responseLength === 'long' ? 'detailed and thorough' : 'as long as needed'}.`

    const sessionId = `room-${selectedRoom.id}-agent-${agent.id}`

    try {
      const result = await callAIAgent(prompt, AGENT_ID, { session_id: sessionId })

      if (result && result.success) {
        const text = extractAgentResponseText(result)
        const meta = extractAgentMetadata(result, agent.name, agent.personality)

        return {
          content: text || 'I received your message but could not formulate a response. Please try again.',
          agent_name: meta.agent_name,
          confidence: meta.confidence,
          tone: meta.tone,
          references: meta.references,
        }
      }

      // Handle non-success but still got a response
      if (result && result.response) {
        const text = extractAgentResponseText(result)
        if (text) {
          return {
            content: text,
            agent_name: agent.name,
            confidence: 0,
            tone: agent.personality,
            references: [],
          }
        }
      }

      return null
    } catch (err) {
      console.error(`Error calling agent ${agent.name}:`, err)
      return null
    }
  }

  async function handleSend() {
    const text = messageInput.trim()
    if (!text || isSending) return
    setChatError(null)
    setIsSending(true)

    const userMsg: Message = {
      id: generateUUID(),
      content: text,
      sender: userName,
      senderType: 'user',
      timestamp: new Date().toISOString(),
    }

    const updatedWithUser: Room = {
      ...roomRef.current,
      messages: [...roomRef.current.messages, userMsg],
      lastActivity: new Date().toISOString(),
    }
    updateRoom(updatedWithUser)
    roomRef.current = updatedWithUser
    setMessageInput('')
    setShowMentionPopover(false)

    const responding = getRespondingAgents(text)
    if (responding.length === 0) {
      setChatError('No agents matched your message. Use @AgentName to mention a specific agent, or send a message without @ to broadcast to all listening agents.')
      setIsSending(false)
      return
    }

    // Call agents sequentially
    for (const agent of responding) {
      setTypingAgents(prev => [...prev, agent.name])

      try {
        const response = await callRoomAgent(agent, text, buildContext())

        if (response) {
          const agentMsg: Message = {
            id: generateUUID(),
            content: response.content,
            sender: response.agent_name,
            senderType: 'agent',
            agentId: agent.id,
            timestamp: new Date().toISOString(),
            confidence: response.confidence,
            tone: response.tone,
            references: response.references,
          }

          const updatedWithAgent: Room = {
            ...roomRef.current,
            messages: [...roomRef.current.messages, agentMsg],
            lastActivity: new Date().toISOString(),
          }
          updateRoom(updatedWithAgent)
          roomRef.current = updatedWithAgent
        } else {
          setChatError(`${agent.name} failed to respond. Try sending your message again.`)
        }
      } catch (err) {
        console.error(`Error in agent loop for ${agent.name}:`, err)
        setChatError(`${agent.name} encountered an error.`)
      }

      setTypingAgents(prev => prev.filter(n => n !== agent.name))
    }

    setIsSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape' && showMentionPopover) {
      setShowMentionPopover(false)
    }
  }

  const mentions = parseMentions(messageInput)
  const isTargeted = mentions.length > 0
  const matchedAgentNames = isTargeted
    ? selectedRoom.agents.filter(a => mentions.some(m => a.name.toLowerCase() === m.toLowerCase())).map(a => a.name)
    : []

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left sidebar: room list */}
      <div className="w-56 border-r border-border flex-shrink-0 flex flex-col bg-card/50 hidden md:flex">
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">Rooms</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {rooms.filter(r => r.status === 'active').map(room => (
              <button key={room.id} onClick={() => setSelectedRoom(room)} className={cn('w-full text-left px-3 py-2.5 text-sm tracking-tight transition-colors', selectedRoom.id === room.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50')}>
                <div className="flex items-center gap-2">
                  <FiHash className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{room.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate pl-5">{room.agents.length} agent{room.agents.length !== 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center: chat thread */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FiHash className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold tracking-tight font-serif">{selectedRoom.name}</h2>
            <Badge variant="outline" className="text-xs">{selectedRoom.agents.length} agent{selectedRoom.agents.length !== 1 ? 's' : ''}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tracking-tight flex items-center gap-1">
              <FiUser className="h-3 w-3" />
              {userName}
            </span>
            {isSending && (
              <span className="text-xs tracking-tight flex items-center gap-1" style={{ color: 'hsl(0, 70%, 55%)' }}>
                <FiActivity className="h-3 w-3 animate-pulse" />
                Processing
              </span>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {selectedRoom.messages.length === 0 && typingAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-14 w-14 bg-secondary flex items-center justify-center mb-4">
                  <FiMessageSquare className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight font-serif mb-1">Start the conversation</h3>
                <p className="text-xs text-muted-foreground tracking-tight leading-relaxed max-w-xs">
                  Send a message to begin. Use @AgentName to target a specific agent, or just type to broadcast to all listening agents.
                </p>
                {selectedRoom.agents.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {selectedRoom.agents.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          setMessageInput(`@${agent.name} `)
                          setTimeout(() => inputRef.current?.focus(), 0)
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 border border-border text-xs hover:bg-secondary transition-colors"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: agent.color }} />
                        @{agent.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {selectedRoom.messages.map(msg => {
                  const agent = msg.senderType === 'agent' ? selectedRoom.agents.find(a => a.id === msg.agentId) : null
                  const agentColor = agent?.color ?? AGENT_COLORS[0]
                  return (
                    <div key={msg.id} className={cn('py-3 px-4 transition-colors', msg.senderType === 'agent' ? 'border-l-2 bg-card/50' : '')} style={msg.senderType === 'agent' ? { borderLeftColor: agentColor } : undefined}>
                      <div className="flex items-start gap-3">
                        {msg.senderType === 'agent' ? (
                          <AgentAvatar name={msg.sender} color={agentColor} size="sm" />
                        ) : (
                          <UserAvatar name={msg.sender} size="sm" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-sm font-semibold tracking-tight', msg.senderType === 'agent' ? 'font-serif' : '')}>{msg.sender}</span>
                            {msg.senderType === 'agent' && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border" style={{ borderColor: agentColor, color: agentColor }}>Agent</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                          </div>
                          <div className="text-sm leading-relaxed tracking-tight">
                            {renderMarkdown(msg.content)}
                          </div>
                          {msg.senderType === 'agent' && (
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {typeof msg.confidence === 'number' && msg.confidence > 0 && (
                                <span className="text-xs text-muted-foreground tracking-tight">Confidence: {(msg.confidence * 100).toFixed(0)}%</span>
                              )}
                              {msg.tone && (
                                <span className="text-xs text-muted-foreground tracking-tight capitalize">Tone: {msg.tone}</span>
                              )}
                              {Array.isArray(msg.references) && msg.references.length > 0 && (
                                <span className="text-xs text-muted-foreground tracking-tight">Refs: {msg.references.join(', ')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {typingAgents.map(name => {
                  const ta = selectedRoom.agents.find(a => a.name === name)
                  return <TypingDots key={name} agentName={name} color={ta?.color} />
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {chatError && (
          <div className="mx-4 mb-2 p-2.5 border border-border bg-card text-xs tracking-tight flex items-start gap-2">
            <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(0, 70%, 55%)' }} />
            <span className="flex-1">{chatError}</span>
            <button onClick={() => setChatError(null)} className="ml-2 flex-shrink-0"><FiX className="h-3 w-3 text-muted-foreground" /></button>
          </div>
        )}

        <div className="border-t border-border p-3 flex-shrink-0">
          <div className="relative">
            {showMentionPopover && filteredMentionAgents().length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-72 bg-popover border border-border z-50 overflow-hidden max-h-48 overflow-y-auto">
                <div className="p-1.5">
                  <p className="text-[10px] text-muted-foreground px-2 py-1 uppercase tracking-wider font-medium">Agents in this room</p>
                </div>
                {filteredMentionAgents().map(agent => (
                  <button key={agent.id} onClick={() => insertMention(agent.name)} className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-secondary transition-colors">
                    <AgentAvatar name={agent.name} color={agent.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium tracking-tight">{agent.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{agent.personality} - {agent.trigger === 'mentions' ? 'responds when tagged' : agent.trigger}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {isTargeted && matchedAgentNames.length > 0 && (
                <Badge variant="outline" className="text-xs flex-shrink-0 border-border whitespace-nowrap" style={{ borderColor: 'hsl(0, 70%, 55%)', color: 'hsl(0, 70%, 55%)' }}>
                  @{matchedAgentNames.join(', @')}
                </Badge>
              )}
              {isTargeted && matchedAgentNames.length === 0 && (
                <Badge variant="outline" className="text-xs flex-shrink-0 border-border whitespace-nowrap text-muted-foreground">
                  No match
                </Badge>
              )}
              <Input
                ref={inputRef}
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedRoom.name}... (type @ to mention an agent)`}
                className="shadow-none flex-1"
                disabled={isSending}
              />
              <div className="relative" ref={emojiRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shadow-none h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  disabled={isSending}
                >
                  <FiSmile className="h-4 w-4" />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 w-80 bg-popover border border-border z-50 overflow-hidden">
                    <div className="flex items-center border-b border-border">
                      {EMOJI_CATEGORIES.map((cat, idx) => (
                        <button
                          key={cat.label}
                          onClick={() => setEmojiCategory(idx)}
                          className={cn(
                            'flex-1 px-2 py-2 text-xs tracking-tight transition-colors',
                            emojiCategory === idx
                              ? 'bg-secondary text-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                          )}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <div className="p-2 grid grid-cols-9 gap-0.5 max-h-48 overflow-y-auto">
                      {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => insertEmoji(emoji)}
                          className="h-8 w-8 flex items-center justify-center text-lg hover:bg-secondary transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={handleSend} disabled={!messageInput.trim() || isSending} className="shadow-none" size="sm">
                <FiSend className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar: participants */}
      <div className="w-60 border-l border-border flex-shrink-0 flex flex-col bg-card/50 hidden lg:flex">
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">Participants</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            <Collapsible open={agentsOpen} onOpenChange={setAgentsOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold tracking-tight text-muted-foreground uppercase hover:text-foreground transition-colors">
                <span>Agents ({selectedRoom.agents.length})</span>
                {agentsOpen ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-1">
                {selectedRoom.agents.map(agent => (
                  <button key={agent.id} onClick={() => setAgentDetailId(agent.id === agentDetailId ? null : agent.id)} className={cn('w-full text-left px-2 py-2 flex items-center gap-2.5 transition-colors', agentDetailId === agent.id ? 'bg-secondary' : 'hover:bg-secondary/50')}>
                    <AgentAvatar name={agent.name} color={agent.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium tracking-tight truncate">{agent.name}</p>
                      <PersonalityBadge personality={agent.personality} />
                    </div>
                    {typingAgents.includes(agent.name) && (
                      <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: agent.color }} />
                    )}
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-2" />

            <Collapsible open={usersOpen} onOpenChange={setUsersOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold tracking-tight text-muted-foreground uppercase hover:text-foreground transition-colors">
                <span>Users ({selectedRoom.users.length + 1})</span>
                {usersOpen ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-1">
                {/* Current user always shows */}
                <div className="px-2 py-2 flex items-center gap-2.5">
                  <UserAvatar name={userName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium tracking-tight truncate">{userName}</p>
                    <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">you</Badge>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                {selectedRoom.users.map(user => (
                  <div key={user.id} className="px-2 py-2 flex items-center gap-2.5">
                    <UserAvatar name={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium tracking-tight truncate">{user.name}</p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">{user.role}</Badge>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        {detailAgent && (
          <div className="border-t border-border p-3 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold tracking-tight uppercase text-muted-foreground">Agent Detail</h4>
              <button onClick={() => setAgentDetailId(null)} className="h-5 w-5 flex items-center justify-center hover:bg-secondary transition-colors"><FiX className="h-3 w-3" /></button>
            </div>
            <div className="flex items-center gap-2">
              <AgentAvatar name={detailAgent.name} color={detailAgent.color} />
              <div>
                <p className="text-sm font-bold tracking-tight font-serif">{detailAgent.name}</p>
                <PersonalityBadge personality={detailAgent.personality} />
              </div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground tracking-tight">
              <div><span className="font-medium text-foreground">Prompt: </span>{detailAgent.systemPrompt ? (detailAgent.systemPrompt.length > 120 ? detailAgent.systemPrompt.slice(0, 120) + '...' : detailAgent.systemPrompt) : 'No prompt set'}</div>
              <div><span className="font-medium text-foreground">Trigger: </span><span className="capitalize">{detailAgent.trigger === 'mentions' ? '@mentions only' : detailAgent.trigger}</span></div>
              <div><span className="font-medium text-foreground">Response: </span><span className="capitalize">{detailAgent.responseLength}</span></div>
              <div><span className="font-medium text-foreground">Temp: </span><span className="font-mono">{detailAgent.temperature.toFixed(2)}</span></div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full shadow-none gap-1 text-xs"
              disabled={isSending}
              onClick={() => {
                setMessageInput(prev => `${prev}@${detailAgent.name} `.trimStart())
                setAgentDetailId(null)
                setTimeout(() => inputRef.current?.focus(), 0)
              }}
            >
              <FiSend className="h-3 w-3" />
              Ask {detailAgent.name}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function Page() {
  const [userName, setUserName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'participant'>('participant')
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [newRoomVisibility, setNewRoomVisibility] = useState<'public' | 'private'>('public')
  const [historyRoom, setHistoryRoom] = useState<Room | null>(null)
  const [cloneRoom, setCloneRoom] = useState<Room | null>(null)
  const [cloneCode, setCloneCode] = useState('')
  const [cloneError, setCloneError] = useState('')
  const [cloneSuccess, setCloneSuccess] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const isAdmin = userRole === 'admin'

  // Load sample data on mount
  useEffect(() => {
    setRooms(createSampleData())
  }, [])

  // Theme toggle effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // If no user identity yet, show entry screen
  if (!userName) {
    return <UserIdentityEntry onJoin={(name, role) => { setUserName(name); setUserRole(role) }} />
  }

  function handleCreateRoom() {
    if (!newRoomName.trim()) return
    const newRoom: Room = {
      id: generateUUID(),
      name: newRoomName.trim(),
      description: newRoomDesc.trim(),
      visibility: newRoomVisibility,
      status: 'active',
      agents: [],
      users: [],
      messages: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      cloneCode: '',
    }
    setRooms(prev => [...prev, newRoom])
    setNewRoomName('')
    setNewRoomDesc('')
    setNewRoomVisibility('public')
    setShowCreateModal(false)
    setSelectedRoom(newRoom)
    setCurrentView('room-config')
  }

  function handleSelectRoom(room: Room) {
    setSelectedRoom(room)
    setCurrentView('discussion')
  }

  function handleConfigureRoom(room: Room) {
    setSelectedRoom(room)
    setCurrentView('room-config')
  }

  function handleSaveRoom(updatedRoom: Room) {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
  }

  function handleLaunchRoom(updatedRoom: Room) {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r))
    setSelectedRoom(updatedRoom)
    setCurrentView('discussion')
  }

  function updateRoomFromDiscussion(updated: Room) {
    setRooms(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelectedRoom(updated)
  }

  function switchRoom(room: Room) {
    setSelectedRoom(room)
  }

  function handleViewHistory(room: Room) {
    setHistoryRoom(room)
  }

  function handleCloneRoom(room: Room) {
    setCloneRoom(room)
    setCloneCode('')
    setCloneError('')
    setCloneSuccess(false)
  }

  function executeClone() {
    if (!cloneRoom) return
    if (!cloneRoom.cloneCode) {
      setCloneError('Cloning is not enabled for this room. Ask the admin to set a clone code in room settings.')
      return
    }
    if (cloneCode !== cloneRoom.cloneCode) {
      setCloneError('Invalid secret code. Please try again.')
      return
    }
    const clonedRoom: Room = {
      id: generateUUID(),
      name: `${cloneRoom.name} (Copy)`,
      description: cloneRoom.description,
      visibility: cloneRoom.visibility,
      status: 'active',
      agents: cloneRoom.agents.map(a => ({ ...a, id: generateUUID() })),
      users: [],
      messages: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      cloneCode: '',
    }
    setRooms(prev => [...prev, clonedRoom])
    setCloneSuccess(true)
    setCloneError('')
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen h-screen bg-background text-foreground flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-12 border-b border-border flex items-center justify-between px-4 flex-shrink-0 bg-card/50">
          <div className="flex items-center gap-3">
            <button onClick={() => { setCurrentView('dashboard'); setSelectedRoom(null) }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-6 w-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 70%, 55%)' }}>
                <FiMessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight font-serif">AgentRoom</span>
            </button>
            {currentView !== 'dashboard' && selectedRoom && (
              <>
                <span className="text-muted-foreground text-xs">/</span>
                <span className="text-xs text-muted-foreground tracking-tight">{selectedRoom.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isAdmin ? <FiShield className="h-3 w-3" style={{ color: 'hsl(0, 70%, 55%)' }} /> : <FiUser className="h-3 w-3 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground tracking-tight">{userName}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize" style={isAdmin ? { borderColor: 'hsl(0, 70%, 55%)', color: 'hsl(0, 70%, 55%)' } : {}}>
                {userRole}
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <button
              onClick={() => setIsDark(prev => !prev)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-tight flex items-center gap-1"
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <FiSun className="h-3.5 w-3.5" /> : <FiMoon className="h-3.5 w-3.5" />}
            </button>
            <Separator orientation="vertical" className="h-5" />
            <button
              onClick={() => { setUserName(null); setUserRole('participant') }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-tight flex items-center gap-1"
              title="Switch account"
            >
              <FiEdit3 className="h-3 w-3" />
              <span className="hidden sm:inline">Switch</span>
            </button>
          </div>
        </header>

        {/* MAIN */}
        {currentView === 'dashboard' && (
          <DashboardView
            rooms={rooms}
            onSelect={handleSelectRoom}
            onCreate={() => setShowCreateModal(true)}
            onConfigure={handleConfigureRoom}
            onViewHistory={handleViewHistory}
            onCloneRoom={handleCloneRoom}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isAdmin={isAdmin}
          />
        )}

        {currentView === 'room-config' && selectedRoom && isAdmin && (
          <RoomConfigView
            room={selectedRoom}
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveRoom}
            onLaunch={handleLaunchRoom}
          />
        )}

        {currentView === 'discussion' && selectedRoom && (
          <DiscussionView
            rooms={rooms}
            selectedRoom={selectedRoom}
            setSelectedRoom={switchRoom}
            updateRoom={updateRoomFromDiscussion}
            isAdmin={isAdmin}
            userName={userName}
          />
        )}

        {/* CREATE ROOM MODAL */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="shadow-none border border-border">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold tracking-tight">Create Discussion Room</DialogTitle>
              <DialogDescription className="text-xs tracking-tight">Set up a new collaborative AI discussion space</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium tracking-tight">Room Name *</Label>
                <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="e.g., Product Strategy Review" className="shadow-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium tracking-tight">Description</Label>
                <Textarea value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} placeholder="What will be discussed in this room?" rows={3} className="shadow-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium tracking-tight">Visibility</Label>
                <Select value={newRoomVisibility} onValueChange={v => setNewRoomVisibility(v as 'public' | 'private')}>
                  <SelectTrigger className="shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="shadow-none">Cancel</Button>
              <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()} className="shadow-none">Create Room</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CONVERSATION HISTORY MODAL (admin only) */}
        <Dialog open={!!historyRoom} onOpenChange={open => { if (!open) setHistoryRoom(null) }}>
          <DialogContent className="shadow-none border border-border max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold tracking-tight flex items-center gap-2">
                <FiClock className="h-4 w-4" />
                Conversation History
              </DialogTitle>
              <DialogDescription className="text-xs tracking-tight">
                {historyRoom?.name} - {historyRoom?.messages.length || 0} message{(historyRoom?.messages.length || 0) !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 max-h-[55vh]">
              {historyRoom && historyRoom.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FiMessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground tracking-tight">No messages in this room yet</p>
                </div>
              ) : (
                <div className="space-y-1 pr-4">
                  {historyRoom?.messages.map(msg => {
                    const agent = msg.senderType === 'agent' ? historyRoom.agents.find(a => a.id === msg.agentId) : null
                    const agentColor = agent?.color ?? AGENT_COLORS[0]
                    return (
                      <div key={msg.id} className={cn('py-2.5 px-3 text-sm', msg.senderType === 'agent' ? 'border-l-2 bg-card/50' : '')} style={msg.senderType === 'agent' ? { borderLeftColor: agentColor } : undefined}>
                        <div className="flex items-center gap-2 mb-1">
                          {msg.senderType === 'agent' ? (
                            <AgentAvatar name={msg.sender} color={agentColor} size="sm" />
                          ) : (
                            <UserAvatar name={msg.sender} size="sm" />
                          )}
                          <span className={cn('text-xs font-semibold tracking-tight', msg.senderType === 'agent' ? 'font-serif' : '')}>{msg.sender}</span>
                          {msg.senderType === 'agent' && <Badge variant="outline" className="text-[9px] h-3.5 px-1" style={{ borderColor: agentColor, color: agentColor }}>Agent</Badge>}
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground tracking-tight leading-relaxed pl-8 whitespace-pre-wrap">{msg.content.length > 300 ? msg.content.slice(0, 300) + '...' : msg.content}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHistoryRoom(null)} className="shadow-none text-xs">Close</Button>
              {historyRoom && historyRoom.messages.length > 0 && (
                <Button onClick={() => { setSelectedRoom(historyRoom); setCurrentView('discussion'); setHistoryRoom(null) }} className="shadow-none text-xs gap-1">
                  <FiMessageSquare className="h-3 w-3" />
                  Open Room
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CLONE ROOM MODAL */}
        <Dialog open={!!cloneRoom} onOpenChange={open => { if (!open) { setCloneRoom(null); setCloneCode(''); setCloneError(''); setCloneSuccess(false) } }}>
          <DialogContent className="shadow-none border border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold tracking-tight flex items-center gap-2">
                <FiCopy className="h-4 w-4" />
                Clone Room
              </DialogTitle>
              <DialogDescription className="text-xs tracking-tight">
                Create a copy of &quot;{cloneRoom?.name}&quot; with all its agents (messages are not copied)
              </DialogDescription>
            </DialogHeader>
            {cloneSuccess ? (
              <div className="py-6 text-center">
                <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center bg-green-500/10">
                  <FiCopy className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-sm font-medium tracking-tight mb-1">Room cloned successfully</p>
                <p className="text-xs text-muted-foreground tracking-tight">
                  &quot;{cloneRoom?.name} (Copy)&quot; has been created with {cloneRoom?.agents.length} agent{(cloneRoom?.agents.length || 0) !== 1 ? 's' : ''}
                </p>
                <Button onClick={() => { setCloneRoom(null); setCloneSuccess(false) }} className="shadow-none mt-4 text-xs">Done</Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-2">
                  <div className="p-3 border border-border bg-card space-y-2">
                    <p className="text-xs font-medium tracking-tight">What will be cloned:</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FiCpu className="h-3 w-3 flex-shrink-0" />
                      <span>{cloneRoom?.agents.length} agent{(cloneRoom?.agents.length || 0) !== 1 ? 's' : ''} with full configuration</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FiSettings className="h-3 w-3 flex-shrink-0" />
                      <span>Room settings and visibility</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground tracking-tight mt-1">Messages and users are not copied</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium tracking-tight flex items-center gap-1">
                      <FiKey className="h-3 w-3" />
                      Secret Code
                    </Label>
                    <Input
                      type="password"
                      value={cloneCode}
                      onChange={e => { setCloneCode(e.target.value); setCloneError('') }}
                      placeholder="Enter the secret code to clone"
                      className="shadow-none"
                      autoFocus
                    />
                    {cloneError && (
                      <p className="text-xs tracking-tight flex items-center gap-1" style={{ color: 'hsl(0, 70%, 55%)' }}>
                        <FiAlertCircle className="h-3 w-3" />
                        {cloneError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground tracking-tight">
                      Ask the room admin for the clone code
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setCloneRoom(null); setCloneCode(''); setCloneError('') }} className="shadow-none text-xs">Cancel</Button>
                  <Button onClick={executeClone} disabled={!cloneCode} className="shadow-none text-xs gap-1">
                    <FiCopy className="h-3 w-3" />
                    Clone Room
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* FOOTER */}
        <footer className="border-t border-border px-4 py-2 flex-shrink-0 bg-card/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground tracking-tight">Room Agent Connected</span>
                <span className="text-xs text-muted-foreground tracking-tight font-mono">({AGENT_ID.slice(0, 8)}...)</span>
              </div>
              {selectedRoom && selectedRoom.agents.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tracking-tight">|</span>
                  {selectedRoom.agents.map(agent => (
                    <span key={agent.id} className="text-xs text-muted-foreground tracking-tight flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
                      {agent.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground tracking-tight">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
